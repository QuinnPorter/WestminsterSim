import { describe, expect, it } from 'vitest';
import { GameState, PartyId } from '../../types/game';
import { mayoraltiesIn } from '../../data/mayoralties';
import { ALL_CARDS, OUTSIDE_LEADER_CARDS } from '../../content/cards';
import { createNewGame } from '../newGame';
import { INTERLUDES, nextStep } from '../scheduler';
import { initCalendar } from '../calendar';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from '../turn';
import { cardEligible } from '../cardEngine';
import { isOutsideLeader, outsideDraftEligible } from '../outsideLeader';
import {
  becomeMayor, buildLegacy, makeOutsideLeader, openLeadershipVacancy, playerOfficeTitle, playerStatusTitle,
} from '../career';
import { Rng } from '../rng';

INTERLUDES.mayorDraft = true;
INTERLUDES.outsideDraft = true;

type Era = '2010' | '2015' | '2017' | '2019' | '2024';

function game(opts: { seed: number; partyId?: PartyId; era?: Era; profile?: number }): GameState {
  const g = createNewGame({
    name: 'Test Subject', gender: 'f', age: 44, region: 'london', background: 'lawyer',
    partyId: opts.partyId ?? 'lab',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: opts.era ?? '2019', seed: opts.seed,
  });
  initCalendar(g);
  if (opts.profile !== undefined) g.player.stats.profile = opts.profile;
  return g;
}

/** a mayor four years into the job, with the name the draft needs */
function seasonedMayor(seed: number, opts: { partyId?: PartyId; era?: Era; profile?: number } = {}): { g: GameState; rng: Rng } {
  const g = game({ seed, partyId: opts.partyId, era: opts.era, profile: opts.profile ?? 75 });
  const rng = new Rng(seed);
  becomeMayor(g, rng, mayoraltiesIn('london', g.day)[0]);
  g.player.mayor!.since = g.day - 4 * 365;
  g.player.mayor!.nextElection = g.day + 2000;
  return { g, rng };
}

function play(
  g: GameState, rng: Rng, turns: number,
  onCard: (g: GameState, kind: string) => number = () => 0,
  until?: (g: GameState) => boolean
): string[] {
  const kinds: string[] = [];
  for (let turn = 0; turn < turns && !g.gameOver; turn++) {
    if (until?.(g)) break;
    if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
    if (!g.currentCard) nextStep(g, rng);
    if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
    const card = g.currentCard;
    if (!card) break;
    kinds.push(card.kind);
    resolveChoiceCore(g, rng, onCard(g, card.kind));
    if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
    continueCore(g, rng);
  }
  return kinds;
}

const SCAN = /\{[a-zA-Z]+\}|undefined|\bNaN\b/;

