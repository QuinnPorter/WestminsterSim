import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { playerInGovernmentBloc } from '../career';
import { PartyId } from '../../types/game';

function makeGame(partyId: PartyId, seed = 7) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 45, region: 'london',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2010', seed,
  };
  return createNewGame(input);
}

describe('wave 28 — 2010 Con–LD coalition start', () => {
  it('seats a coalition government with Labour in opposition', () => {
    const g = makeGame('con');
    expect(g.government.arrangement).toBe('coalition');
    expect(g.government.coalitionPartner).toBe('ld');
    expect(g.government.governingParty).toBe('con');
    expect(g.government.oppositionParty).toBe('lab');
  });

  it('installs the Lib Dem leader as Deputy PM (an NPC, never the player)', () => {
    const g = makeGame('con');
    const dpm = g.government.deputyPmId;
    expect(dpm).toBeTruthy();
    expect(dpm).not.toBe('player');
    expect(g.characters[dpm!]?.partyId).toBe('ld');
    expect(g.government.deputyTitle).toBe('dpm');
  });

  it('seats at least one Lib Dem minister in the Cabinet', () => {
    const g = makeGame('con');
    const ldMinisters = g.government.cabinet.filter(
      (p) => g.characters[p.characterId]?.partyId === 'ld'
    );
    expect(ldMinisters.length).toBeGreaterThan(0);
  });

  it('a Lib Dem player starts in the governing bloc, tied to the LD leader', () => {
    const g = makeGame('ld');
    expect(g.player.partyId).toBe('ld');
    expect(playerInGovernmentBloc(g)).toBe(true);
    // the player's leader relationship is the same NPC who is Deputy PM
    const leaderRel = g.relationships.find((r) => r.kind === 'leader');
    expect(leaderRel?.characterId).toBe(g.government.deputyPmId);
    expect(g.characters[leaderRel!.characterId]?.partyId).toBe('ld');
    // the player is never seated as Deputy PM at start
    expect(g.government.deputyPmId).not.toBe('player');
  });

  it('a Conservative player governs and a Labour player is in opposition', () => {
    const con = makeGame('con');
    expect(playerInGovernmentBloc(con)).toBe(true);
    const lab = makeGame('lab');
    expect(playerInGovernmentBloc(lab)).toBe(false);
  });
});
