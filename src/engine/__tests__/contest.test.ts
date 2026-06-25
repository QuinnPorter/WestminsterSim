import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  openLeadershipVacancy, materializeForced, resolveForcedChoice, seatProportionalTallies,
} from '../career';
import { Rng } from '../rng';
import { GameState } from '../../types/game';

describe('seatProportionalTallies', () => {
  const sum = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);

  it('counts always sum to exactly the party seat total', () => {
    const raw = { a: 80, b: 55, c: 40, d: 20, e: 8 };
    for (const seats of [5, 9, 73, 201, 365, 411, 650]) {
      expect(sum(seatProportionalTallies(raw, seats))).toBe(seats);
    }
  });

  it('a stronger candidate never gets fewer MPs than a weaker one', () => {
    const out = seatProportionalTallies({ a: 90, b: 60, c: 30, d: 12 }, 330);
    expect(out.a).toBeGreaterThanOrEqual(out.b);
    expect(out.b).toBeGreaterThanOrEqual(out.c);
    expect(out.c).toBeGreaterThanOrEqual(out.d);
  });

  it('gives every listed candidate at least one MP when seats allow', () => {
    const out = seatProportionalTallies({ a: 90, b: 5, c: 5, d: 5 }, 60);
    for (const v of Object.values(out)) expect(v).toBeGreaterThanOrEqual(1);
    expect(sum(out)).toBe(60);
  });

  it('does not throw on empty fields or zero seats', () => {
    expect(seatProportionalTallies({}, 100)).toEqual({});
    expect(sum(seatProportionalTallies({ a: 1, b: 1 }, 0))).toBe(0);
  });
});

function makeGame(seed: number) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

type Stats = GameState['player']['stats'];

/** drive a whole dynamic contest to its conclusion; returns whether the player won.
 *  Always stands at the declaration; uses `ballotPick` for every ballot/backing card. */
function runContest(seed: number, stats: Stats, ballotPick = 1): boolean {
  const game = makeGame(seed);
  const rng = new Rng(seed * 7 + 1);
  game.player.officeId = 'sos_defence';
  game.player.stats = { ...stats };
  openLeadershipVacancy(game, rng, 'con');
  let stage = 0;
  while (game.forcedQueue.length > 0 && stage < 16) {
    const ev = game.forcedQueue.shift()!;
    const card = materializeForced(game, rng, ev);
    const pick = card.kind === 'leadershipStand' ? 0 : Math.min(ballotPick, card.choices.length - 1);
    resolveForcedChoice(game, rng, card, pick);
    stage++;
  }
  return game.player.officeId === 'leader';
}

const STRONG: Stats = { profile: 92, partyStanding: 92, competence: 92, constituencyApproval: 80, integrity: 72 };
const MIDDLING: Stats = { profile: 60, partyStanding: 62, competence: 60, constituencyApproval: 55, integrity: 55 };

describe('leadership contest calibration', () => {
  it('a top-rank candidate wins clearly more often than not', () => {
    let wins = 0; const runs = 60;
    for (let i = 0; i < runs; i++) if (runContest(5000 + i * 13, STRONG, 1)) wins++;
    const rate = wins / runs;
    expect(rate).toBeGreaterThan(0.5);
    expect(rate).toBeLessThan(0.95); // never a coronation
  });

  it('a middling candidate usually loses', () => {
    let wins = 0; const runs = 120;
    for (let i = 0; i < runs; i++) if (runContest(8000 + i * 11, MIDDLING, 0)) wins++;
    expect(wins / runs).toBeLessThan(0.45); // a clear underdog
  });

  it('a middling candidate is sometimes eliminated before the final two', () => {
    let preFinalOut = 0; const runs = 80;
    for (let i = 0; i < runs; i++) {
      const game = makeGame(9000 + i * 7);
      const rng = new Rng(i * 5 + 3);
      game.player.officeId = 'sos_culture';
      game.player.stats = { ...MIDDLING };
      openLeadershipVacancy(game, rng, 'con');
      let reachedFinal = false; let stage = 0;
      while (game.forcedQueue.length > 0 && stage < 16) {
        const ev = game.forcedQueue.shift()!;
        if (ev.kind === 'leadershipBallot' && ev.payload?.finalRound) reachedFinal = true;
        const card = materializeForced(game, rng, ev);
        const pick = card.kind === 'leadershipStand' ? 0 : Math.min(1, card.choices.length - 1);
        resolveForcedChoice(game, rng, card, pick);
        stage++;
      }
      if (!reachedFinal) preFinalOut++; // never reached the members' ballot → knocked out earlier
    }
    expect(preFinalOut).toBeGreaterThan(0);
    expect(preFinalOut).toBeLessThan(runs); // ...but not always
  });
});