describe('the approach', () => {
  it('comes only from a seasoned mayor’s own opposition or minor party, and never from the government’s', () => {
    const { g } = seasonedMayor(1);
    expect(g.government.oppositionParty).toBe('lab');
    expect(outsideDraftEligible(g, 'lab')).toBe(true);
    expect(outsideDraftEligible(g, g.government.governingParty)).toBe(false);
    // a Green mayor's own party qualifies; a governing-bloc party never does
    const green = seasonedMayor(2, { partyId: 'green' }).g;
    expect(outsideDraftEligible(green, 'green')).toBe(true);
    const coalition = seasonedMayor(3, { era: '2010', partyId: 'ld' }).g;
    expect(coalition.government.coalitionPartner).toBe('ld');
    expect(outsideDraftEligible(coalition, 'ld')).toBe(false);
    // not before a full term, not without a name, not with a poll close by
    const young = seasonedMayor(4).g;
    young.player.mayor!.since = young.day - 365;
    expect(outsideDraftEligible(young, 'lab')).toBe(false);
    expect(outsideDraftEligible(seasonedMayor(5, { profile: 60 }).g, 'lab')).toBe(false);
    const soon = seasonedMayor(6).g;
    soon.player.mayor!.nextElection = soon.day + 60;
    expect(outsideDraftEligible(soon, 'lab')).toBe(false);
    // a sitting member is never approached this way
    expect(outsideDraftEligible(game({ seed: 7, profile: 90 }), 'lab')).toBe(false);
  });

  it('a vacancy in the party reaches the mayor as an outside draft in a share of careers, and never twice', () => {
    let drafted = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { g, rng } = seasonedMayor(seed);
      openLeadershipVacancy(g, rng, 'lab');
      const kinds = g.forcedQueue.map((e) => e.kind);
      expect(kinds).not.toContain('leadershipStand');
      expect(kinds).not.toContain('leadershipBacking');
      if (kinds.includes('outsideDraft')) {
        drafted++;
      } else {
        // the vacancy went to the Commons: an NPC contest is under way
        expect(g.pendingContests?.some((c) => c.party === 'lab')).toBe(true);
      }
      // an approach spends the career's one chance until the attempt fails; a
      // vacancy the party filled from the Commons without asking spends nothing
      expect(outsideDraftEligible(g, 'lab')).toBe(!kinds.includes('outsideDraft'));
    }
    // 0.25 at full party strength (Labour polls near 30%): 10 ± 2.7 of 40
    expect(drafted).toBeGreaterThanOrEqual(4);
    expect(drafted).toBeLessThanOrEqual(17);
    // with the interlude off, nothing
    INTERLUDES.outsideDraft = false;
    try {
      const { g, rng } = seasonedMayor(1);
      openLeadershipVacancy(g, rng, 'lab');
      expect(g.forcedQueue.some((e) => e.kind === 'outsideDraft')).toBe(false);
    } finally {
      INTERLUDES.outsideDraft = true;
    }
  });

  it('declining or losing re-opens the contest in the Commons; winning takes the leadership from City Hall', () => {
    let won = 0;
    let lost = 0;
    for (let seed = 1; seed <= 24; seed++) {
      const { g, rng } = seasonedMayor(seed);
      g.player.flags._outsideDraftAttempts = 1; // as the approach itself records
      g.forcedQueue.push({ kind: 'outsideDraft', payload: { party: 'lab', step: 1, winChance: seed % 2 === 0 ? 0.9 : 0.05 } });
      const kinds = play(g, rng, 3, () => 0, (s) => !s.forcedQueue.some((e) => e.kind === 'outsideDraft') && !s.currentCard?.kind.startsWith('outsideDraft'));
      expect(kinds[0]).toBe('outsideDraft');
      if (isOutsideLeader(g)) {
        won++;
        expect(g.player.officeId).toBe('leader');
        expect(g.player.hasSeat).toBe(false);
        expect(g.player.mayor).toBeUndefined();
        expect(g.government.loId).toBe('player');
        expect(g.player.flags._peakTier).toBe(5);
        expect(g.history.some((h) => h.kind === 'mayoralty' && h.action === 'end')).toBe(true);
        expect(g.history.some((h) => h.kind === 'leadershipContest' && h.won)).toBe(true);
        for (const due of Object.values(g.calendarDone)) expect(due).toBeGreaterThan(g.day);
        expect(playerStatusTitle(g)).toContain('(no seat)');
      } else {
        lost++;
        expect(g.player.mayor).toBeDefined();
        expect(g.player.flags._outsideDraftFailed).toBe(true);
        // the vacancy went back to the Commons (the contest may already have resolved)
        expect(g.history.some((h) => h.kind === 'event' && /Labour Party leadership contest opens/.test(h.headline))).toBe(true);
        expect(g.history.some((h) => h.kind === 'leadershipContest' && !h.won)).toBe(true);
        // a failed first attempt leaves one more chance, once the cooldown passes
        g.day += 4 * 365;
        g.player.mayor!.nextElection = g.day + 2000;
        g.nextElectionBy = g.day + 2000;
        expect(outsideDraftEligible(g, 'lab')).toBe(true);
      }
    }
    expect(won).toBeGreaterThan(6);
    expect(lost).toBeGreaterThan(6);
    // a decline sends the vacancy straight to the Commons
    const { g, rng } = seasonedMayor(99);
    g.forcedQueue.push({ kind: 'outsideDraft', payload: { party: 'lab', step: 1, winChance: 0.9 } });
    play(g, rng, 1, () => 1);
    expect(g.player.mayor).toBeDefined();
    expect(g.history.some((h) => h.kind === 'event' && /Labour Party leadership contest opens/.test(h.headline))).toBe(true);
  });
});

