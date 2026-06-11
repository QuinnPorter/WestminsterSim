import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { openLeadershipVacancy, materializeForced, resolveForcedChoice } from '../career';
import { Rng } from '../rng';

function makeGame(seed: number) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

/** drive a full 4-stage contest with given choice picks; returns won */
function runContest(seed: number, picks: number[]): boolean {
  const game = makeGame(seed);
  const rng = new Rng(seed * 7 + 1);
  game.player.officeId = 'sos_defence';
  game.player.stats = {
    profile: 95, partyStanding: 95, competence: 95,
    constituencyApproval: 80, integrity: 70,
  };
  openLeadershipVacancy(game, rng, 'con');
  let stage = 0;
  while (game.forcedQueue.length > 0 && stage < 6) {
    const ev = game.forcedQueue.shift()!;
    const card = materializeForced(game, rng, ev);
    resolveForcedChoice(game, rng, card, picks[Math.min(stage, picks.length - 1)]);
    stage++;
  }
  return game.player.officeId === 'leader';
}

describe('leadership contest calibration', () => {
  it('a top-rank candidate wins clearly more often than not', () => {
    let wins = 0;
    const runs = 60;
    for (let i = 0; i < runs; i++) {
      if (runContest(5000 + i * 13, [0, 0, 0, 1])) wins++;
    }
    const rate = wins / runs;
    expect(rate).toBeGreaterThan(0.5);
    expect(rate).toBeLessThan(0.95); // never a coronation
  });

  it('a middling candidate usually loses', () => {
    let wins = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      const game = makeGame(8000 + i * 11);
      const rng = new Rng(i * 3 + 2);
      game.player.officeId = 'sos_culture';
      game.player.stats = {
        profile: 60, partyStanding: 62, competence: 60,
        constituencyApproval: 55, integrity: 55,
      };
      openLeadershipVacancy(game, rng, 'con');
      let stage = 0;
      while (game.forcedQueue.length > 0 && stage < 6) {
        const ev = game.forcedQueue.shift()!;
        const card = materializeForced(game, rng, ev);
        resolveForcedChoice(game, rng, card, 0);
        stage++;
      }
      if (game.player.officeId === 'leader') wins++;
    }
    expect(wins / runs).toBeLessThan(0.4);
  });
});
