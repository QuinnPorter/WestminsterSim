import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { cardEligible } from '../cardEngine';
import { reassignJuniorPartnerDeputy, playerOfficeTitle } from '../career';
import { ERA_CARDS } from '../../content/cards/era';
import { Era, PartyId } from '../../types/game';

function makeGame(partyId: PartyId, era: Era = '2010', seed = 9) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 45, region: 'london',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era, seed,
  };
  return createNewGame(input);
}

const era10 = (id: string) => ERA_CARDS.find((c) => c.id === id)!;
const CARDS = ['era10_austerity', 'era10_tuition_fees', 'era10_coalition_strains'].map(era10);

describe('wave 31 part A — 2010 coalition cards only fire in the original coalition, for Con/LD', () => {
  it('eligible for a Con or LD player in the freshly-formed 2010 coalition', () => {
    for (const party of ['con', 'ld'] as PartyId[]) {
      const g = makeGame(party);
      for (const card of CARDS) expect(cardEligible(g, card)).toBe(true);
    }
  });

  it('NOT eligible for a Labour player (the reported bug)', () => {
    const g = makeGame('lab');
    for (const card of CARDS) expect(cardEligible(g, card)).toBe(false);
  });

  it('NOT eligible once the first general election has passed', () => {
    const g = makeGame('con');
    // simulate a GE having happened
    (g.elections as Record<string, unknown>)['e1'] = { date: g.day };
    for (const card of CARDS) expect(cardEligible(g, card)).toBe(false);
  });

  it('NOT eligible once the government is no longer a coalition', () => {
    const g = makeGame('con');
    g.government.arrangement = 'majority';
    for (const card of CARDS) expect(cardEligible(g, card)).toBe(false);
  });
});

describe('wave 31 part C — Deputy PM follows the junior coalition leader', () => {
  it('moves the DPM off the player when they lose the junior-party leadership, and back on re-win', () => {
    const g = makeGame('ld');
    const npcLd = g.government.deputyPmId!; // the NPC LD leader installed as DPM at game start
    expect(g.characters[npcLd]?.partyId).toBe('ld');

    // make the player the junior-partner Deputy PM (as if they won the LD leadership)
    g.player.officeId = 'leader';
    g.government.deputyPmId = 'player';
    g.government.deputyTitle = 'dpm';
    g.player.flags._isDeputyPM = true;

    // LOSS: an NPC takes the LD leadership → DPM transfers to them, player overlay clears
    reassignJuniorPartnerDeputy(g, 'ld', npcLd);
    expect(g.government.deputyPmId).toBe(npcLd);
    expect(g.government.deputyTitle).toBe('dpm');
    expect(g.player.flags._isDeputyPM).toBeFalsy();

    // RE-WIN: player retakes the LD leadership → DPM returns to the player
    reassignJuniorPartnerDeputy(g, 'ld', 'player');
    expect(g.government.deputyPmId).toBe('player');
    expect(g.player.flags._isDeputyPM).toBe(true);

    // and the title reads as Deputy PM (not the gov-side "Prime Minister" default)
    const title = playerOfficeTitle(g);
    expect(title).toContain('Deputy');
    expect(title.startsWith('Prime Minister')).toBe(false);
  });

  it('is a no-op outside a coalition or for a non-partner party', () => {
    const g = makeGame('ld');
    g.government.deputyPmId = 'player';
    g.player.flags._isDeputyPM = true;

    g.government.arrangement = 'majority';
    reassignJuniorPartnerDeputy(g, 'ld', 'someoneElse');
    expect(g.government.deputyPmId).toBe('player'); // unchanged

    g.government.arrangement = 'coalition';
    reassignJuniorPartnerDeputy(g, 'con', 'someoneElse'); // not the coalition partner
    expect(g.government.deputyPmId).toBe('player'); // unchanged
  });
});
