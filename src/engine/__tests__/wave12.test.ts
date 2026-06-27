import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { offerThreshold, OFFER_THRESHOLDS, continueAsProtegeCore } from '../career';
import { GameState } from '../../types/game';
import { Rng } from '../rng';

function makeInput(seed = 42, partyId: CreationInput['partyId'] = 'con'): CreationInput {
  return {
    name: 'Test MP', gender: 'f', age: 47, region: 'yorkshire',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
}
const makeGame = (seed = 42, partyId: CreationInput['partyId'] = 'con') =>
  createNewGame(makeInput(seed, partyId));

describe('wave 12 — the great offices are harder to reach', () => {
  it('Chancellor is the highest bar, then Foreign/Home, above other cabinet posts', () => {
    const base = OFFER_THRESHOLDS[4]; // 59 — the plain tier-4 bar
    expect(offerThreshold('sos_treasury')).toBe(63);
    expect(offerThreshold('sos_home')).toBe(60);
    expect(offerThreshold('sos_foreign')).toBe(60);
    // an ordinary Secretary of State still uses the plain tier-4 bar
    expect(offerThreshold('sos_health')).toBe(base);
    expect(offerThreshold('sos_treasury')).toBeGreaterThan(offerThreshold('sos_home'));
    expect(offerThreshold('sos_home')).toBeGreaterThan(base);
  });
});

describe('wave 12 — committee chairmanships carry into mentor history', () => {
  it('a retired chair\'s committee tenure is archived in the mentor career', () => {
    const game = makeGame();
    game.player.hasSeat = true;
    game.history.push(
      { kind: 'committeeTenure', date: game.day - 400, action: 'start', dept: 'treasury' },
      { kind: 'committeeTenure', date: game.day, action: 'end', dept: 'treasury' },
    );
    continueAsProtegeCore(game, new Rng(3), makeInput(99));
    const mentor = (game.mentors ?? [])[game.mentors!.length - 1];
    expect(mentor).toBeDefined();
    const tenures = mentor.career.filter(
      (h: GameState['history'][number]) => h.kind === 'committeeTenure'
    );
    expect(tenures.length).toBe(2); // both the start and end markers survive into the archive
  });
});
