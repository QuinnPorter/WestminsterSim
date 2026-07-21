import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  openLeadershipVacancy, materializeForced, resolveForcedChoice, contestFrom,
} from '../career';
import { Rng } from '../rng';
import { GameState } from '../../types/game';

function makeGame(seed: number): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}
const STRONG = { profile: 88, partyStanding: 88, competence: 84, constituencyApproval: 74, integrity: 66 };
const CONTEST = new Set(['leadershipStand', 'leadershipBallot', 'leadershipEpisode', 'leadershipBacking', 'leadershipNomination']);

describe('members\' campaign arc', () => {
  it('runs hustings → head-to-head → final week → members\' ballot, in order', () => {
    // find a standard contest where the player reaches the members' stage
    for (let seed = 1; seed < 200; seed++) {
      const game = makeGame(seed);
      const rng = new Rng(seed * 9 + 1);
      game.player.officeId = 'sos_treasury';
      game.player.stats = { ...STRONG };
      openLeadershipVacancy(game, rng, 'con');
      const titles: string[] = [];
      let postalLockedAtFinal = false;
      let guard = 0;
      while (game.forcedQueue.length > 0 && guard < 40) {
        const ev = game.forcedQueue.shift()!;
        if (!CONTEST.has(ev.kind)) break;
        if (ev.kind === 'leadershipBallot' && ev.payload?.finalRound) {
          postalLockedAtFinal = !!contestFrom(game, ev.payload).postalLock;
        }
        const card = materializeForced(game, rng, ev);
        titles.push(card.title);
        resolveForcedChoice(game, rng, card, 0);
        guard++;
      }
      const h = titles.indexOf('The hustings tour');
      const hh = titles.indexOf('The head-to-head');
      const fw = titles.indexOf('The final week');
      const members = titles.findIndex((t) => t.startsWith("Members' ballot"));
      if (h >= 0 && members >= 0) {
        // a full members' arc was reached — assert the order and the postal lock
        expect(h).toBeLessThan(hh);
        expect(hh).toBeLessThan(fw);
        expect(fw).toBeLessThan(members);
        expect(postalLockedAtFinal).toBe(true);
        return;
      }
    }
    throw new Error('no standard contest reached the members\' arc in 200 seeds');
  });
});

describe('the finalist withdrawal (Leadsom/May) is possible but very rare', () => {
  it('happens sometimes, but only a small fraction of finals', () => {
    let finals = 0;
    let withdrawals = 0;
    const runs = 900;
    for (let i = 0; i < runs; i++) {
      const game = makeGame(3000 + i);
      const rng = new Rng(i * 5 + 3);
      game.player.officeId = 'sos_defence';
      game.player.stats = { ...STRONG };
      openLeadershipVacancy(game, rng, 'con');
      let reachedArc = false;
      let withdrew = false;
      let guard = 0;
      while (game.forcedQueue.length > 0 && guard < 40) {
        const ev = game.forcedQueue.shift()!;
        if (!CONTEST.has(ev.kind)) break;
        if (ev.kind === 'leadershipEpisode' && ev.payload?.beat === 'finalWeek') reachedArc = true;
        const card = materializeForced(game, rng, ev);
        const out = resolveForcedChoice(game, rng, card, 0);
        if (out.text.includes('withdraws') && reachedArc) withdrew = true;
        guard++;
      }
      if (reachedArc) finals++;
      if (withdrew) withdrawals++;
    }
    expect(finals).toBeGreaterThan(200); // a decent sample reached the final week
    const rate = withdrawals / finals;
    expect(rate).toBeGreaterThan(0);      // it does happen
    expect(rate).toBeLessThan(0.08);      // but it is very rare
  });
});
