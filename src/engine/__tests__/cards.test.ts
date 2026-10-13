import { describe, expect, it } from 'vitest';
import { ALL_CARDS, CARD_TOKENS, validateCards } from '../../content/cards';
import { resolveTokens } from '../cardEngine';
import { newTestGame } from '../../test/play';

describe('the card corpus', () => {
  it('validates, and every token the validator allows is one the engine resolves', () => {
    expect(validateCards(ALL_CARDS)).toEqual([]);
    const g = newTestGame({ seed: 1 });
    for (const token of CARD_TOKENS) {
      expect(resolveTokens(g, `{${token}}`)).not.toBe(`{${token}}`);
    }
    // and a token the validator does not know stays unresolved, so the check bites
    expect(resolveTokens(g, '{nosuchtoken}')).toBe('{nosuchtoken}');
  });
});

describe('the decks are at their floors', () => {
  it('Stormont, the collapse, City Hall, the outside leader and Northern Ireland at Westminster', async () => {
    const { NI_CARDS } = await import('../../content/cards/nations/ni');
    const { NI_COLLAPSE_CARDS } = await import('../../content/cards/nations/niCollapse');
    const { MAYOR_CARDS, OUTSIDE_LEADER_CARDS } = await import('../../content/cards');
    const { REGION_CARDS } = await import('../../content/cards/regionCards');
    expect(NI_CARDS.length).toBeGreaterThanOrEqual(40);
    expect(NI_COLLAPSE_CARDS.length).toBeGreaterThanOrEqual(12);
    expect(MAYOR_CARDS.length).toBeGreaterThanOrEqual(25);
    expect(OUTSIDE_LEADER_CARDS.length).toBeGreaterThanOrEqual(6);
    expect(REGION_CARDS.filter((c) => c.requires?.region?.includes('ni')).length).toBeGreaterThanOrEqual(6);
  });
});
