import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { runElection } from '../election';
import { nextOfficeFor, backfillCabinetOffices } from '../career';
import { Rng } from '../rng';
import { OFFICES, CABINET_OFFICES } from '../../data/offices';
import { Era, PartyId } from '../../types/game';

function makeGame(partyId: PartyId = 'lab', era: Era = '2024', seed = 1234) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 40, region: 'yorkshire',
    background: 'teacher', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era, seed,
  };
  return createNewGame(input);
}

describe('wave 18 — populist seat cap', () => {
  it('a strong populist no longer out-converts the Lib Dems at the same high share', () => {
    const seatsAt = (P: PartyId, share: number) => {
      let s = 0; const runs = 20;
      for (let i = 0; i < runs; i++) {
        const g = makeGame('lab', '2024', 3000 + i);
        const rest = (1 - share - 0.05 - 0.04 - 0.02 - 0.01);
        const base: Record<string, number> = { ld: 0.14, lab: (rest - 0.09) / 2, con: (rest - 0.09) / 2, reform: 0.05, green: 0.04, snp: 0.02, pc: 0.01 };
        base[P] = share;
        g.polling.shares = base as Record<PartyId, number>;
        s += runElection(g, new Rng(9000 + i)).result.seats[P] ?? 0;
      }
      return s / runs;
    };
    // at a strong 38% lead the populist lands at or below the (concentrated) Lib Dems
    expect(seatsAt('reform', 0.38)).toBeLessThanOrEqual(seatsAt('ld', 0.38) + 5);
  });

  it('a populist can still win a majority at a high enough share', () => {
    let maj = 0; const runs = 20;
    for (let i = 0; i < runs; i++) {
      const g = makeGame('reform', '2024', 4000 + i);
      g.polling.shares = { reform: 0.46, lab: 0.18, con: 0.16, ld: 0.10, green: 0.05, snp: 0.03, pc: 0.01 } as Record<PartyId, number>;
      const { result } = runElection(g, new Rng(9500 + i));
      if (result.outcome === 'majority' && result.governingParty === 'reform') maj++;
    }
    expect(maj).toBeGreaterThan(0); // winning is still possible
  });
});

describe('wave 18 — new offices', () => {
  it('defines Energy Secretary, Duchy of Lancaster, and Attorney General', () => {
    expect(OFFICES.sos_energy?.tier).toBe(4);
    expect(OFFICES.sos_energy?.title).toBe('Energy Secretary');
    expect(OFFICES.min_energy?.tier).toBe(3);
    expect(OFFICES.chancellor_duchy?.tier).toBe(4);
    expect(OFFICES.attorney_general?.tier).toBe(4);
    // Energy & the Duchy sit in cabinet; the Attorney General does NOT
    expect(CABINET_OFFICES).toContain('sos_energy');
    expect(CABINET_OFFICES).toContain('chancellor_duchy');
    expect(CABINET_OFFICES).not.toContain('attorney_general');
  });

  it('offers the Attorney General to a tier-4-bound player', () => {
    const g = makeGame();
    g.player.officeId = 'min_health';
    let ag = 0;
    for (let i = 0; i < 400; i++) if (nextOfficeFor(g, new Rng(i)) === 'attorney_general') ag++;
    expect(ag).toBeGreaterThan(0);
  });
});

describe('wave 18 — cabinet backfill migration', () => {
  it('fills new cabinet seats missing from an older save', () => {
    const g = makeGame();
    // simulate a pre-v8 save: strip the new posts from both benches
    g.government.cabinet = g.government.cabinet.filter((p) => p.officeId !== 'sos_energy' && p.officeId !== 'chancellor_duchy');
    g.government.shadowCabinet = g.government.shadowCabinet.filter((p) => p.officeId !== 'sos_energy' && p.officeId !== 'chancellor_duchy');
    backfillCabinetOffices(g, new Rng(1));
    for (const id of CABINET_OFFICES) {
      expect(g.government.cabinet.some((p) => p.officeId === id)).toBe(true);
      expect(g.government.shadowCabinet.some((p) => p.officeId === id)).toBe(true);
    }
    // the backfilled NPCs belong to the right parties
    const energyGov = g.government.cabinet.find((p) => p.officeId === 'sos_energy')!;
    expect(g.characters[energyGov.characterId].partyId).toBe(g.government.governingParty);
  });
});
