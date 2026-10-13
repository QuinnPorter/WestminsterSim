import { describe, expect, it } from 'vitest';
import { GameState, PartyId } from '../../types/game';
import { NI_ASSEMBLY, NI_EXECUTIVE_HISTORY, formationLaw } from '../../data/niAssembly';
import { cabinetOfficesFor } from '../../data/offices';
import { decideFormation, executiveInBeing, hasOfficialOpposition } from '../executive';
import {
  COLLAPSE_CAP_DAYS, catchUpExecutive, collapseExecutive, collapseTick, restoreExecutive,
  secretaryOfStateMoves, stormontStoodOn,
} from '../collapse';
import {
  applyElectionAftermath, giveOffice, playerIsPM, playerLeaderRole, playerOfficeTitle,
} from '../career';
import { installPlayerAsLeader, jumpToArena } from '../arena';
import { runElection } from '../election';
import { updatePolling } from '../polling';
import { createNewGame } from '../newGame';
import { nextStep } from '../scheduler';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from '../turn';
import { resolveTokens } from '../cardEngine';
import { isoToDay } from '../clock';
import { Rng } from '../rng';

const sum = (m: Partial<Record<PartyId, number>>) => Object.values(m).reduce((a, b) => a + (b ?? 0), 0);

function game(opts: { seed: number; arena?: 'uk' | 'ni'; election?: string; partyId?: PartyId; region?: GameState['player']['region']; era?: '2010' | '2015' | '2017' | '2019' | '2024' }): GameState {
  return createNewGame({
    name: 'Test Subject', gender: 'f', age: 40, region: opts.region ?? 'ni', background: 'lawyer',
    partyId: opts.partyId ?? 'dup',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: opts.era ?? '2010', seed: opts.seed,
    ...(opts.arena && opts.arena !== 'uk' ? { arena: opts.arena, devolvedElection: opts.election ?? '2011-05-05' } : {}),
  });
}

function holders(g: GameState): Record<string, PartyId> {
  const out: Record<string, PartyId> = {};
  for (const post of g.government.cabinet) {
    out[post.officeId] = post.characterId === 'player' ? g.player.partyId : g.characters[post.characterId].partyId;
  }
  return out;
}

/** play turns, answering every card with its first choice (declining the Westminster offer) */
function play(g: GameState, rng: Rng, turns: number, onCard?: (g: GameState) => void): void {
  for (let turn = 0; turn < turns && !g.gameOver; turn++) {
    if (!g.currentCard) nextStep(g, rng);
    const card = g.currentCard;
    if (!card) break;
    onCard?.(g);
    if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
    resolveChoiceCore(g, rng, card.kind === 'ukRecruit' ? 1 : 0);
    if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
    continueCore(g, rng);
  }
}

describe('the data', () => {
  it('2017 and 2022 are ninety-seat Assemblies with every constituency summing to five', () => {
    for (const snap of NI_ASSEMBLY.filter((s) => s.election >= '2017')) {
      expect(sum(snap.seats)).toBe(90);
      const totals: Partial<Record<PartyId, number>> = {};
      for (const row of Object.values(snap.districtSeats!)) {
        expect(sum(row)).toBe(5);
        for (const [p, n] of Object.entries(row) as [PartyId, number][]) totals[p] = (totals[p] ?? 0) + n;
      }
      expect(totals).toEqual(snap.seats);
      expect(snap.executive.status).toBe('collapsed');
      expect(snap.executive.blocker).toBeDefined();
    }
    expect(NI_ASSEMBLY.find((s) => s.election === '2017-03-02')!.seats).toEqual({ dup: 28, sf: 27, sdlp: 12, uup: 10, alliance: 8, gpni: 2, pbp: 1, tuv: 1, ind: 1 });
    expect(NI_ASSEMBLY.find((s) => s.election === '2022-05-05')!.seats).toEqual({ sf: 27, dup: 25, alliance: 17, uup: 9, sdlp: 8, tuv: 1, pbp: 1, ind: 2 });
  });
  it('the chronology is in order and the formation law changes with the 2022 Act', () => {
    const days = NI_EXECUTIVE_HISTORY.map((e) => isoToDay(e.on));
    expect([...days].sort((a, b) => a - b)).toEqual(days);
    expect(formationLaw(isoToDay('2017-01-09'))).toMatchObject({ afterElection: 14, afterVacancy: 7 });
    expect(formationLaw(isoToDay('2022-05-05'))).toMatchObject({ afterElection: 168, afterVacancy: 168, caretakerAfterVacancy: 336 });
    expect(stormontStoodOn(isoToDay('2016-12-01'))).toBe(true);
    expect(stormontStoodOn(isoToDay('2018-06-01'))).toBe(false);
    expect(stormontStoodOn(isoToDay('2021-06-01'))).toBe(true);
    expect(stormontStoodOn(isoToDay('2023-06-01'))).toBe(false);
    expect(stormontStoodOn(isoToDay('2024-07-04'))).toBe(true);
  });
});