describe('leadership contest structure', () => {
  it('always assembles a named field of 3-6 rivals', () => {
    for (let i = 0; i < 20; i++) {
      const game = makeGame(2000 + i);
      const rng = new Rng(i + 1);
      game.player.officeId = 'sos_home';
      game.player.stats = { profile: 80, partyStanding: 80, competence: 70, constituencyApproval: 60, integrity: 60 };
      openLeadershipVacancy(game, rng, 'con');
      const stand = game.forcedQueue.find((e) => e.kind === 'leadershipStand');
      expect(stand).toBeDefined();
      const ids = stand!.payload?.candidateIds as string[];
      expect(ids.length).toBeGreaterThanOrEqual(3);
      expect(ids.length).toBeLessThanOrEqual(6);
      for (const id of ids) expect(game.characters[id]?.name).toBeTruthy();
      const card = materializeForced(game, rng, stand!);
      expect(card.body).toContain(game.characters[ids[0]].name);
    }
  });

  it('runs dynamic ballots that shed ≥1 candidate each, down to a members\' final', () => {
    const game = makeGame(4321);
    const rng = new Rng(99);
    game.player.officeId = 'sos_treasury';
    game.player.stats = { profile: 95, partyStanding: 95, competence: 95, constituencyApproval: 80, integrity: 72 };
    openLeadershipVacancy(game, rng, 'con');
    const ballotSizes: number[] = [];
    const titles: string[] = [];
    let finalTitle = '';
    let stage = 0;
    while (game.forcedQueue.length > 0 && stage < 16) {
      const ev = game.forcedQueue.shift()!;
      const card = materializeForced(game, rng, ev);
      if (ev.kind === 'leadershipBallot') {
        const t = ev.payload?.tallies as Record<string, number>;
        ballotSizes.push(Object.keys(t).length);
        titles.push(card.title);
        if (ev.payload?.finalRound) finalTitle = card.title;
      }
      const pick = card.kind === 'leadershipStand' ? 0 : 1;
      resolveForcedChoice(game, rng, card, pick);
      stage++;
    }
    expect(ballotSizes.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < ballotSizes.length; i++) {
      expect(ballotSizes[i]).toBeLessThan(ballotSizes[i - 1]); // the field strictly narrows
    }
    expect(ballotSizes[ballotSizes.length - 1]).toBe(2); // down to a final two
    expect(titles[0]).toMatch(/^Ballot 1$/);
    expect(finalTitle).toMatch(/^Members' ballot — you vs /);
  });

  it('a post-election vacancy (settleNpcLeaderships path) also names opponents', () => {
    const game = makeGame(777);
    const rng = new Rng(5);
    game.player.officeId = 'sos_foreign';
    game.player.stats = { profile: 80, partyStanding: 80, competence: 75, constituencyApproval: 60, integrity: 60 };
    openLeadershipVacancy(game, rng, game.player.partyId);
    const stand = game.forcedQueue.find((e) => e.kind === 'leadershipStand');
    const ids = (stand?.payload?.candidateIds as string[]) ?? [];
    expect(ids.length).toBeGreaterThanOrEqual(3);
    const card = materializeForced(game, rng, stand!);
    expect(card.body).not.toContain('Several heavyweights are circling');
  });
});
