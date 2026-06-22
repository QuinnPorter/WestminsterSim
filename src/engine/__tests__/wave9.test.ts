import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  leadershipBaseSupport, materializeForced, resolveForcedChoice, resolveNpcLeadership,
} from '../career';
import { GameState } from '../../types/game';
import { Rng } from '../rng';

function makeGame(seed = 42, partyId: CreationInput['partyId'] = 'con') {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 46, region: 'yorkshire',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

function partyNpcIds(game: GameState, party: string, n = 3): string[] {
  return Object.values(game.characters)
    .filter((c) => c.partyId === party)
    .slice(0, n)
    .map((c) => c.id);
}

describe('wave 9 — standing for leader resigns the current office', () => {
  it('strips a held frontbench office when the player stands (support seeded first)', () => {
    const game = makeGame(); // 2019: con governs, player is con
    game.player.hasSeat = true;
    game.player.officeId = 'sos_health'; // tier-4 cabinet post
    // base support reflects the tier-4 office and must be computed BEFORE the strip
    const expectedSupport = Math.round(leadershipBaseSupport(game));
    const rng = new Rng(5);
    const card = materializeForced(game, rng, {
      kind: 'leadershipStand', payload: { candidateIds: partyNpcIds(game, 'con') },
    });
    resolveForcedChoice(game, rng, card, 0); // stand
    expect(game.player.officeId).toBeNull(); // resigned to stand
    const ballot = game.forcedQueue.find((e) => e.kind === 'leadershipBallot');
    expect(ballot).toBeDefined();
    // the player's seeded MP support (computed pre-strip) lives in the ballot tally table
    const tallies = ballot!.payload?.tallies as Record<string, number>;
    expect(tallies.player).toBe(expectedSupport);
  });

  it('a tier-4 office gives more base support than a backbencher (bonus counted pre-strip)', () => {
    const a = makeGame(7);
    a.player.officeId = 'sos_health';
    const withOffice = leadershipBaseSupport(a);
    a.player.officeId = null;
    const backbench = leadershipBaseSupport(a);
    expect(withOffice).toBeGreaterThan(backbench);
  });
});

describe('wave 9 — a new NPC leader schedules a player-facing reshuffle', () => {
  it('sets _npcLeaderReshuffleBy when the player is a seated frontbencher', () => {
    const game = makeGame(); // con governs, player con frontbench-track
    game.player.hasSeat = true;
    game.player.officeId = 'sos_health';
    resolveNpcLeadership(game, new Rng(9), 'con');
    const due = game.player.flags._npcLeaderReshuffleBy;
    expect(typeof due).toBe('number');
    expect(due as number).toBeGreaterThan(game.day);
  });

  it('does not schedule one for a minor-party player off the frontbench track', () => {
    const game = makeGame(42, 'snp'); // SNP: a third party in 2019
    game.player.hasSeat = true;
    game.player.officeId = null;
    resolveNpcLeadership(game, new Rng(9), 'snp');
    expect(game.player.flags._npcLeaderReshuffleBy).toBeUndefined();
  });
});

describe('wave 9 — the members\' final ballot is decided on public appeal', () => {
  function finalBallotWins(stats: GameState['player']['stats'], tally: number, runs = 50): number {
    let wins = 0;
    for (let i = 0; i < runs; i++) {
      const game = makeGame(2000 + i);
      game.player.hasSeat = true;
      game.player.officeId = null;
      game.player.stats = { ...stats };
      const rng = new Rng(7000 + i);
      const finalistId = partyNpcIds(game, 'con', 1)[0];
      const card = materializeForced(game, rng, {
        kind: 'leadershipBallot',
        payload: { finalRound: true, finalistId, fieldSize: 3, tallies: { player: tally, [finalistId]: 45 } },
      });
      resolveForcedChoice(game, rng, card, 1);
      if (game.player.officeId === 'leader') wins++;
    }
    return wins / runs;
  }

  it('a high-appeal candidate wins the membership clearly more than a modest one', () => {
    const modest = finalBallotWins({ profile: 48, partyStanding: 50, competence: 50, constituencyApproval: 50, integrity: 50 }, 46);
    const strong = finalBallotWins({ profile: 85, partyStanding: 60, competence: 82, constituencyApproval: 75, integrity: 70 }, 64);
    expect(modest).toBeGreaterThan(0.1);  // close contests stay live
    expect(modest).toBeLessThan(0.9);
    expect(strong).toBeGreaterThan(modest);
  });

  it('profile (members) matters more than party standing (MPs) in the final', () => {
    // two candidates with the SAME MP tally: the high-profile / low-standing one
    // should fare better in the membership ballot than the reverse
    const grassroots = finalBallotWins({ profile: 82, partyStanding: 40, competence: 65, constituencyApproval: 70, integrity: 60 }, 52);
    const insider = finalBallotWins({ profile: 45, partyStanding: 85, competence: 65, constituencyApproval: 50, integrity: 60 }, 52);
    expect(grassroots).toBeGreaterThan(insider);
  });
});
