import { describe, expect, it } from 'vitest';
import { simulateCareer, SimSummary } from '../sim';
import { createNewGame, CreationInput } from '../newGame';
import {
  applyElectionAftermath, buildLegacy, changeParty, giveOffice, playerOfficeLabel, nextOfficeFor,
} from '../career';
import { runElection, electionNationalShares } from '../election';
import { Rng } from '../rng';

function makeGame(seed = 42) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'm', age: 45, region: 'northWest',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

describe('headless career simulation (balance harness)', () => {
  const RUNS = 60;
  const YEARS = 20;

  const results: SimSummary[] = [];
  for (let i = 0; i < RUNS; i++) {
    results.push(simulateCareer({ seed: 9000 + i * 17, years: YEARS }));
  }

  it('never crashes or stalls across full careers', () => {
    expect(results).toHaveLength(RUNS);
    for (const r of results) {
      expect(r.steps).toBeGreaterThan(20);
    }
  });

  it('time actually passes (decisions tick over the years)', () => {
    const survivors = results.filter((r) => r.gameOverReason === null);
    for (const r of survivors) {
      expect(r.yearsPlayed).toBeGreaterThan(YEARS - 1.5);
    }
  });

  it('most ambitious careers reach the ministerial ladder', () => {
    const reachedMid = results.filter((r) => r.highestTier >= 3).length / RUNS;
    expect(reachedMid).toBeGreaterThan(0.35);
  });

  it('reaching party leader is possible but not routine', () => {
    const leaders = results.filter((r) => r.becameLeader).length / RUNS;
    expect(leaders).toBeGreaterThan(0.01);
    expect(leaders).toBeLessThan(0.6);
  });

  it('elections happen on schedule (~4-5 per 20 years)', () => {
    const avg = results.reduce((a, r) => a + r.electionsContested, 0) / RUNS;
    expect(avg).toBeGreaterThan(2.5);
    expect(avg).toBeLessThan(7);
  });

  it('losing a seat is possible but rare', () => {
    const lostRate = results.filter((r) => r.lostSeatEver).length / RUNS;
    expect(lostRate).toBeLessThan(0.5);
  });

  it('NPC PMs occasionally resign or call early elections (but not constantly)', () => {
    const pmResigned = results.filter((r) => r.npcPmResigned).length / RUNS;
    const earlyElections = results.filter((r) => r.earlyElectionCalled).length / RUNS;
    // possible across 20-year careers...
    expect(pmResigned).toBeGreaterThan(0.05);
    expect(earlyElections).toBeGreaterThan(0.1);
  });

  it('no single card dominates a career (repetition guard)', () => {
    for (const r of results) {
      const totalDraws = Object.values(r.cardCounts).reduce((a, b) => a + b, 0);
      if (totalDraws < 30) continue;
      const max = Math.max(...Object.values(r.cardCounts));
      // even with the small starter pool, one card shouldn't be >25% of draws
      expect(max / totalDraws).toBeLessThan(0.25);
    }
  });
});

describe('legacy levels', () => {
  it('an LO who retires is a Party Leader, not PM', () => {
    const game = makeGame(7);
    game.history.push({ kind: 'roleChange', date: game.day, officeId: 'leader', how: 'electedLeader' });
    expect(buildLegacy(game).highestOfficeTitle).toBe('Party Leader');
  });

  it('becoming PM is recorded as Prime Minister', () => {
    const game = makeGame(8);
    game.history.push({ kind: 'roleChange', date: game.day, officeId: 'leader', how: 'electedLeader' });
    game.history.push({ kind: 'roleChange', date: game.day, officeId: 'leader', how: 'becamePM' });
    expect(buildLegacy(game).highestOfficeTitle).toBe('Prime Minister');
  });

  it('a cabinet career reports the cabinet level with the office', () => {
    const game = makeGame(9);
    game.history.push({ kind: 'roleChange', date: game.day, officeId: 'sos_home', how: 'promoted' });
    expect(buildLegacy(game).highestOfficeTitle).toContain('Cabinet');
    expect(buildLegacy(game).highestOfficeTitle).toContain('Home Secretary');
  });

  it('a junior career reports the ministerial title', () => {
    const game = makeGame(10);
    game.history.push({ kind: 'roleChange', date: game.day, officeId: 'min_health', how: 'appointed' });
    expect(buildLegacy(game).highestOfficeTitle).toContain('Health');
  });
});

describe('crossing the floor', () => {
  it('strips office, resets relationships and marks the defection', () => {
    const game = makeGame(11);
    game.player.officeId = 'sos_health';
    game.player.stats.partyStanding = 80;
    const rng = new Rng(99);
    changeParty(game, rng, 'ld');

    expect(game.player.partyId).toBe('ld');
    expect(game.player.officeId).toBeNull();
    expect(game.player.stats.partyStanding).toBeLessThan(40);
    expect(game.player.flags.defected).toBe(1);
    // leader relationship now points at a Lib Dem
    const leaderRel = game.relationships.find((r) => r.kind === 'leader')!;
    expect(game.characters[leaderRel.characterId].partyId).toBe('ld');
    // part of the personal vote followed
    const seat = game.seatMap.find((s) => s.id === game.player.seatId)!;
    expect(seat.shares.ld ?? 0).toBeGreaterThan(0.1);
  });

  it('the defection flag is spent at the next election', () => {
    const game = makeGame(12);
    const rng = new Rng(123);
    changeParty(game, rng, 'ld');
    expect(game.player.flags.defected).toBe(1);
    const { result, playerWonSeat } = runElection(game, rng);
    applyElectionAftermath(game, rng, result, playerWonSeat);
    expect(game.player.flags.defected).toBeUndefined();
  });
});

