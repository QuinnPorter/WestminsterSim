import { describe, expect, it } from 'vitest';
import { ALL_CARDS, MAYOR_CARDS, OUTSIDE_LEADER_CARDS, validateCards } from '../../content/cards';
import { NI_CARDS } from '../../content/cards/nations/ni';
import { NI_COLLAPSE_CARDS } from '../../content/cards/nations/niCollapse';
import { REGION_CARDS } from '../../content/cards/regionCards';
import { resolveTokens } from '../cardEngine';
import { newTestGame } from '../../test/play';

describe('the card corpus', () => {
  it('validates, and a token the validator does not know stays unresolved', () => {
    expect(validateCards(ALL_CARDS)).toEqual([]);
    // the validator and the resolver share one typed token list, so the only
    // behaviour left to check is that an unknown token is left as it was
    expect(resolveTokens(newTestGame({ seed: 1 }), '{nosuchtoken}')).toBe('{nosuchtoken}');
  });
});

describe('the decks are at their floors', () => {
  it('Stormont, the collapse, City Hall, the outside leader and Northern Ireland at Westminster', () => {
    expect(NI_CARDS.length).toBeGreaterThanOrEqual(40);
    expect(NI_COLLAPSE_CARDS.length).toBeGreaterThanOrEqual(12);
    expect(MAYOR_CARDS.length).toBeGreaterThanOrEqual(25);
    expect(OUTSIDE_LEADER_CARDS.length).toBeGreaterThanOrEqual(6);
    expect(REGION_CARDS.filter((c) => c.requires?.region?.includes('ni')).length).toBeGreaterThanOrEqual(6);
  });
});
