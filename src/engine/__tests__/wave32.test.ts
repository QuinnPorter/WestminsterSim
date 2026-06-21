import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { continueAsProtegeCore } from '../career';
import { Rng } from '../rng';

function makeInput(over: Partial<CreationInput> = {}): CreationInput {
  return {
    name: 'Test MP', gender: 'f', age: 45, region: 'london',
    background: 'lawyer', partyId: 'lab',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2024', seed: 5, ...over,
  };
}

describe('wave 32 — protégé home nation follows the inherited seat, not the picker default', () => {
  it('a protégé inheriting a non-Scottish seat is NOT region-locked to Scotland', () => {
    // mentor sits for a London seat
    const game = createNewGame(makeInput({ region: 'london' }));
    const mentorSeatRegion = game.seatMap.find((s) => s.id === game.player.seatId)!.region;
    expect(mentorSeatRegion).toBe('london');

    // continue as a protégé whose creation input defaults region to 'scotland'
    // (the protégé flow skips the Party step, so region is never actually chosen)
    continueAsProtegeCore(game, new Rng(99), makeInput({ name: 'Heir', region: 'scotland' }));

    // the protégé must take the seat's region, not the 'scotland' default
    const newSeatRegion = game.seatMap.find((s) => s.id === game.player.seatId)!.region;
    expect(game.player.region).toBe(newSeatRegion);
    expect(game.player.region).not.toBe('scotland');
  });
});
