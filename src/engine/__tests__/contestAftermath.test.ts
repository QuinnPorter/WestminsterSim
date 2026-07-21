import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  materializeForced, resolveForcedChoice, leadershipBaseSupport,
} from '../career';
import { Rng } from '../rng';
import { GameState } from '../../types/game';

function makeGame(seed = 1): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

describe('near-miss credit', () => {
  it('a near-miss flag raises base leadership support (offsetting a loss)', () => {
    const a = makeGame(30);
    a.player.stats = { profile: 60, partyStanding: 60, competence: 60, constituencyApproval: 55, integrity: 55 };
    const without = leadershipBaseSupport(a);

    const b = makeGame(30);
    b.player.stats = { ...a.player.stats };
    b.player.flags._nearMiss = b.day;
    const withCredit = leadershipBaseSupport(b);

    expect(withCredit).toBeGreaterThan(without);
  });
});

describe('the winner\'s unity offer', () => {
  it('declining the offer sets the king-over-the-water flag and lifts profile, without a decliner penalty', () => {
    const game = makeGame(31);
    game.player.officeId = null;
    game.player.hasSeat = true;
    const rng = new Rng(2);
    const before = game.player.stats.profile;
    const declinedBefore = (game.player.flags._declinedOffers as number) ?? 0;
    const card = materializeForced(game, rng, {
      kind: 'reshuffleOffer',
      payload: { officeId: 'sos_foreign', unityOffer: true },
    });
    resolveForcedChoice(game, rng, card, 1); // decline the olive branch
    expect(game.player.flags._kingOverWater).toBeDefined();
    expect(game.player.stats.profile).toBeGreaterThan(before);
    // refusing a UNITY offer is proud, not careerist — no serial-decliner penalty
    expect((game.player.flags._declinedOffers as number) ?? 0).toBe(declinedBefore);
  });

  it('accepting the offer gives the player the office', () => {
    const game = makeGame(32);
    game.player.officeId = null;
    game.player.hasSeat = true;
    const rng = new Rng(3);
    const card = materializeForced(game, rng, {
      kind: 'reshuffleOffer',
      payload: { officeId: 'sos_foreign', unityOffer: true },
    });
    resolveForcedChoice(game, rng, card, 0); // accept
    expect(game.player.officeId).toBe('sos_foreign');
  });
});
