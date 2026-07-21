import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { openLeadershipVacancy, materializeForced, resolveForcedChoice } from '../career';
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

// a candidate strong enough with the PLP to survive the MP ballots AND with real
// public appeal to bank — so the two strategies both reach finals in numbers and the
// tradeoff between them is measurable rather than swamped by early elimination.
const STRONG = { profile: 82, partyStanding: 82, competence: 78, constituencyApproval: 72, integrity: 64 };

/** ballotPick: 0 = always work the tea room (MP support), 1 = always court the members */
function run(seed: number, ballotPick: number): { reachedFinal: boolean; won: boolean } {
  const game = makeGame(seed);
  const rng = new Rng(seed * 7 + 1);
  game.player.officeId = 'sos_home';
  game.player.stats = { ...STRONG };
  openLeadershipVacancy(game, rng, 'con');
  let reachedFinal = false;
  let stage = 0;
  while (game.forcedQueue.length > 0 && stage < 24) {
    const ev = game.forcedQueue.shift()!;
    if (ev.kind === 'leadershipBallot' && ev.payload?.finalRound) reachedFinal = true;
    const card = materializeForced(game, rng, ev);
    // in the elimination rounds choice 0 works the MPs, choice 1 courts the members;
    // the members' final has its own three choices — pick a steady one there
    const pick = card.kind === 'leadershipStand' ? 0
      : ev.kind === 'leadershipBallot' && ev.payload?.finalRound ? 1
        : Math.min(ballotPick, card.choices.length - 1);
    resolveForcedChoice(game, rng, card, pick);
    stage++;
  }
  return { reachedFinal, won: game.player.officeId === 'leader' };
}

function measure(ballotPick: number, runs = 300) {
  let finals = 0; let wonGivenFinal = 0;
  for (let i = 0; i < runs; i++) {
    const r = run(5000 + i * 11, ballotPick);
    if (r.reachedFinal) { finals++; if (r.won) wonGivenFinal++; }
  }
  return { finalRate: finals / runs, finals, wgf: finals ? wonGivenFinal / finals : 0 };
}

describe('two-currency leadership campaign', () => {
  const teaRoom = measure(0);
  const court = measure(1);

  it('courting the members costs MP survival — fewer reach the members\' final', () => {
    // the members-distrust MP penalty means a court-everything campaign is shed earlier
    expect(court.finalRate).toBeLessThan(teaRoom.finalRate);
  });

  it('but a courted campaign that DOES reach the final wins it far more often', () => {
    expect(court.finals).toBeGreaterThan(30); // a meaningful sample survived to the final
    // banked member appeal is decisive in the hall — the insurgent path pays off
    expect(court.wgf).toBeGreaterThan(teaRoom.wgf + 0.1);
  });
});
