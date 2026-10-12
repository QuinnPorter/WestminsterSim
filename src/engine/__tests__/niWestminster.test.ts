import { describe, expect, it } from 'vitest';
import { Era, PartyId } from '../../types/game';
import { PARTIES } from '../../data/parties';
import { PARLIAMENTS } from '../../data/parliaments';
import {
  NI_CONSTITUENCIES, NI_POLLED, NI_WESTMINSTER, niConstituencyName, NI_BOUNDARY_DAY,
} from '../../data/niWestminster';
import { westminsterWinner } from '../../generation/constituency';
import { isoToDay } from '../clock';

const ERAS: Era[] = ['2010', '2015', '2017', '2019', '2024'];

describe('Northern Ireland at Westminster: the data', () => {
  it('has eighteen constituencies with distinct ids and names', () => {
    expect(NI_CONSTITUENCIES).toHaveLength(18);
    expect(new Set(NI_CONSTITUENCIES.map((c) => c.id)).size).toBe(18);
    expect(new Set(NI_CONSTITUENCIES.map((c) => c.name)).size).toBe(18);
  });

  it('renames Belfast South at the 2024 boundary review and nowhere else', () => {
    const before = NI_CONSTITUENCIES.map((c) => niConstituencyName(c, NI_BOUNDARY_DAY - 1));
    const after = NI_CONSTITUENCIES.map((c) => niConstituencyName(c, NI_BOUNDARY_DAY));
    expect(before).toContain('Belfast South');
    expect(after).toContain('Belfast South and Mid Down');
    expect(before.filter((n, i) => n !== after[i])).toHaveLength(1);
    expect(new Set(before).size).toBe(18);
  });

  for (const era of ERAS) {
    const r = NI_WESTMINSTER[era];
    it(`${era}: every constituency has a winner and the winners match the era matrix`, () => {
      const ids = NI_CONSTITUENCIES.map((c) => c.id).sort();
      expect(Object.keys(r.winners).sort()).toEqual(ids);
      // the Commons model carries a devolved-only winner (the TUV in North Antrim,
      // 2024) as an independent until the Assembly is built
      const counts: Partial<Record<PartyId, number>> = {};
      for (const p of Object.values(r.winners)) {
        const k = westminsterWinner(p);
        counts[k] = (counts[k] ?? 0) + 1;
      }
      expect(counts).toEqual(PARLIAMENTS[era].matrix.ni);
    });

    it(`${era}: the NI-wide vote sums to about one and every winner has a share`, () => {
      const sum = Object.values(r.shares).reduce((a, b) => a + (b ?? 0), 0) + r.others;
      expect(sum).toBeGreaterThan(0.98);
      expect(sum).toBeLessThan(1.02);
      for (const p of new Set(Object.values(r.winners))) {
        expect(r.shares[p], `${era} ${p}`).toBeGreaterThan(0);
        expect(PARTIES[p], `${era} ${p} is a party`).toBeDefined();
      }
      for (const p of NI_POLLED) {
        expect(r.shares[p], `${era} polled ${p}`).toBeGreaterThan(0.03);
        expect(PARTIES[p].contestsRegions).toEqual(['ni']);
      }
      expect(isoToDay(r.election)).toBeGreaterThanOrEqual(isoToDay(PARLIAMENTS[era].firstSitting) - 60);
    });
  }
});
