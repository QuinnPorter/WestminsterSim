import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  openLeadershipVacancy, materializeForced, resolveForcedChoice, resolveNpcLeadership,
} from '../career';
import { Rng } from '../rng';
import { Character, GameState, Pledge } from '../../types/game';

function makeGame(seed = 1): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}
const CONTEST = new Set(['leadershipStand', 'leadershipBallot', 'leadershipEpisode', 'leadershipBacking', 'leadershipNomination']);

function twoActiveNpcs(game: GameState): [Character, Character] {
  const cs = Object.values(game.characters).filter(
    (c) => c.active && c.partyId === game.government.governingParty && c.id !== 'player'
  );
  return [cs[0], cs[1]];
}

describe('two-horse race is a duel — no elimination ballots, its own beat', () => {
  it('skips numbered ballots and runs the also-rans beat', () => {
    for (let seed = 1; seed < 3000; seed++) {
      const game = makeGame(seed);
      const rng = new Rng(seed * 5 + 2);
      game.player.officeId = 'sos_home';
      game.player.stats = { profile: 82, partyStanding: 80, competence: 82, constituencyApproval: 74, integrity: 66 };
      openLeadershipVacancy(game, rng, 'con');
      const stand = game.forcedQueue.find((e) => e.kind === 'leadershipStand' && e.payload?.shape === 'twoHorse');
      if (!stand) continue;

      const titles: string[] = [];
      let guard = 0;
      while (game.forcedQueue.length > 0 && guard < 40) {
        const ev = game.forcedQueue.shift()!;
        if (!CONTEST.has(ev.kind)) break;
        const card = materializeForced(game, rng, ev);
        if (ev.kind === 'leadershipEpisode' || ev.kind === 'leadershipBallot') titles.push(card.title);
        resolveForcedChoice(game, rng, card, 0);
        guard++;
      }
      // a duel has NO elimination ballots, and DOES have the also-rans courting beat
      expect(titles.some((t) => /^Ballot \d/.test(t))).toBe(false);
      expect(titles).toContain('The also-rans line up');
      expect(titles.some((t) => t.startsWith("Members' ballot"))).toBe(true);
      return;
    }
    throw new Error('no two-horse race found in 3000 seeds');
  });
});

describe('contest pledges are contingent on the dealmaker winning', () => {
  it('a job promised TO the player survives only if that debtor wins', () => {
    // debtor wins → the pledge is kept
    const won = makeGame(40);
    const [debtor] = twoActiveNpcs(won);
    won.player.officeId = null;
    won.player.promises = [{ characterId: debtor.id, officeId: 'sos_home', madeDay: 0, context: 'withdrawDeal', direction: 'received' } as Pledge];
    resolveNpcLeadership(won, new Rng(3), 'con', debtor.id);
    expect(won.player.promises.some((p) => p.characterId === debtor.id)).toBe(true);

    // debtor loses (someone else wins) → the pledge evaporates
    const lost = makeGame(40);
    const [dealmaker, otherWinner] = twoActiveNpcs(lost);
    lost.player.officeId = null;
    lost.player.promises = [{ characterId: dealmaker.id, officeId: 'sos_home', madeDay: 0, context: 'withdrawDeal', direction: 'received' } as Pledge];
    resolveNpcLeadership(lost, new Rng(3), 'con', otherWinner.id);
    expect(lost.player.promises.some((p) => p.characterId === dealmaker.id)).toBe(false);
  });

  it('a job the player promised vanishes when the player loses the contest', () => {
    const game = makeGame(41);
    const [pledgee, winner] = twoActiveNpcs(game);
    game.player.officeId = null;
    game.player.promises = [{ characterId: pledgee.id, officeId: 'sos_treasury', madeDay: 0, context: 'endorsement', direction: 'made' } as Pledge];
    // an NPC wins the player's party contest → the player never became leader, so the
    // promise they made can never be honoured — it must be gone
    resolveNpcLeadership(game, new Rng(4), 'con', winner.id);
    expect(game.player.promises.some((p) => p.direction === 'made')).toBe(false);
  });
});
