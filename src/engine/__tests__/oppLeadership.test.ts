import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  openLeadershipVacancy, openNpcContest, resolvePendingContests, applyElectionAftermath,
} from '../career';
import { resolveChoiceCore, continueCore, acknowledgeElectionCore } from '../turn';
import { nextStep, initCalendar } from '../scheduler';
import { GameState, ElectionResult, PartyId } from '../../types/game';
import { Rng } from '../rng';

function makeGame(seed = 42, partyId: CreationInput['partyId'] = 'con'): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 46, region: 'yorkshire',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

function headlines(g: GameState): string[] {
  return g.history.filter((h) => h.kind === 'event').map((h) => (h as { headline: string }).headline);
}

// 2019: Conservatives govern, Labour is the official opposition, player is a Conservative.
const OPP: PartyId = 'lab';

describe('opposition leadership — every vacancy is a visible contest, never a silent swap', () => {
  it('opening an opposition vacancy starts a pending contest without swapping the leader that tick', () => {
    const g = makeGame();
    const oldLoId = g.government.loId;
    openLeadershipVacancy(g, new Rng(1), OPP);
    // no same-tick appointment: the sitting leader is still there…
    expect(g.government.loId).toBe(oldLoId);
    // …but a contest is now under way, announced in the news
    expect((g.pendingContests ?? []).some((c) => c.party === OPP)).toBe(true);
    expect(headlines(g).some((h) => /leadership contest opens/i.test(h))).toBe(true);
  });

  it('the contest resolves itself once its window closes, installing a new leader', () => {
    const g = makeGame();
    const oldLoId = g.government.loId;
    openLeadershipVacancy(g, new Rng(1), OPP);
    const contest = (g.pendingContests ?? []).find((c) => c.party === OPP)!;
    expect(contest).toBeDefined();
    // jump past the contest window and let the scheduler resolve it
    g.day = contest.resolveDay + 1;
    resolvePendingContests(g, new Rng(2));
    expect(g.government.loId).not.toBe(oldLoId);       // a new Leader of the Opposition
    expect(g.government.loId).toBe(contest.winnerId);   // the pre-announced favourite
    expect((g.pendingContests ?? []).length).toBe(0);   // and it's cleared
    expect(headlines(g).some((h) => /elected leader of the Labour/i.test(h))).toBe(true);
  });

  it('never resolves as a silent same-tick appointment (100 seeds)', () => {
    for (let s = 0; s < 100; s++) {
      const g = makeGame(1000 + s);
      const oldLoId = g.government.loId;
      openLeadershipVacancy(g, new Rng(s), OPP);
      // in every case the leader is unchanged this tick and a contest is pending
      expect(g.government.loId).toBe(oldLoId);
      expect((g.pendingContests ?? []).some((c) => c.party === OPP)).toBe(true);
    }
  });

  it('is deterministic: the same seed yields the same winner and headlines', () => {
    const run = (seed: number) => {
      const g = makeGame(7);
      openLeadershipVacancy(g, new Rng(seed), OPP);
      const c = (g.pendingContests ?? []).find((x) => x.party === OPP)!;
      g.day = c.resolveDay + 1;
      resolvePendingContests(g, new Rng(seed + 1));
      return { loId: g.government.loId, heads: headlines(g).join('|') };
    };
    expect(run(11)).toEqual(run(11));
  });

  it('does not stack a second contest on a party already mid-contest', () => {
    const g = makeGame();
    openNpcContest(g, new Rng(1), OPP);
    openNpcContest(g, new Rng(2), OPP);
    expect((g.pendingContests ?? []).filter((c) => c.party === OPP).length).toBe(1);
  });
});

