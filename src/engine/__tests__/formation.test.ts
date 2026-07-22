import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  resolveNpcLeadership, decideFormationFate, materializeForced, resolveForcedChoice,
  openNpcContest,
} from '../career';
import { nextStep } from '../scheduler';
import { GameState, OfficeId } from '../../types/game';
import { CABINET_OFFICES } from '../../data/offices';
import { Rng } from '../rng';

function makeGame(seed = 7): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 44, region: 'yorkshire',
    background: 'teacher', partyId: 'lab',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2024', seed, causes: ['publicServices'],
  };
  return createNewGame(input);
}

/** seat the player in a given own-party cabinet post */
function seatPlayer(g: GameState, officeId: OfficeId): void {
  const post = g.government.cabinet.find((p) => p.officeId === officeId)!;
  const displaced = g.characters[post.characterId];
  if (displaced) displaced.officeId = null;
  post.characterId = 'player';
  g.player.officeId = officeId;
  g.player.officeSinceDay = g.day;
}

function ownGovPosts(g: GameState) {
  return g.government.cabinet.filter((p) =>
    p.characterId !== 'player' && g.characters[p.characterId]?.partyId === 'lab');
}

describe('new-government formation on a mid-term NPC leadership change', () => {
  it('reshapes the bench heterogeneously and schedules the player-fate beat', () => {
    const g = makeGame();
    // player is a sitting Labour (governing) minister
    seatPlayer(g, 'sos_home');
    const before = ownGovPosts(g).map((p) => p.characterId);

    resolveNpcLeadership(g, new Rng(5), 'lab'); // an NPC takes over the player's party mid-term

    const afterPosts = ownGovPosts(g);
    const dropped = before.filter((id) => g.characters[id]?.officeId == null).length;
    // heterogeneous: some dropped, but NOT a full purge (retentions remain)
    expect(dropped).toBeGreaterThanOrEqual(1);
    expect(dropped).toBeLessThan(before.length);
    // the player's own seat is untouched by the NPC reshape
    expect(g.government.cabinet.find((p) => p.officeId === 'sos_home')!.characterId).toBe('player');
    expect(g.player.officeId).toBe('sos_home');
    // a player-facing fate beat is scheduled
    expect(typeof g.player.flags._npcLeaderReshuffleBy).toBe('number');
    // no empty or double-booked seats
    const holders = afterPosts.map((p) => p.characterId);
    expect(new Set(holders).size).toBe(holders.length);
    for (const p of afterPosts) expect(g.characters[p.characterId]?.officeId).toBe(p.officeId);
  });

  it('sometimes promotes a sitting minister into the new government (a lateral)', () => {
    let sawLateral = false;
    for (let seed = 1; seed <= 10 && !sawLateral; seed++) {
      const g = makeGame(seed);
      // weaken the great offices so they are likely churned, strengthen others so they move up
      for (const p of g.government.cabinet) {
        const c = g.characters[p.characterId];
        if (!c || c.partyId !== 'lab') continue;
        c.competence = ['sos_treasury', 'sos_home', 'sos_foreign'].includes(p.officeId) ? 30 : 82;
      }
      const snap = new Map<string, string | null>();
      for (const p of g.government.cabinet) snap.set(p.characterId, g.characters[p.characterId]?.officeId ?? null);
      resolveNpcLeadership(g, new Rng(seed), 'lab');
      sawLateral = [...snap.entries()].some(([id, was]) => {
        const now = g.characters[id]?.officeId ?? null;
        return was != null && now != null && was !== now && CABINET_OFFICES.includes(now as OfficeId);
      });
    }
    expect(sawLateral).toBe(true);
  });

  it('skipReshape leaves the bench untouched (the general-election aftermath path)', () => {
    const g = makeGame();
    const before = ownGovPosts(g).map((p) => p.characterId);
    resolveNpcLeadership(g, new Rng(5), 'lab', undefined, { skipReshape: true });
    const after = ownGovPosts(g).map((p) => p.characterId);
    // no minister dropped to the backbenches by a reshape that didn't run
    const dropped = before.filter((id) => g.characters[id]?.officeId == null).length;
    expect(dropped).toBe(0);
    expect(after.length).toBe(before.length);
  });
});

