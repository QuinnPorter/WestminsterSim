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
    const runs = 120; // a larger sample keeps this stable against RNG-seed drift
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
    expect(wins / runs).toBeLessThan(0.45); // a clear underdog, not a favourite
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
      // every rival resolves to a real, named character
      for (const id of ids) expect(game.characters[id]?.name).toBeTruthy();
      // the materialised declaration card names them (regression: was "heavyweights are circling")
      const card = materializeForced(game, rng, stand!);
      expect(card.body).toContain(game.characters[ids[0]].name);
    }
  });

  it('runs a full six-stage contest (declaration + five ballots) with named rounds', () => {
    const game = makeGame(4321);
    const rng = new Rng(99);
    game.player.officeId = 'sos_treasury';
    game.player.stats = { profile: 85, partyStanding: 85, competence: 85, constituencyApproval: 70, integrity: 65 };
    openLeadershipVacancy(game, rng, 'con');
    const titles: string[] = [];
    let stage = 0;
    while (game.forcedQueue.length > 0 && stage < 8) {
      const ev = game.forcedQueue.shift()!;
      const card = materializeForced(game, rng, ev);
      titles.push(card.title);
      resolveForcedChoice(game, rng, card, 0);
      stage++;
    }
    // declaration + 5 ballot stages = 6 cards
    expect(titles.length).toBe(6);
    expect(titles[0]).toMatch(/leadership is vacant/i);
    // the final ballot names the finalist
    expect(titles[titles.length - 1]).toMatch(/Final ballot — you vs /);
  });

  it('a post-election vacancy (settleNpcLeaderships path) also names opponents', () => {
    // openLeadershipVacancy is what settleNpcLeaderships now calls — the old bug
    // was a bare leadershipStand with no candidateIds. Guarantee names here.
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
