import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { buildLegacy, CHAMPION_THRESHOLD } from '../career';
import { applyEffects } from '../effects';
import { cardEligible } from '../cardEngine';
import { GameState, CauseId } from '../../types/game';
import { DecisionCard } from '../../types/content';

function makeGame(causes: CauseId[] = [], seed = 1): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed, causes,
  };
  return createNewGame(input);
}

/** a throwaway card with a single always-eligible choice; only `requires` matters */
function cardWith(requires: DecisionCard['requires']): DecisionCard {
  return {
    id: 'test_card', title: 'x', body: 'x', tags: ['party'],
    weight: 1, cooldownDays: 0, requires,
    choices: [{ label: 'a', effects: {}, outcomeText: 'x' }],
  };
}

describe('effect hooks', () => {
  it('bumpCause increments exactly one hidden cause tally', () => {
    const g = makeGame(['economy', 'environment']);
    applyEffects(g, { bumpCause: 'economy' });
    applyEffects(g, { bumpCause: 'economy' });
    expect(g.player.flags._champ_economy).toBe(2);
    expect(g.player.flags._champ_environment).toBeUndefined();
  });

  it('bumpHeldCauses bumps every held cause and is a no-op with no causes', () => {
    const g = makeGame(['economy', 'environment']);
    applyEffects(g, { bumpHeldCauses: true });
    applyEffects(g, { bumpHeldCauses: true });
    expect(g.player.flags._champ_economy).toBe(2);
    expect(g.player.flags._champ_environment).toBe(2);

    const noCause = makeGame([]);
    applyEffects(noCause, { bumpHeldCauses: true });
    const champKeys = Object.keys(noCause.player.flags).filter((k) => k.startsWith('_champ_'));
    expect(champKeys).toEqual([]);
  });

  it('spendFavour removes exactly one banked favour (the first) regardless of kind', () => {
    const g = makeGame();
    g.player.favours = [
      { kind: 'journalist', characterId: 'c1', note: '' },
      { kind: 'journalist', characterId: 'c2', note: '' },
      { kind: 'leader', characterId: 'c3', note: '' },
    ];
    applyEffects(g, { spendFavour: true });
    expect(g.player.favours).toHaveLength(2);
    expect(g.player.favours[0].characterId).toBe('c2');
    applyEffects(g, { spendFavour: true });
    applyEffects(g, { spendFavour: true });
    expect(g.player.favours).toHaveLength(0);
    // spending with nothing banked is a safe no-op
    applyEffects(g, { spendFavour: true });
    expect(g.player.favours).toHaveLength(0);
  });
});

describe('eligibility gates', () => {
  it('hasFavour requires at least one banked favour of any kind', () => {
    const g = makeGame();
    const card = cardWith({ hasFavour: true });
    expect(cardEligible(g, card)).toBe(false);
    // any kind qualifies — favours are one currency
    g.player.favours = [{ kind: 'mentor', characterId: 'c1', note: '' }];
    expect(cardEligible(g, card)).toBe(true);
  });

  it('minAge gates on player age', () => {
    const g = makeGame();
    g.player.age = 60;
    expect(cardEligible(g, cardWith({ minAge: 65 }))).toBe(false);
    g.player.age = 70;
    expect(cardEligible(g, cardWith({ minAge: 65 }))).toBe(true);
  });

  it('region gates on the player seat region', () => {
    const g = makeGame(); // seeded in southEast
    expect(cardEligible(g, cardWith({ region: ['southEast'] }))).toBe(true);
    expect(cardEligible(g, cardWith({ region: ['scotland', 'wales'] }))).toBe(false);
  });

  it('background gates on the player background', () => {
    const g = makeGame(); // lawyer
    expect(cardEligible(g, cardWith({ background: ['lawyer'] }))).toBe(true);
    expect(cardEligible(g, cardWith({ background: ['doctor'] }))).toBe(false);
  });

  it('causesAll requires the player to hold every listed cause', () => {
    const g = makeGame(['economy', 'environment']);
    expect(cardEligible(g, cardWith({ causesAll: ['economy', 'environment'] }))).toBe(true);
    expect(cardEligible(g, cardWith({ causesAll: ['economy', 'defence'] }))).toBe(false);
  });
});

describe('champion-of-cause verdict', () => {
  it('is reachable: reaching the threshold appends "a champion of" to the verdict', () => {
    const g = makeGame(['environment']);
    for (let i = 0; i < CHAMPION_THRESHOLD; i++) applyEffects(g, { bumpHeldCauses: true });
    const verdict = (buildLegacy(g).verdict ?? '').toLowerCase();
    expect(verdict).toContain('champion of');
    expect(verdict).toContain('environment');
  });

  it('does not fire below the threshold', () => {
    const g = makeGame(['environment']);
    for (let i = 0; i < CHAMPION_THRESHOLD - 1; i++) applyEffects(g, { bumpHeldCauses: true });
    expect((buildLegacy(g).verdict ?? '').toLowerCase()).not.toContain('champion of');
  });

  it('picks the single strongest cause when several are held', () => {
    const g = makeGame(['economy', 'environment']);
    // both accrue via held bumps; environment gets the specific edge
    for (let i = 0; i < CHAMPION_THRESHOLD; i++) applyEffects(g, { bumpHeldCauses: true });
    applyEffects(g, { bumpCause: 'environment' });
    const verdict = (buildLegacy(g).verdict ?? '').toLowerCase();
    expect(verdict).toContain('environment');
    expect(verdict).not.toContain('the economy');
  });
});