describe('decideFormationFate', () => {
  it('keeps or elevates a well-regarded minister and sacks a weak/scandal-hit one', () => {
    const strong = makeGame();
    seatPlayer(strong, 'sos_home');
    strong.player.stats = { profile: 80, partyStanding: 80, competence: 85, constituencyApproval: 70, integrity: 70 };
    const rel = strong.relationships.find((r) => r.kind === 'leader');
    if (rel) rel.value = 60;
    const fateStrong = decideFormationFate(strong, new Rng(1)).fate;
    expect(['retained', 'promoted', 'moved']).toContain(fateStrong);

    const weak = makeGame();
    seatPlayer(weak, 'sos_home');
    weak.player.stats = { profile: 20, partyStanding: 20, competence: 25, constituencyApproval: 30, integrity: 30 };
    weak.player.flags.scandal = true;
    const relW = weak.relationships.find((r) => r.kind === 'leader');
    if (relW) relW.value = -40;
    expect(decideFormationFate(weak, new Rng(1)).fate).toBe('sacked');
  });

  it('can bring a strong backbencher into the new government', () => {
    let sawBroughtIn = false;
    for (let seed = 1; seed <= 12 && !sawBroughtIn; seed++) {
      const g = makeGame(seed);
      g.player.officeId = null; // a backbencher of the governing party
      g.player.stats = { profile: 75, partyStanding: 78, competence: 80, constituencyApproval: 70, integrity: 70 };
      const rel = g.relationships.find((r) => r.kind === 'leader');
      if (rel) rel.value = 55;
      const { fate, officeId } = decideFormationFate(g, new Rng(seed));
      if (fate === 'broughtIn') { sawBroughtIn = true; expect(officeId).toBeTruthy(); }
    }
    expect(sawBroughtIn).toBe(true);
  });
});

describe('governmentFormation card resolution', () => {
  const build = (g: GameState, fate: string, officeId?: OfficeId) => {
    const leaderId = g.government.pmId;
    return materializeForced(g, new Rng(1), { kind: 'governmentFormation', payload: { leaderId, fate, officeId } });
  };

  it('retained: serve on keeps the office; resign in protest vacates it', () => {
    const g = makeGame();
    seatPlayer(g, 'sos_home');
    const serve = build(g, 'retained');
    resolveForcedChoice(g, new Rng(1), serve, 0);
    expect(g.player.officeId).toBe('sos_home');

    const g2 = makeGame();
    seatPlayer(g2, 'sos_home');
    const resign = build(g2, 'retained');
    resolveForcedChoice(g2, new Rng(1), resign, 1);
    expect(g2.player.officeId).toBeNull();
  });

  it('moved: accept takes the new office; refuse goes to the back benches', () => {
    const g = makeGame();
    seatPlayer(g, 'sos_home');
    const card = build(g, 'moved', 'sos_health');
    resolveForcedChoice(g, new Rng(1), card, 0);
    expect(g.player.officeId).toBe('sos_health');

    const g2 = makeGame();
    seatPlayer(g2, 'sos_home');
    const refuse = build(g2, 'moved', 'sos_health');
    resolveForcedChoice(g2, new Rng(1), refuse, 1);
    expect(g2.player.officeId).toBeNull();
  });

  it('sacked vacates the office; brought-in accept takes it', () => {
    const g = makeGame();
    seatPlayer(g, 'sos_home');
    const sack = build(g, 'sacked');
    resolveForcedChoice(g, new Rng(1), sack, 0);
    expect(g.player.officeId).toBeNull();

    const g2 = makeGame();
    g2.player.officeId = null; // backbencher
    const brought = build(g2, 'broughtIn', 'sos_health');
    resolveForcedChoice(g2, new Rng(1), brought, 0);
    expect(g2.player.officeId).toBe('sos_health');
  });
});