describe('a collapsed start', () => {
  it('2017: no Executive, no ministers, the SF blocker, and a DUP leader who is not First Minister', () => {
    const g = game({ seed: 3, arena: 'ni', election: '2017-03-02', partyId: 'dup', era: '2015' });
    const ex = g.government.executive!;
    expect(sum(g.seats)).toBe(90);
    expect(ex.status).toBe('collapsed');
    expect(ex.blocker).toBe('sf');
    expect(ex.cause).toBe('noNomination');
    expect(ex.collapsedDay).toBe(isoToDay('2017-01-09'));
    expect(g.government.cabinet).toEqual([]);
    expect(g.government.governingParty).toBe('dup');
    expect(g.government.coalitionPartner).toBe('sf');
    expect(g.government.deputyPmId).toBeUndefined();
    expect(executiveInBeing(g)).toBe(false);
    expect(g.pmHistory.filter((t) => t.endDay === null)).toHaveLength(0);
    // the opposition is whoever sits outside the Executive the designates would form
    expect(ex.parties).not.toContain(g.government.oppositionParty);
    expect(hasOfficialOpposition(g)).toBe(false);
    // the player as DUP leader is the designate, not the head
    installPlayerAsLeader(g, new Rng(3));
    expect(g.government.pmId).toBe('player');
    expect(playerIsPM(g)).toBe(false);
    expect(playerLeaderRole(g)).toBe('minorLeader');
    expect(playerOfficeTitle(g)).toMatch(/^Leader of the/);
    expect(resolveTokens(g, '{pm}')).toBe(g.player.name);
  });

  it('2022: the 2020 ministers stay as caretakers, and leave on 28 October 2022', () => {
    const g = game({ seed: 4, arena: 'ni', election: '2022-05-05', partyId: 'alliance', era: '2019' });
    const ex = g.government.executive!;
    expect(ex.status).toBe('collapsed');
    expect(ex.blocker).toBe('dup');
    expect(ex.caretakerUntil).toBe(isoToDay('2022-10-28'));
    expect(g.government.governingParty).toBe('sf');
    expect(g.government.coalitionPartner).toBe('dup');
    const held = holders(g);
    expect(Object.keys(held).sort()).toEqual([...cabinetOfficesFor('ni')].sort());
    expect(held.ni_minister_justice).toBe('alliance');
    expect(new Set(Object.values(held))).toEqual(new Set(['dup', 'sf', 'sdlp', 'uup', 'alliance']));
    const rng = new Rng(4);
    g.day = isoToDay('2022-10-29');
    collapseTick(g, rng);
    expect(g.government.cabinet).toEqual([]);
    expect(ex.caretakerUntil).toBeUndefined();
  });
});