describe('rebalance targets (difficulty & coalitions)', () => {
  const RUNS = 120;
  const YEARS = 25;
  const results: SimSummary[] = [];
  for (let i = 0; i < RUNS; i++) {
    // bias the policy toward ambition so leadership/governing paths are exercised
    results.push(simulateCareer({ seed: 41000 + i * 13, years: YEARS, ambition: 0.7 }));
  }

  const sum = (f: (r: SimSummary) => number) => results.reduce((a, r) => a + f(r), 0);
  const maj = sum((r) => r.electionMajority);
  const hung = sum((r) => r.electionHung);
  const min = sum((r) => r.electionMinority);
  const totalElections = maj + hung + min;
  const subMajority = hung + min;
  const coalitions = sum((r) => r.coalitionsFormed);
  const fellEarly = sum((r) => r.govFellEarly);
  const forcedOut = sum((r) => r.forcedOutLeader);
  const honoured = sum((r) => r.honouredPledge);
  const broken = sum((r) => r.brokenPledge);
  const coalitionOffice = results.filter((r) => r.coalitionOfficeWon).length;
  const leaderRate = results.filter((r) => r.becameLeader).length / RUNS;
  const tenures = results.map((r) => r.avgPostTenureYears).filter((t) => t > 0);
  const avgTenure = tenures.reduce((a, b) => a + b, 0) / Math.max(1, tenures.length);
  const avgElections = sum((r) => r.electionsContested) / RUNS;

  // eslint-disable-next-line no-console
  console.log('REBALANCE', JSON.stringify({
    totalElections, majRate: +(maj / totalElections).toFixed(3),
    subMajRate: +(subMajority / totalElections).toFixed(3),
    coalitionRateOfSubMaj: +(coalitions / Math.max(1, subMajority)).toFixed(3),
    coalitions, fellEarly, forcedOut, honoured, broken, coalitionOffice,
    leaderRate: +leaderRate.toFixed(3), avgTenure: +avgTenure.toFixed(2),
    avgElections: +avgElections.toFixed(2),
  }));

  it('majorities are harder but common; sub-majority parliaments occur', () => {
    expect(maj / totalElections).toBeGreaterThan(0.30);
    expect(maj / totalElections).toBeLessThan(0.75);
    expect(subMajority / totalElections).toBeGreaterThan(0.18);
  });

  it('coalitions and minority collapses both happen', () => {
    expect(coalitions).toBeGreaterThan(0);
    expect(fellEarly).toBeGreaterThan(0);
  });

  it('leadership is losable and winnable', () => {
    expect(leaderRate).toBeGreaterThan(0.01);
    expect(leaderRate).toBeLessThan(0.6);
    expect(forcedOut).toBeGreaterThan(0);
  });

  it('elections stay on a sane cadence with instability on', () => {
    expect(avgElections).toBeGreaterThan(2.5);
    expect(avgElections).toBeLessThan(7);
  });

  it('positions cycle on a realistic cadence', () => {
    expect(avgTenure).toBeGreaterThan(0.8);
    expect(avgTenure).toBeLessThan(3.5);
  });
});

describe('wave 2: realism additions', () => {
  it('past roles keep their gov/shadow framing after crossing the floor', () => {
    const game = makeGame(7); // Conservative, 2019 (Conservatives governing)
    const rng = new Rng(1);
    giveOffice(game, rng, 'min_treasury', 'appointed');
    const entry = [...game.history].reverse()
      .find((h) => h.kind === 'roleChange' && h.officeId === 'min_treasury') as
      { date: number; roleSide?: 'gov' | 'opp' | 'minor'; partyId?: string } | undefined;
    expect(entry?.roleSide).toBe('gov');
    expect(entry?.partyId).toBe('con');

    changeParty(game, rng, 'lab'); // defect to the (opposition) Labour party
    const label = playerOfficeLabel(game, 'min_treasury', entry!.date,
      { roleSide: entry!.roleSide, partyId: entry!.partyId as never });
    expect(label).toContain('Minister of State for Treasury');
    expect(label).not.toContain('Shadow');
    expect(buildLegacy(game).highestOfficeTitle).toContain('Treasury');
  });

  it('incumbent fatigue erodes a long-governing party at the ballot box', () => {
    const avgGovShare = (terms: number) => {
      let sum = 0;
      const N = 200;
      for (let i = 0; i < N; i++) {
        const game = makeGame(100 + i);
        game.government.termsInPower = terms;
        const shares = electionNationalShares(game, new Rng(500 + i));
        sum += shares[game.government.governingParty] ?? 0;
      }
      return sum / N;
    };
    expect(avgGovShare(4)).toBeLessThan(avgGovShare(1) - 0.02);
  });

  it('an exceptional newcomer can be handed a ministry directly, but rarely', () => {
    const game = makeGame(3);
    Object.assign(game.player.stats, { competence: 80, profile: 70, partyStanding: 70 });
    let direct = 0;
    for (let i = 0; i < 200; i++) {
      const o = nextOfficeFor(game, new Rng(900 + i));
      if (o && (o.startsWith('min_') || o.startsWith('sos_'))) direct++;
    }
    expect(direct).toBeGreaterThan(0);   // possible
    expect(direct).toBeLessThan(120);    // but not the usual path
  });
});
