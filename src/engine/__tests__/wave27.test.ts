import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { nextOfficeFor } from '../career';
import { OFFICES } from '../../data/offices';
import { Rng } from '../rng';
import { Era, PartyId, OfficeId } from '../../types/game';

function makeGame(partyId: PartyId = 'lab', era: Era = '2024', seed = 1234) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 45, region: 'london',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era, seed,
  };
  return createNewGame(input);
}

describe('wave 27 — Cabinet ministers get reshuffled (no decade-long stagnation)', () => {
  it('offers a sitting Secretary of State a lateral Cabinet move, never null or the same post', () => {
    const g = makeGame('lab', '2024', 3); // Labour governs in 2024
    g.player.officeId = 'sos_health';
    let differentSos = 0, greatOffice = 0;
    for (let i = 0; i < 400; i++) {
      const t = nextOfficeFor(g, new Rng(i));
      expect(t).not.toBeNull();                 // a Cabinet minister IS offered moves now
      expect(t).not.toBe('sos_health');         // never the post they already hold
      expect(OFFICES[t as OfficeId]?.tier).toBe(4); // a lateral Cabinet move, not a demotion
      if (t !== 'sos_health' && (t as string).startsWith('sos_')) differentSos++;
      if (['sos_treasury', 'sos_home', 'sos_foreign'].includes(t as string)) greatOffice++;
    }
    expect(differentSos).toBeGreaterThan(0);    // moves to other departments
    expect(greatOffice).toBeGreaterThan(0);     // and occasionally a great office of state
  });
});