describe('falling and re-forming', () => {
  it('a collapse closes the First Minister’s tenure, clears the deputy, keeps the designates and sets the clock', () => {
    const g = game({ seed: 5, arena: 'ni', partyId: 'sf' });
    installPlayerAsLeader(g, new Rng(5));
    expect(g.government.deputyPmId).toBe('player');
    collapseExecutive(g, 'dfmWalkout', 'sf');
    const ex = g.government.executive!;
    expect(ex.status).toBe('collapsed');
    expect(ex.collapsedDay).toBe(g.day);
    expect(ex.deadline).toBe(g.day + 7);
    expect(ex.caretakerUntil).toBe(g.nextElectionBy);
    expect(ex.parties).toEqual(['dup', 'sf', 'alliance', 'uup', 'sdlp']);
    expect(g.government.pmId).not.toBe('');
    expect(g.pmHistory.filter((t) => t.endDay === null)).toHaveLength(0);
    expect(g.government.deputyPmId).toBeUndefined();
    expect(g.player.flags._isDeputyPM).toBeUndefined();
    expect(playerOfficeTitle(g)).toBe('Leader of Sinn Féin');
    // the ministers stay as caretakers until the law removes them
    expect(g.government.cabinet.length).toBeGreaterThan(0);
    // and a deal brings it back with a fresh tenure
    restoreExecutive(g, new Rng(6));
    expect(g.government.executive?.status).toBe('formed');
    expect(g.government.executive?.formedDay).toBe(g.day);
    expect(g.pmHistory.filter((t) => t.endDay === null)).toHaveLength(1);
    expect(g.government.deputyPmId).toBe('player');
  });

  it('the Secretary of State extends up to three times, then calls an election forty-five days out', () => {
    const g = game({ seed: 7, arena: 'ni', election: '2022-05-05', partyId: 'uup', era: '2019' });
    const ex = g.government.executive!;
    const rng = new Rng(1);
    let elections = 0;
    for (let i = 0; i < 6; i++) {
      const before = g.nextElectionBy;
      secretaryOfStateMoves(g, rng);
      if (g.nextElectionBy !== before) elections++;
    }
    expect(ex.extensions).toBeLessThanOrEqual(3);
    expect(elections).toBeGreaterThanOrEqual(1);
    expect(g.nextElectionBy - g.day).toBeLessThanOrEqual(45 + 168);
  });

  it('after an ordinary election the heads are usually nominated; after an extraordinary one they usually are not', () => {
    const formed = game({ seed: 8, arena: 'ni', partyId: 'dup' });
    const collapsed = game({ seed: 8, arena: 'ni', election: '2017-03-02', partyId: 'dup', era: '2015' });
    let f1 = 0; let f2 = 0;
    for (let s = 1; s <= 100; s++) {
      if (!decideFormation(formed, new Rng(s), { fm: 'dup', dfm: 'sf' })) f1++;
      if (!decideFormation(collapsed, new Rng(s), { fm: 'dup', dfm: 'sf' })) f2++;
    }
    expect(f1).toBeGreaterThan(80);
    expect(f2).toBeGreaterThan(20);
    expect(f2).toBeLessThan(60);
    // the player's party is never the one rolled against...
    for (let s = 1; s <= 50; s++) {
      const d = decideFormation(collapsed, new Rng(s), { fm: 'dup', dfm: 'sf' }, { playerLeads: 'dup' });
      if (d) expect(d.blocker).toBe('sf');
    }
    // ...and a player who has been holding out stays out, without a roll, until the card asks
    for (let s = 1; s <= 10; s++) {
      const d = decideFormation(collapsed, new Rng(s), { fm: 'dup', dfm: 'sf' }, { playerLeads: 'sf' });
      expect(d?.blocker).toBe('sf');
    }
    // a formed Executive has no hold-out to carry over
    expect(decideFormation(formed, new Rng(3), { fm: 'dup', dfm: 'sf' }, { playerLeads: 'sf' })?.blocker ?? 'dup').toBe('dup');
  });

  it('a collapsed start resolves within the cap in every seed, usually within two years', () => {
    const years: number[] = [];
    for (let seed = 1; seed <= 24; seed++) {
      const g = game({ seed, arena: 'ni', election: '2022-05-05', partyId: 'alliance', era: '2019' });
      const rng = new Rng(seed);
      const start = g.day;
      let formedAt: number | null = null;
      play(g, rng, 400, (s) => {
        if (formedAt === null && s.government.executive?.status === 'formed') formedAt = s.day;
        // never a standing Executive with nobody in it
        if (s.government.executive?.status === 'formed') expect(s.government.cabinet.length).toBeGreaterThan(0);
        if (s.government.executive?.status === 'collapsed') expect(s.government.executive.collapsedDay).toBeDefined();
      });
      expect(formedAt, `seed ${seed}`).not.toBeNull();
      expect(formedAt! - isoToDay('2022-02-03'), `seed ${seed}`).toBeLessThanOrEqual(COLLAPSE_CAP_DAYS + 90);
      years.push((formedAt! - start) / 365);
    }
    const sorted = [...years].sort((a, b) => a - b);
    expect(sorted[Math.floor(sorted.length / 2)]).toBeLessThan(2.2);
  });

  it('a 2016 start collapses within five years in a plausible fraction of runs', () => {
    // WALKOUT_HAZARD 0.0025 per tick, strain-scaled, over roughly 60 ticks a term: a
    // few in ten careers see the Executive fall before 2021
    let fell = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const g = game({ seed, arena: 'ni', election: '2016-05-05', partyId: 'uup', era: '2015' });
      const rng = new Rng(seed);
      let collapsed = false;
      play(g, rng, 70, (s) => { if (s.government.executive?.status === 'collapsed') collapsed = true; });
      if (collapsed) fell++;
    }
    expect(fell).toBeGreaterThanOrEqual(1);
    expect(fell).toBeLessThanOrEqual(12);
  });
});

