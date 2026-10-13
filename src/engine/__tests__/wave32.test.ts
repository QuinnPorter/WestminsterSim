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

describe('a protégé may fight the by-election in another region', () => {
  it('takes the party’s safest seat in the region chosen, and only that seat is theirs', () => {
    const game = createNewGame(makeInput({ region: 'london' }));
    const mentorSeat = game.player.seatId;
    const held = game.seatMap.filter((s) => s.region === 'northWest' && s.winner === 'lab');
    expect(held.length).toBeGreaterThan(0);
    const safest = Math.max(...held.map((s) => s.shares.lab ?? 0));

    continueAsProtegeCore(game, new Rng(7), makeInput({ name: 'Heir', byElectionRegion: 'northWest' }));

    const seat = game.seatMap.find((s) => s.id === game.player.seatId)!;
    expect(seat.id).not.toBe(mentorSeat);
    expect(seat.region).toBe('northWest');
    expect(game.player.region).toBe('northWest');
    expect(seat.winner).toBe('lab');
    expect(seat.shares.lab).toBe(safest);
    expect(game.seatMap.filter((s) => s.isPlayerSeat).map((s) => s.id)).toEqual([seat.id]);
    expect(game.history.some((h) => h.kind === 'event' && h.headline.includes('Heir wins a by-election'))).toBe(true);
  });

  it('without a choice, keeps the mentor’s seat', () => {
    const game = createNewGame(makeInput({ region: 'london' }));
    const mentorSeat = game.player.seatId;
    continueAsProtegeCore(game, new Rng(7), makeInput({ name: 'Heir' }));
    expect(game.player.seatId).toBe(mentorSeat);
  });
});