describe('fix pass — audit follow-ups', () => {
  // Fix #3: a junior minister (not a cabinet post) is retained/moved/sacked, not treated
  // as a backbencher to be "brought in"
  it('classifies a Minister of State as a sitting minister, not a backbencher', () => {
    let anyInOffice = false;
    for (let seed = 1; seed <= 8; seed++) {
      const g = makeGame(seed);
      g.player.officeId = 'min_health'; // tier-3 Minister of State (not in CABINET_OFFICES)
      g.player.stats = { profile: 70, partyStanding: 72, competence: 78, constituencyApproval: 65, integrity: 65 };
      const rel = g.relationships.find((r) => r.kind === 'leader');
      if (rel) rel.value = 40;
      const { fate } = decideFormationFate(g, new Rng(seed));
      expect(['retained', 'moved', 'promoted', 'sacked']).toContain(fate);
      expect(['broughtIn', 'none']).not.toContain(fate);
      anyInOffice = true;
    }
    expect(anyInOffice).toBe(true);
  });

  // Fix #4: the "brought in" copy reflects the destination rank
  it('brought-in wording matches the destination office rank', () => {
    const textFor = (officeId: OfficeId) => {
      const g = makeGame();
      g.player.officeId = null; // a genuine backbencher of the governing party
      const card = materializeForced(g, new Rng(1), {
        kind: 'governmentFormation', payload: { leaderId: g.government.pmId, fate: 'broughtIn', officeId },
      });
      return resolveForcedChoice(g, new Rng(1), card, 0).text;
    };
    expect(textFor('sos_health')).toContain('the cabinet');
    expect(textFor('sos_health')).toContain('seat at the table');
    const mos = textFor('min_health');
    expect(mos).toContain('a ministerial role');
    expect(mos).not.toContain('seat at the table');
    const junior = textFor('pps');
    expect(junior).toContain('a junior role');
    expect(junior).not.toContain('seat at the table');
  });

  // Fix #2: the fate card must not fire if circumstances changed after it was scheduled.
  // These are deliberately set up so the fate WOULD be non-none (a card would fire without
  // the guard) — otherwise the test would be tautological. The flag being consumed proves
  // the scheduler handler was actually reached and the guard (not pre-emption) suppressed it.
  it('suppresses the fate card for a player whose party is no longer front-bench', () => {
    const g = makeGame();
    g.player.partyId = 'green';        // seat kept, but party is neither gov nor opposition
    g.player.officeId = 'min_health';  // still holds an office → a fate WOULD be decided
    // control: with a held office, decideFormationFate never returns 'none'
    expect(decideFormationFate(g, new Rng(3)).fate).not.toBe('none');
    g.player.flags._npcLeaderReshuffleBy = g.day;
    g.currentCard = null;
    g.forcedQueue.length = 0;
    nextStep(g, new Rng(3));
    // handler ran (flag consumed) but the onFrontbenchTrack guard blocked the card
    expect(g.player.flags._npcLeaderReshuffleBy).toBeUndefined();
    const cur = g.currentCard as { kind?: string } | null;
    expect(cur?.kind).not.toBe('governmentFormation');
    expect(g.forcedQueue.some((e) => e.kind === 'governmentFormation')).toBe(false);
  });

  it('suppresses the fate card for a seated minister who lost their seat', () => {
    const g = makeGame();
    seatPlayer(g, 'sos_home'); // a sitting cabinet minister — a fate WOULD be decided
    expect(decideFormationFate(g, new Rng(3)).fate).not.toBe('none');
    g.player.hasSeat = false;  // ...but the seat is gone since the beat was scheduled
    g.player.flags._npcLeaderReshuffleBy = g.day;
    g.currentCard = null;
    g.forcedQueue.length = 0;
    nextStep(g, new Rng(3));
    const cur = g.currentCard as { kind?: string } | null;
    expect(cur?.kind).not.toBe('governmentFormation');
    expect(g.forcedQueue.some((e) => e.kind === 'governmentFormation')).toBe(false);
  });

  // Fix #5: post-election successions run a longer interim than mid-term ones
  it('elongates a post-election contest by the extra-delay days', () => {
    const base = makeGame();
    openNpcContest(base, new Rng(1), 'con');
    const baseDelay = base.pendingContests![0].resolveDay - base.day;
    expect(baseDelay).toBeGreaterThanOrEqual(28);
    expect(baseDelay).toBeLessThanOrEqual(56);

    const elongated = makeGame();
    openNpcContest(elongated, new Rng(1), 'con', { extraDelayDays: 20 });
    const longDelay = elongated.pendingContests![0].resolveDay - elongated.day;
    // same seed + identical code path before the additive delay → exactly +20
    expect(longDelay - baseDelay).toBe(20);
  });
});
