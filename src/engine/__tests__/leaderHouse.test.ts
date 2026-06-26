import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { OFFICES, CABINET_OFFICES } from '../../data/offices';
import { setDeputyPmCore, buildLegacy } from '../career';
import { cardEligible } from '../cardEngine';
import { ALL_CARDS } from '../../content/cards';
import { Rng } from '../rng';
import { GameState } from '../../types/game';

function makeGame(seed = 1, partyId: CreationInput['partyId'] = 'con'): GameState {
  return createNewGame({
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  });
}

describe('Leader of the House office', () => {
  it('is a tier-4 cabinet office with the right titles', () => {
    expect(OFFICES.leader_house.tier).toBe(4);
    expect(OFFICES.leader_house.title).toBe('Leader of the House of Commons');
    expect(OFFICES.leader_house.shadowTitle).toBe('Shadow Leader of the House of Commons');
    expect(OFFICES.leader_house.department).toBeUndefined();
    expect(CABINET_OFFICES).toContain('leader_house');
  });

  it('is seeded as a standing seat in both cabinet and shadow cabinet', () => {
    const g = makeGame();
    expect(g.government.cabinet.some((p) => p.officeId === 'leader_house')).toBe(true);
    expect(g.government.shadowCabinet.some((p) => p.officeId === 'leader_house')).toBe(true);
  });

  it('the holder is eligible to be made Deputy PM (a full cabinet office)', () => {
    const g = makeGame();
    g.player.officeId = 'leader';
    g.government.pmId = 'player';
    const lh = g.government.cabinet.find((p) => p.officeId === 'leader_house')!;
    setDeputyPmCore(g, new Rng(1), lh.characterId);
    expect(g.government.deputyPmId).toBe(lh.characterId);
  });
});

describe('Leader of the House end-screen title', () => {
  it('a government holder reads the formal Lord President title and rates as cabinet', () => {
    const g = makeGame();
    g.player.officeId = 'leader_house';
    g.history.push({
      kind: 'roleChange', date: g.day, officeId: 'leader_house', how: 'appointed', roleSide: 'gov',
    });
    const legacy = buildLegacy(g);
    expect(legacy.highestOfficeTitle).toBe('Cabinet — Leader of the House of Commons and Lord President of the Council');
    expect(legacy.rating).toBe('Heavyweight');
  });

  it('a shadow holder keeps the short title', () => {
    const g = makeGame();
    g.player.officeId = 'leader_house';
    g.history.push({
      kind: 'roleChange', date: g.day, officeId: 'leader_house', how: 'appointed', roleSide: 'opp',
    });
    const legacy = buildLegacy(g);
    expect(legacy.highestOfficeTitle).toBe('Cabinet — Shadow Leader of the House of Commons');
  });
});

describe('Leader of the House flavour cards', () => {
  it('the office requirement gates the cards to the office holder', () => {
    const card = ALL_CARDS.find((c) => c.id === 'lh_business_statement')!;
    expect(card).toBeDefined();
    const g = makeGame(); // con player, con governing
    g.player.officeId = 'whip';
    expect(cardEligible(g, card)).toBe(false);
    g.player.officeId = 'leader_house';
    expect(cardEligible(g, card)).toBe(true);
  });
});
