import { Era, PartyId, RegionId } from '../types/game';

/** seats per party per region at the start of each era's parliament */
export type SeatMatrix = Record<RegionId, Partial<Record<PartyId, number>>>;

export interface ParliamentData {
  era: Era;
  /** ISO date of the first sitting day */
  firstSitting: string;
  matrix: SeatMatrix;
  /** national GE vote shares (0..1), the election engine's anchor */
  baselineShares: Partial<Record<PartyId, number>>;
  governingParty: PartyId;
  oppositionParty: PartyId;
  /** how the government holds power at game start (defaults from the majority
   *  sign if omitted) — e.g. 2017 began as a DUP confidence-and-supply deal */
  arrangement?: 'majority' | 'minority' | 'supplyConfidence' | 'coalition';
  confidencePartner?: PartyId;
  coalitionPartner?: PartyId;
}

// 2019 GE: Con 365, Lab 202, SNP 48, LD 11, DUP 8, SF 7, PC 4, SDLP 2,
// Green 1, Alliance 1, Speaker 1 = 650
const MATRIX_2019: SeatMatrix = {
  northEast: { lab: 19, con: 10 },
  northWest: { lab: 41, con: 32, ld: 1, spk: 1 },
  yorkshire: { lab: 28, con: 26 },
  eastMidlands: { con: 38, lab: 8 },
  westMidlands: { con: 44, lab: 15 },
  east: { con: 52, lab: 5, ld: 1 },
  london: { lab: 49, con: 21, ld: 3 },
  southEast: { con: 74, lab: 8, ld: 1, green: 1 },
  southWest: { con: 48, lab: 6, ld: 1 },
  scotland: { snp: 48, con: 6, ld: 4, lab: 1 },
  wales: { lab: 22, con: 14, pc: 4 },
  ni: { dup: 8, sf: 7, sdlp: 2, alliance: 1 },
};

// 2024 GE: Lab 411, Con 121, LD 72, SNP 9, SF 7, Ind 7, DUP 5, Reform 5,
// Green 4, PC 4, SDLP 2, Alliance 1, UUP 1, Speaker 1 = 650
const MATRIX_2024: SeatMatrix = {
  northEast: { lab: 26, con: 1 },
  northWest: { lab: 66, con: 3, ld: 2, ind: 1, spk: 1 },
  yorkshire: { lab: 44, con: 8, ld: 1, ind: 1 },
  eastMidlands: { lab: 29, con: 14, reform: 2, ld: 1, ind: 1 },
  westMidlands: { lab: 36, con: 17, ld: 2, green: 1, ind: 1 },
  east: { lab: 27, con: 21, ld: 9, reform: 3, green: 1 },
  london: { lab: 59, con: 9, ld: 6, ind: 1 },
  southEast: { lab: 36, con: 31, ld: 23, green: 1 },
  southWest: { lab: 24, ld: 21, con: 12, green: 1 },
  scotland: { lab: 37, snp: 9, ld: 6, con: 5 },
  wales: { lab: 27, pc: 4, ld: 1 },
  ni: { sf: 7, dup: 5, sdlp: 2, alliance: 1, uup: 1, ind: 2 },
};

// 2015 GE: Con 330, Lab 232, SNP 56, LD 8, DUP 8, SF 4, SDLP 3, PC 3, UUP 2,
// UKIP 1, Green 1, Ind 1, Speaker 1 = 650
const MATRIX_2015: SeatMatrix = {
  northEast: { lab: 26, con: 3 },
  northWest: { lab: 51, con: 22, ld: 2 },
  yorkshire: { lab: 33, con: 20, ld: 1 },
  eastMidlands: { con: 32, lab: 14 },
  westMidlands: { con: 34, lab: 25 },
  east: { con: 52, lab: 4, ukip: 1, ld: 1 },
  london: { lab: 45, con: 27, ld: 1 },
  southEast: { con: 77, lab: 4, ld: 1, green: 1, spk: 1 },
  southWest: { con: 51, lab: 4 },
  scotland: { snp: 56, lab: 1, con: 1, ld: 1 },
  wales: { lab: 25, con: 11, pc: 3, ld: 1 },
  ni: { dup: 8, sf: 4, sdlp: 3, uup: 2, ind: 1 },
};

// 2017 GE: Con 317, Lab 262, SNP 35, LD 12, DUP 10, SF 7, PC 4, Green 1,
// Ind 1, Speaker 1 = 650 (a hung parliament; Con govern with DUP support)
const MATRIX_2017: SeatMatrix = {
  northEast: { lab: 26, con: 3 },
  northWest: { lab: 54, con: 20, ld: 1 },
  yorkshire: { lab: 37, con: 17 },
  eastMidlands: { con: 31, lab: 15 },
  westMidlands: { con: 35, lab: 24 },
  east: { con: 50, lab: 7, ld: 1 },
  london: { lab: 49, con: 21, ld: 3 },
  southEast: { con: 73, lab: 8, ld: 1, green: 1, spk: 1 },
  southWest: { con: 47, lab: 7, ld: 1 },
  scotland: { snp: 35, con: 12, lab: 7, ld: 5 },
  wales: { lab: 28, con: 8, pc: 4 },
  ni: { dup: 10, sf: 7, ind: 1 },
};

export const PARLIAMENTS: Record<Era, ParliamentData> = {
  '2015': {
    era: '2015',
    firstSitting: '2015-05-18',
    matrix: MATRIX_2015,
    baselineShares: {
      con: 0.369, lab: 0.304, ukip: 0.126, ld: 0.079, snp: 0.047,
      green: 0.038, pc: 0.006,
    },
    governingParty: 'con',
    oppositionParty: 'lab',
  },
  '2017': {
    era: '2017',
    firstSitting: '2017-06-19',
    matrix: MATRIX_2017,
    baselineShares: {
      con: 0.424, lab: 0.40, ld: 0.074, snp: 0.030, ukip: 0.018,
      green: 0.016, pc: 0.005,
    },
    governingParty: 'con',
    oppositionParty: 'lab',
    arrangement: 'supplyConfidence',
    confidencePartner: 'dup',
  },
  '2019': {
    era: '2019',
    firstSitting: '2019-12-17',
    matrix: MATRIX_2019,
    baselineShares: {
      con: 0.447, lab: 0.33, ld: 0.118, snp: 0.04,
      green: 0.028, brexit: 0.02, pc: 0.005,
    },
    governingParty: 'con',
    oppositionParty: 'lab',
  },
  '2024': {
    era: '2024',
    firstSitting: '2024-07-09',
    matrix: MATRIX_2024,
    baselineShares: {
      lab: 0.337, con: 0.237, reform: 0.143, ld: 0.122,
      green: 0.067, snp: 0.025, pc: 0.007,
    },
    governingParty: 'lab',
    oppositionParty: 'con',
  },
};

export function nationalTotals(matrix: SeatMatrix): Partial<Record<PartyId, number>> {
  const totals: Partial<Record<PartyId, number>> = {};
  for (const region of Object.values(matrix)) {
    for (const [party, n] of Object.entries(region)) {
      totals[party as PartyId] = (totals[party as PartyId] ?? 0) + (n ?? 0);
    }
  }
  return totals;
}

export function totalSeats(matrix: SeatMatrix): number {
  return Object.values(nationalTotals(matrix)).reduce((a, b) => a + (b ?? 0), 0);
}