describe('the player as a head', () => {
  it('a player deputy First Minister who walks out collapses the Executive and loses the overlay', () => {
    const g = game({ seed: 9, arena: 'ni', partyId: 'sf' });
    installPlayerAsLeader(g, new Rng(9));
    const rng = new Rng(9);
    g.forcedQueue.push({ kind: 'executiveCrisis' });
    nextStep(g, rng);
    expect(g.currentCard?.kind).toBe('executiveCrisis');
    resolveChoiceCore(g, rng, 0);
    expect(g.government.executive?.status).toBe('collapsed');
    expect(g.government.executive?.blocker).toBe('sf');
    expect(g.player.flags._isDeputyPM).toBeUndefined();
    // and as the blocker, the talks come to them; taking the deal re-forms it
    g.currentCard = null as GameState['currentCard'];
    g.forcedQueue.push({ kind: 'executiveTalks', payload: { context: 'deal' } });
    nextStep(g, rng);
    expect(g.currentCard?.kind).toBe('executiveTalks');
    resolveChoiceCore(g, rng, 0);
    expect(g.government.executive?.status).toBe('formed');
    expect(g.government.deputyPmId).toBe('player');
  });

  it('a player First Minister holding out at the cap faces the party', () => {
    const g = game({ seed: 10, arena: 'ni', partyId: 'dup' });
    installPlayerAsLeader(g, new Rng(10));
    collapseExecutive(g, 'fmWalkout', 'dup');
    const rng = new Rng(10);
    g.day += COLLAPSE_CAP_DAYS + 1;
    expect(collapseTick(g, rng)).toBe(true);
    expect(g.forcedQueue[0]?.kind).toBe('executiveTalks');
    expect(g.forcedQueue[0]?.payload?.context).toBe('cap');
    nextStep(g, rng);
    resolveChoiceCore(g, rng, 1);
    expect((g.forcedQueue as { kind: string }[]).some((e) => e.kind === 'partyCoup')).toBe(true);
    expect(g.government.executive?.status).toBe('collapsed');
  });

  it('a minister of a collapsing Executive keeps their brief as a caretaker and loses it when the caretakers go', () => {
    const g = game({ seed: 11, arena: 'ni', partyId: 'dup' });
    const rng = new Rng(11);
    giveOffice(g, rng, 'ni_minister_finance', 'promoted');
    collapseExecutive(g, 'dfmWalkout', 'sf');
    expect(g.player.officeId).toBe('ni_minister_finance');
    g.day = g.nextElectionBy;
    collapseTick(g, rng);
    expect(g.player.officeId).toBeNull();
    expect(g.history.some((h) => h.kind === 'event' && /leaves office as/.test((h as { headline: string }).headline))).toBe(true);
  });
});

