import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  contestFrom, payloadWith, initialMemberBank, impliedOddsLine,
  openLeadershipVacancy, materializeForced, resolveForcedChoice,
} from '../career';
import { Rng } from '../rng';
import { ContestState, GameState } from '../../types/game';

function makeGame(seed: number): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

const STRONG = { profile: 88, partyStanding: 85, competence: 84, constituencyApproval: 74, integrity: 66 };

/** drive a whole contest to its conclusion, collecting a signature of everything the
 *  player can observe: outcome office, history headlines, and final MP tallies. */
function runAndSign(seed: number, ballotPick: number): string {
  const game = makeGame(seed);
  const rng = new Rng(seed * 7 + 1);
  game.player.officeId = 'sos_defence';
  game.player.stats = { ...STRONG };
  openLeadershipVacancy(game, rng, 'con');
  const tallySig: string[] = [];
  let stage = 0;
  while (game.forcedQueue.length > 0 && stage < 24) {
    const ev = game.forcedQueue.shift()!;
    if (ev.kind === 'leadershipBallot' && ev.payload) {
      const c = contestFrom(game, ev.payload);
      tallySig.push(Object.entries(c.mpTally).map(([k, v]) => `${k}:${Math.round(v)}`).sort().join(','));
    }
    const card = materializeForced(game, rng, ev);
    const pick = card.kind === 'leadershipStand' ? 0 : Math.min(ballotPick, card.choices.length - 1);
    resolveForcedChoice(game, rng, card, pick);
    stage++;
  }
  const headlines = game.history.filter((h) => h.kind === 'event').map((h: any) => h.headline);
  return JSON.stringify({ office: game.player.officeId, headlines, tallySig });
}

describe('contest determinism', () => {
  it('a full contest replays identically for the same seed', () => {
    for (const seed of [101, 233, 512, 907, 1300]) {
      expect(runAndSign(seed, 0)).toBe(runAndSign(seed, 0));
    }
  });

  it('a cloned pre-contest state runs identically to the original', () => {
    const game = makeGame(4242);
    game.player.officeId = 'sos_home';
    game.player.stats = { ...STRONG };
    const clone: GameState = structuredClone(game);

    const sign = (g: GameState): string => {
      const rng = new Rng(999);
      openLeadershipVacancy(g, rng, 'con');
      let stage = 0;
      while (g.forcedQueue.length > 0 && stage < 24) {
        const ev = g.forcedQueue.shift()!;
        const card = materializeForced(g, rng, ev);
        resolveForcedChoice(g, rng, card, card.kind === 'leadershipStand' ? 0 : 1);
        stage++;
      }
      return JSON.stringify({
        office: g.player.officeId,
        headlines: g.history.filter((h) => h.kind === 'event').map((h: any) => h.headline),
      });
    };
    expect(sign(game)).toBe(sign(clone));
  });
});

describe('contestFrom / payloadWith adapter', () => {
  const game = makeGame(7);
  game.player.stats = { ...STRONG };

  it('reconstructs a legacy flat payload (no contest key)', () => {
    const legacy = { tallies: { player: 60, r1: 55, r2: 40 }, round: 3, fieldSize: 5, justEliminated: [{ name: 'X', swungTo: 'you' }] };
    const c = contestFrom(game, legacy);
    expect(c.mpTally).toEqual({ player: 60, r1: 55, r2: 40 });
    expect(c.round).toBe(3);
    expect(c.fieldSize).toBe(5);
    expect(c.justEliminated).toEqual([{ name: 'X', swungTo: 'you' }]);
    // a reconstructed contest must fire NO scripted episode beats
    expect(c.beatsDone).toEqual(expect.arrayContaining(['launch', 'debate', 'scrutiny']));
    // memberBank seeded from the day's stats
    expect(c.memberBank).toBeCloseTo(initialMemberBank(game), 5);
  });

  it('prefers an explicit contest object and copies the tally', () => {
    const contest: ContestState = {
      party: 'con', shape: 'twoHorse', round: 2, fieldSize: 2,
      mpTally: { player: 70, rival: 65 }, memberBank: 50, momentum: 3, beatsDone: ['launch'],
      justEliminated: [],
    };
    const payload = payloadWith(contest, { finalRound: true });
    const c = contestFrom(game, payload);
    expect(c.shape).toBe('twoHorse');
    expect(c.momentum).toBe(3);
    expect(c.mpTally).toEqual({ player: 70, rival: 65 });
    expect(c.mpTally).not.toBe(contest.mpTally); // a copy, not the same reference
    // legacy mirror keys are present for the materialize readout
    expect(payload.tallies).toBe(contest.mpTally);
    expect(payload.round).toBe(2);
    expect(payload.finalRound).toBe(true);
  });
});

describe('impliedOddsLine', () => {
  it('is monotone and phrased sensibly across the range', () => {
    expect(impliedOddsLine(0.9)).toContain('odds-on');
    expect(impliedOddsLine(0.5)).toContain('evens');
    expect(impliedOddsLine(0.05)).toContain('outsider');
    // pure: same input, same output, no rng
    expect(impliedOddsLine(0.42)).toBe(impliedOddsLine(0.42));
  });
});
