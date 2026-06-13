import { describe, expect, it } from 'vitest';
import { PARLIAMENTS, nationalTotals, totalSeats } from '../../data/parliaments';
import { PARTIES } from '../../data/parties';
import { OFFICES, CABINET_OFFICES } from '../../data/offices';
import { validateCards, ALL_CARDS } from '../../content/cards';
import { generateSeatMap, countSeats } from '../../generation/constituency';
import { Rng } from '../rng';

describe('parliament data', () => {
  it('2019 matrix sums to 650 with correct national totals', () => {
    const m = PARLIAMENTS['2019'].matrix;
    expect(totalSeats(m)).toBe(650);
    const t = nationalTotals(m);
    expect(t.con).toBe(365);
    expect(t.lab).toBe(202);
    expect(t.snp).toBe(48);
    expect(t.ld).toBe(11);
    expect(t.sf).toBe(7);
    expect(t.spk).toBe(1);
  });

  it('2024 matrix sums to 650 with correct national totals', () => {
    const m = PARLIAMENTS['2024'].matrix;
    expect(totalSeats(m)).toBe(650);
    const t = nationalTotals(m);
    expect(t.lab).toBe(411);
    expect(t.con).toBe(121);
    expect(t.ld).toBe(72);
    expect(t.snp).toBe(9);
    expect(t.reform).toBe(5);
    expect(t.green).toBe(4);
    expect(t.sf).toBe(7);
    expect(t.ind).toBe(7);
    expect(t.spk).toBe(1);
  });

  it('2015 matrix sums to 650 with correct national totals', () => {
    const m = PARLIAMENTS['2015'].matrix;
    expect(totalSeats(m)).toBe(650);
    const t = nationalTotals(m);
    expect(t.con).toBe(330);
    expect(t.lab).toBe(232);
    expect(t.snp).toBe(56);
    expect(t.ld).toBe(8);
    expect(t.dup).toBe(8);
    expect(t.ukip).toBe(1);
    expect(t.spk).toBe(1);
  });

  it('2017 matrix sums to 650 with correct national totals', () => {
    const m = PARLIAMENTS['2017'].matrix;
    expect(totalSeats(m)).toBe(650);
    const t = nationalTotals(m);
    expect(t.con).toBe(317);
    expect(t.lab).toBe(262);
    expect(t.snp).toBe(35);
    expect(t.ld).toBe(12);
    expect(t.dup).toBe(10);
    expect(t.spk).toBe(1);
  });

  it('2017 begins as a DUP confidence-and-supply arrangement', () => {
    expect(PARLIAMENTS['2017'].arrangement).toBe('supplyConfidence');
    expect(PARLIAMENTS['2017'].confidencePartner).toBe('dup');
  });

  it('every party id has metadata', () => {
    for (const m of Object.values(PARLIAMENTS)) {
      for (const region of Object.values(m.matrix)) {
        for (const p of Object.keys(region)) {
          expect(PARTIES[p as keyof typeof PARTIES]).toBeDefined();
        }
      }
    }
  });

  it('cabinet offices all exist', () => {
    for (const id of CABINET_OFFICES) expect(OFFICES[id]).toBeDefined();
  });

  it('card content validates', () => {
    expect(validateCards(ALL_CARDS)).toEqual([]);
  });
});

describe('seat map generation', () => {
  it('generates 650 seats matching the matrix (player seat may shift one)', () => {
    for (const era of ['2015', '2017', '2019', '2024'] as const) {
      const rng = new Rng(42);
      const { seatMap, playerSeatId } = generateSeatMap(
        rng, PARLIAMENTS[era].matrix, era === '2019' ? 'con' : 'lab', 'southEast'
      );
      expect(seatMap).toHaveLength(650);
      expect(seatMap.find((s) => s.id === playerSeatId)?.isPlayerSeat).toBe(true);
      const counts = countSeats(seatMap);
      const expected = nationalTotals(PARLIAMENTS[era].matrix);
      for (const [party, n] of Object.entries(expected)) {
        const got = counts[party as keyof typeof counts] ?? 0;
        expect(Math.abs(got - (n ?? 0))).toBeLessThanOrEqual(1);
      }
    }
  });

  it('flips a seat when the player party has none in the region', () => {
    const rng = new Rng(7);
    const { seatMap, playerSeatId } = generateSeatMap(
      rng, PARLIAMENTS['2019'].matrix, 'green', 'northEast'
    );
    const seat = seatMap.find((s) => s.id === playerSeatId)!;
    expect(seat.winner).toBe('green');
    expect(seat.region).toBe('northEast');
  });

  it('seat names are unique', () => {
    const rng = new Rng(99);
    const { seatMap } = generateSeatMap(rng, PARLIAMENTS['2024'].matrix, 'lab', 'london');
    const names = new Set(seatMap.map((s) => s.name));
    expect(names.size).toBe(650);
  });
});