describe('the dormant Assembly through real history', () => {
  it('a 2019 Commons career drafted to Stormont in 2024 finds the Executive the real deal restored', () => {
    const g = game({ seed: 31, arena: 'uk', partyId: 'lab', region: 'london', era: '2024' });
    g.player.region = 'ni';
    g.player.stats.profile = 80;
    jumpToArena(g, new Rng(31), 'ni', 'dup');
    expect(g.government.executive?.status).toBe('formed');
    expect(g.government.executive?.parties).toEqual(['sf', 'dup', 'alliance', 'uup']);
    expect(g.government.governingParty).toBe('sf');
    expect(g.government.oppositionParty).toBe('sdlp');
    expect(g.pmHistory.filter((t) => t.endDay === null)).toHaveLength(1);
  });

  it('a 2019 Westminster start sees Stormont collapsed in its tokens, then restored', () => {
    const g = game({ seed: 32, arena: 'uk', partyId: 'dup', region: 'ni', era: '2019' });
    expect(resolveTokens(g, '{othergov}')).toBe('the Northern Ireland Office');
    g.day = isoToDay('2021-01-01');
    expect(resolveTokens(g, '{othergov}')).toBe('the Executive');
  });

  it('a 2016 Stormont career that leaves for Westminster and comes back finds the Executive history left behind', () => {
    const g = game({ seed: 34, arena: 'ni', election: '2016-05-05', partyId: 'dup', era: '2015' });
    g.player.stats.profile = 80;
    g.day = isoToDay('2016-12-01');
    const rng = new Rng(34);
    jumpToArena(g, rng, 'uk', 'con');
    expect(g.arena).toBe('uk');
    g.day = isoToDay('2019-06-01');
    jumpToArena(g, rng, 'ni', 'dup');
    expect(g.arena).toBe('ni');
    expect(g.government.executive?.status).toBe('collapsed');
    expect(g.government.executive?.collapsedDay).toBe(isoToDay('2017-01-09'));
    expect(sum(g.seats)).toBe(90);
    expect(g.pmHistory.filter((t) => t.endDay === null)).toHaveLength(0);
    expect(playerIsPM(g)).toBe(false);
  });

  it('the catch-up plays the chronology: a 2016 Assembly left dormant collapses in January 2017 and re-forms in January 2020', () => {
    const g = game({ seed: 33, arena: 'ni', election: '2016-05-05', partyId: 'dup', era: '2015' });
    const rng = new Rng(33);
    const stormont = g;
    stormont.day = isoToDay('2016-12-01');
    catchUpExecutive(stormont, rng, isoToDay('2017-02-01'));
    expect(stormont.government.executive?.status).toBe('collapsed');
    expect(stormont.government.executive?.collapsedDay).toBe(isoToDay('2017-01-09'));
    expect(stormont.nextElectionBy).toBeLessThanOrEqual(isoToDay('2017-03-02'));
  });
});

describe('a Stormont election fought during a collapse', () => {
  it('a 2017 start fights the 2022 election and the designates are re-set; the smoke stays clean', () => {
    const g = game({ seed: 41, arena: 'ni', election: '2017-03-02', partyId: 'sf', era: '2015' });
    const rng = new Rng(41);
    g.day = g.nextElectionBy;
    updatePolling(g, rng, g.day);
    const { result, playerWonSeat } = runElection(g, rng);
    applyElectionAftermath(g, rng, result, playerWonSeat);
    expect(result.formation).toBeDefined();
    expect(['formed', 'collapsed']).toContain(g.government.executive?.status);
    expect(g.forcedQueue.some((e) => e.kind === 'coalitionTalks' || e.kind === 'coalitionOffer')).toBe(false);
    expect(sum(g.seats)).toBe(90);
  });

  for (const [election, party] of [['2017-03-02', 'sf'], ['2022-05-05', 'dup'], ['2022-05-05', 'alliance'], ['2016-05-05', 'uup']] as [string, PartyId][]) {
    it(`a ${election} ${party} career runs 250 turns clean`, () => {
      const g = game({ seed: 50 + party.length, arena: 'ni', election, partyId: party, era: election.startsWith('2016') || election.startsWith('2017') ? '2015' : '2019' });
      const rng = new Rng(50 + party.length);
      let shown = 0;
      play(g, rng, 250, (s) => {
        const card = s.currentCard!;
        const text = `${card.title} ${card.body} ${card.choices.map((c) => c.label).join(' ')} ${card.outcome?.text ?? ''}`;
        expect(text, `${card.kind}`).not.toMatch(/undefined|\bthe the\b|\{[a-z]+\}|\bNaN\b/);
        if (card.kind !== 'ukRecruit' && card.kind !== 'devolvedDraft') {
          expect(text, `${card.kind}`).not.toMatch(/Holyrood|Senedd|\bMSPs?\b|Cathays|Bute House|House of Commons|\bthe Commons\b|\bPMQs\b|Number 10/);
        }
        shown++;
      });
      expect(shown).toBeGreaterThan(100);
    });
  }
});