describe('leading from outside', () => {
  function outsideLeader(seed: number, opts: { partyId?: PartyId; era?: Era } = {}): { g: GameState; rng: Rng } {
    const { g, rng } = seasonedMayor(seed, opts);
    makeOutsideLeader(g, rng);
    return { g, rng };
  }

  it('a seatless minor-party leader is titled for their party, not as Leader of the Opposition', () => {
    const { g } = outsideLeader(3, { partyId: 'green' });
    expect(isOutsideLeader(g)).toBe(true);
    expect(playerOfficeTitle(g)).toContain('Green');
    expect(playerOfficeTitle(g)).not.toContain('Opposition');
    expect(playerStatusTitle(g)).toBe(`${playerOfficeTitle(g)} (no seat)`);
  });

  it('the deck is the outside leader’s and nobody else’s, and the calendar runs with a proxy at the despatch box', () => {
    expect(OUTSIDE_LEADER_CARDS.length).toBeGreaterThanOrEqual(10);
    const { g, rng } = outsideLeader(4);
    for (const card of ALL_CARDS) expect(cardEligible(g, card)).toBe(card.requires?.outsideLeader === true);
    expect(cardEligible(game({ seed: 4 }), OUTSIDE_LEADER_CARDS[1])).toBe(false);
    g.nextElectionBy = g.day + 1500;
    const keys: string[] = [];
    const kinds = play(g, rng, 40, (s, kind) => {
      const card = s.currentCard!;
      expect(card.title).not.toMatch(SCAN);
      expect(card.body).not.toMatch(SCAN);
      if (kind === 'calendar') keys.push(card.payload?.calKey as string);
      if (kind === 'normal') expect(OUTSIDE_LEADER_CARDS.some((c) => c.id === card.cardId)).toBe(true);
      return kind === 'partyCoup' || kind === 'resignPledge' ? 0 : 0;
    }, (s) => !isOutsideLeader(s));
    expect(kinds).not.toContain('pmqs');
    expect(kinds).not.toContain('wilderness');
    expect(keys).toContain('pmqsProxy');
    expect(kinds).toContain('conference'); // the leader's own three-step conference chain
  });

  it('the general election: a seat is chosen first, then the leader’s campaign; the count keeps or ends the leadership', () => {
    let kept = 0;
    let stripped = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const { g, rng } = outsideLeader(seed);
      g.nextElectionBy = g.day + 10;
      const seatsBefore = { ...g.seats };
      nextStep(g, rng);
      expect(g.currentCard?.kind).toBe('standForSeat');
      expect(g.forcedQueue.filter((e) => e.kind === 'campaign' && e.payload?.leader === true)).toHaveLength(7);
      expect(g.forcedQueue[g.forcedQueue.length - 1].kind).toBe('electionNight');
      // even seeds stand at home, odd ones take the safe seat; neither flips anything
      resolveChoiceCore(g, rng, seed % 2);
      const seat = g.seatMap.find((x) => x.id === g.player.seatId);
      expect(seat).toBeDefined();
      expect(seat?.isPlayerSeat).toBe(true);
      expect(g.seats).toEqual(seatsBefore);
      if (seed % 2 === 0) expect(seat?.region).toBe('london');
      // a hopeless or a safe count, by seed (the count swings from the seat's baseline)
      seat!.shares[g.player.partyId] = seed % 3 === 0 ? 0.05 : 0.7;
      seat!.base = { ...seat!.shares };
      continueCore(g, rng);
      play(g, rng, 12, () => 0, (s) => Object.keys(s.elections).length > 0 && !s.pendingElectionId && !s.currentCard?.kind.startsWith('campaign'));
      expect(Object.keys(g.elections).length).toBe(1);
      const tenuresToday = g.pmHistory.filter((t) => t.startDay === g.parliamentStart).length;
      expect(tenuresToday).toBeLessThanOrEqual(1);
      if (g.player.hasSeat) {
        kept++;
        expect(g.player.officeId).toBe('leader');
        expect(isOutsideLeader(g)).toBe(false);
        expect(g.player.flags._seatSinceDay).toBe(g.parliamentStart);
        expect(g.history.some((h) => h.kind === 'event' && /enters the Commons/.test(h.headline))).toBe(true);
        expect(g.forcedQueue.some((e) => e.kind === 'speakerContest')).toBe(false);
      } else {
        stripped++;
        expect(g.player.officeId).toBeNull();
        expect(isOutsideLeader(g)).toBe(false);
        expect(g.government.loId).not.toBe('player');
        expect(g.pmHistory.some((t) => t.characterId === 'player')).toBe(false);
        expect(buildLegacy(g).becamePM).toBe(false);
        expect(g.history.some((h) => h.kind === 'roleChange' && h.how === 'becamePM')).toBe(false);
      }
    }
    expect(kept).toBeGreaterThan(0);
    expect(stripped).toBeGreaterThan(0);
  });

  it('a leader who loses the seat while the party wins is never written in as Prime Minister', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const { g, rng } = outsideLeader(seed);
      // the party is heading for government; the leader's own seat is hopeless
      for (const p of Object.keys(g.polling.shares) as PartyId[]) g.polling.shares[p] = p === 'lab' ? 0.55 : 0.08;
      g.nextElectionBy = g.day + 10;
      nextStep(g, rng);
      resolveChoiceCore(g, rng, 1);
      const fought = g.seatMap.find((x) => x.id === g.player.seatId)!;
      fought.shares.lab = 0.02;
      fought.base = { ...fought.shares };
      continueCore(g, rng);
      const kinds = play(g, rng, 12, () => 0, (s) => Object.keys(s.elections).length > 0 && !s.pendingElectionId && !s.currentCard?.kind.startsWith('campaign'));
      const result = Object.values(g.elections)[0];
      if (result.governingParty !== 'lab' || g.player.hasSeat) continue;
      expect(g.government.pmId).not.toBe('player');
      expect(g.pmHistory.some((t) => t.characterId === 'player')).toBe(false);
      expect(g.pmHistory.filter((t) => t.startDay === g.parliamentStart)).toHaveLength(1);
      expect(buildLegacy(g).highestOfficeTitle).toBe('Party Leader');
      // the count's card is showing, and it knows the party won without them
      expect(kinds).not.toContain('lostSeat');
      expect(g.currentCard?.kind).toBe('lostSeat');
      expect(g.currentCard?.body).toContain('Number 10');
    }
  });

  it('a leadership that ends away from the count leaves a candidate, not a permanent wilderness', () => {
    const { g, rng } = outsideLeader(5);
    g.nextElectionBy = g.day + 1200;
    g.forcedQueue.push({ kind: 'partyCoup' });
    g.player.stats.partyStanding = 5;
    g.player.stats.profile = 10;
    g.player.stats.competence = 10;
    play(g, rng, 1, () => 2);
    expect(g.player.officeId).toBeNull();
    expect(isOutsideLeader(g)).toBe(false);
    const kinds = play(g, rng, 30);
    expect(kinds).toContain('wilderness');
    expect(g.player.seatId).not.toBe('');
    expect(Object.keys(g.elections).length).toBeGreaterThan(0);
  });
});