describe('opposition leadership — post-election turnover is performance-dependent', () => {
  // Build an aftermath where the Conservatives stay in government and Labour stays the
  // official opposition, controlling only Labour's seat change, then measure how often
  // Labour's leader is challenged (a contest opens for them).
  function oppChurnRate(labSeatsBefore: number, labSeatsAfter: number, seeds = 120): number {
    let churned = 0;
    for (let s = 0; s < seeds; s++) {
      const g = makeGame(3000 + s);
      const seatsAfter: Record<string, number> = { con: 360, lab: labSeatsAfter, ld: 20, sf: 7, spk: 1 };
      g.seats = { con: 360, lab: labSeatsBefore, ld: 20, sf: 7, spk: 1 };
      const result: ElectionResult = {
        id: 'e', date: g.day, seats: { ...seatsAfter },
        voteShares: { con: 0.44, lab: 0.32, ld: 0.10 },
        playerResult: null, outcome: 'majority', governingParty: 'con', playerHeldSeat: true,
      };
      g.elections[result.id] = result;
      applyElectionAftermath(g, new Rng(s), result, true);
      if ((g.pendingContests ?? []).some((c) => c.party === 'lab')) churned++;
    }
    return churned / seeds;
  }

  it('a heavy defeat almost always triggers a leadership challenge', () => {
    const rate = oppChurnRate(220, 180); // lost 40 seats
    expect(rate).toBeGreaterThan(0.7);
  });

  it('a big advance earns the incumbent the benefit of the doubt', () => {
    const rate = oppChurnRate(180, 230); // gained 50 seats
    expect(rate).toBeLessThan(0.35);
  });

  it('a poor result churns far more often than a strong one', () => {
    expect(oppChurnRate(220, 180)).toBeGreaterThan(oppChurnRate(180, 230) + 0.35);
  });

  it('losing official-opposition status to a third party almost always ends the leader', () => {
    let churned = 0;
    const seeds = 80;
    for (let s = 0; s < seeds; s++) {
      const g = makeGame(4000 + s);
      // Labour was the opposition; now the Lib Dems overtake them as the largest non-gov party
      g.seats = { con: 340, lab: 150, ld: 152, sf: 7, spk: 1 };
      const seatsAfter: Record<string, number> = { con: 340, lab: 120, ld: 182, sf: 7, spk: 1 };
      const result: ElectionResult = {
        id: 'e', date: g.day, seats: { ...seatsAfter },
        voteShares: { con: 0.42, ld: 0.28, lab: 0.22 },
        playerResult: null, outcome: 'majority', governingParty: 'con', playerHeldSeat: true,
      };
      g.elections[result.id] = result;
      applyElectionAftermath(g, new Rng(s), result, true);
      if ((g.pendingContests ?? []).some((c) => c.party === 'lab')) churned++;
    }
    expect(churned / seeds).toBeGreaterThan(0.8);
  });
});

describe('opposition leadership — a rare, earned mid-term coup', () => {
  // Park the player as a Conservative backbencher (out of the opposition's affairs) and
  // drive the world for a stretch, counting how often the NPC Labour leader is couped.
  function runCoupWorld(seed: number, vulnerable: boolean, maxSteps = 30): string[] {
    const g = makeGame(5000 + seed);
    initCalendar(g);
    g.player.officeId = null;
    g.player.hasSeat = true;
    g.nextElectionBy = g.day + 50 * 365; // keep general elections out of the way
    // shape the Labour leader's standing
    const loId = g.government.loId;
    const tenureStart = vulnerable ? g.day - 6 * 365 : g.day - 100;
    g.loHistory = [{ characterId: loId, name: g.characters[loId]?.name ?? 'LO', partyId: 'lab', startDay: tenureStart, endDay: null }];
    // vulnerable: took over when Labour polled ~42, now drifted to ~30 (no election-slide);
    // safe: took over at ~its current standing
    g.government.loInheritedPolls = vulnerable ? 42 : 30;
    g.polling.shares = { con: 0.42, lab: 0.30, ld: 0.12, green: 0.05, reform: 0.06, snp: 0.045, pc: 0.005 };
    const rng = new Rng(seed * 131 + 7);
    let steps = 0;
    const withRng = (fn: (r: Rng) => void) => { fn(rng); };
    withRng((r) => nextStep(g, r));
    while (!g.gameOver && steps < maxSteps) {
      steps++;
      if (g.pendingElectionId) { withRng((r) => acknowledgeElectionCore(g, r)); continue; }
      const card = g.currentCard;
      if (!card) { withRng((r) => nextStep(g, r)); continue; }
      if (!card.outcome) {
        // decline anything that could make the player a leader; otherwise pick option 0
        withRng((r) => resolveChoiceCore(g, r, card.choices.length - 1));
      } else {
        withRng((r) => continueCore(g, r));
      }
    }
    return headlines(g);
  }

  it('an underperforming, long-serving NPC opposition leader can be couped (rare but real)', () => {
    let coups = 0;
    for (let s = 0; s < 60; s++) {
      if (runCoupWorld(s, true).some((h) => /ousted as .* leader in a party coup/i.test(h))) coups++;
    }
    expect(coups).toBeGreaterThan(0);
  });

  it('a fresh leader polling at their inherited level is essentially never couped', () => {
    let coups = 0;
    for (let s = 0; s < 60; s++) {
      if (runCoupWorld(s, false).some((h) => /ousted as .* leader in a party coup/i.test(h))) coups++;
    }
    expect(coups).toBeLessThanOrEqual(2); // no coup pressure; only stray churn, essentially never
  });
});
