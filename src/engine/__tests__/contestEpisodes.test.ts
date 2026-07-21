import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  openLeadershipVacancy, materializeForced, resolveForcedChoice, payloadWith,
} from '../career';
import { Rng } from '../rng';
import { ContestState, GameState, StatDelta } from '../../types/game';

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

describe('contest episode sequencing', () => {
  it('interleaves launch → Ballot 1 → debate → Ballot 2 → scrutiny → Ballot 3 …', () => {
    const game = makeGame(321);
    const rng = new Rng(4242);
    game.player.officeId = 'sos_treasury';
    game.player.stats = { ...STRONG };
    openLeadershipVacancy(game, rng, 'con');
    const titles: string[] = [];
    let stage = 0;
    while (game.forcedQueue.length > 0 && stage < 30) {
      const ev = game.forcedQueue.shift()!;
      const card = materializeForced(game, rng, ev);
      if (ev.kind === 'leadershipEpisode' || ev.kind === 'leadershipBallot') titles.push(card.title);
      // pick 0 (work the tea room / continuity) to keep the player surviving the MP rounds
      resolveForcedChoice(game, rng, card, 0);
      stage++;
    }
    // the launch opens the campaign, before any ballot
    expect(titles[0]).toBe('The launch');
    expect(titles[1]).toBe('Ballot 1');
    // the debate sits between ballots 1 and 2, the scrutiny between 2 and 3
    const b1 = titles.indexOf('Ballot 1');
    const debate = titles.indexOf('The television debate');
    const b2 = titles.indexOf('Ballot 2');
    const scrutiny = titles.indexOf('The scrutiny');
    const b3 = titles.indexOf('Ballot 3');
    expect(b1).toBeLessThan(debate);
    expect(debate).toBeLessThan(b2);
    expect(b2).toBeLessThan(scrutiny);
    expect(scrutiny).toBeLessThan(b3);
    // each scripted beat fires at most once
    expect(titles.filter((t) => t === 'The launch').length).toBe(1);
    expect(titles.filter((t) => t === 'The television debate').length).toBe(1);
    expect(titles.filter((t) => t === 'The scrutiny').length).toBe(1);
  });
});

function scrutinyContest(): ContestState {
  return {
    party: 'con', shape: 'standard', round: 3, fieldSize: 4,
    mpTally: { player: 60, r1: 55, r2: 48 }, memberBank: 60, momentum: 0,
    beatsDone: ['launch', 'debate', 'scrutiny'], justEliminated: [],
  };
}

/** the 'Members' delta magnitude the scrutiny round inflicts, taking choice `pick` */
function scrutinyHit(game: GameState, pick: number): number {
  const rng = new Rng(11);
  const card = materializeForced(game, rng, { kind: 'leadershipEpisode', payload: payloadWith(scrutinyContest(), { beat: 'scrutiny' }) });
  const out = resolveForcedChoice(game, rng, card, pick);
  const members = out.deltas.find((d: StatDelta) => d.label === 'Members');
  return members ? members.delta : 0;
}

describe('scrutiny round personalisation', () => {
  it('names the player\'s actual record in the dossier', () => {
    const game = makeGame(9);
    game.player.rebellionCount = 3;
    const card = materializeForced(game, new Rng(1), {
      kind: 'leadershipEpisode', payload: payloadWith(scrutinyContest(), { beat: 'scrutiny' }),
    });
    expect(card.body.toLowerCase()).toContain('rebel');
    expect(card.body).toContain('whip');
  });

  it('a clean-record player is barely dented; a chequered one takes a real hit', () => {
    const clean = makeGame(10);
    clean.player.rebellionCount = 0;
    clean.player.flags = {};
    const cleanHit = Math.abs(scrutinyHit(clean, 0));

    const chequered = makeGame(11);
    chequered.player.rebellionCount = 4;
    chequered.player.flags = { scandal: true, _declinedOffers: 2 };
    const chequeredHit = Math.abs(scrutinyHit(chequered, 0));

    expect(chequeredHit).toBeGreaterThan(cleanHit + 2);
  });
});
