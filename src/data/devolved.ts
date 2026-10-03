import { DevolvedArenaId, GameDay, PartyId } from '../types/game';
import { isoToDay } from '../engine/clock';

/** One devolved general election — the starting composition for a career that
 *  begins in that chamber, or arrives in it any time after this date and before
 *  the next one. Same role `parliaments.ts` plays for the Commons. */
export interface LegislatureSnapshot {
  /** ISO polling day */
  election: string;
  /** a one-line framing of the situation, shown on the era picker */
  blurb: string;
  /** every seat won, by party. Must sum to the size of the House. */
  seats: Partial<Record<PartyId, number>>;
  /** constituency seats won, by list region and party */
  constituencySeats: Record<string, Partial<Record<PartyId, number>>>;
  /** list seats won nationally, by party (regional breakdown is calibrated) */
  listSeats: Partial<Record<PartyId, number>>;
  /** the regional-list vote (0..1) — the headline figure Holyrood polls report
   *  and the election model's swing anchor */
  shares: Partial<Record<PartyId, number>>;
  /** the constituency vote (0..1) — what each FPTP seat's shares calibrate to */
  constituencyShares: Partial<Record<PartyId, number>>;
  /** the parties actually on the ballot in THIS parliament */
  parties: PartyId[];
  governing: PartyId;
  opposition: PartyId;
  arrangement: 'majority' | 'minority' | 'supplyConfidence' | 'coalition';
  coalitionPartner?: PartyId;
  confidencePartner?: PartyId;
}

/* ---------------------------------------------------------------------------
 * Seat counts and vote shares were written from memory in October 2026 and are
 * guarded by `arena.test.ts` for arithmetic (seats sum to the House, shares sum
 * to about one, every seat-winner is on the ballot). They should still be
 * checked against the official returns — HillSim's first pass from memory had
 * real errors that checking caught.
 *
 * 2007 is not offered: it predates the 2010 Commons, the earliest Westminster
 * parliament the game carries. 2026 is not offered either: both elections took
 * place on 7 May 2026 and their results are deliberately not guessed here. A
 * career that starts in 2021 fights the 2026 election in the simulation.
 * ------------------------------------------------------------------------- */

const SCOTLAND: LegislatureSnapshot[] = [
  {
    election: '2011-05-05',
    blurb: 'Alex Salmond wins the majority the voting system was designed to prevent. Labour’s Iain Gray loses every seat he hoped to win, and a referendum on independence is now a question of when.',
    seats: { snp: 69, lab: 37, con: 15, ld: 5, sgp: 2, ind: 1 },
    constituencySeats: {
      central: { snp: 6, lab: 3 },
      glasgow: { snp: 5, lab: 4 },
      highlands: { snp: 6, ld: 2 },
      lothian: { snp: 8, lab: 1 },
      midScotland: { snp: 8, lab: 1 },
      northEast: { snp: 10 },
      south: { snp: 4, con: 3, lab: 2 },
      west: { snp: 6, lab: 4 },
    },
    listSeats: { snp: 16, lab: 22, con: 12, ld: 3, sgp: 2, ind: 1 },
    shares: { snp: 0.440, lab: 0.263, con: 0.124, ld: 0.052, sgp: 0.044 },
    constituencyShares: { snp: 0.454, lab: 0.317, con: 0.139, ld: 0.079, sgp: 0.001 },
    parties: ['snp', 'lab', 'con', 'ld', 'sgp'],
    governing: 'snp', opposition: 'lab', arrangement: 'majority',
  },
  {
    election: '2016-05-05',
    blurb: 'Nicola Sturgeon is two seats short of a majority. Ruth Davidson’s Conservatives leapfrog Labour into second place for the first time, and the Greens hold the balance.',
    seats: { snp: 63, con: 31, lab: 24, sgp: 6, ld: 5 },
    constituencySeats: {
      central: { snp: 9 },
      glasgow: { snp: 9 },
      highlands: { snp: 6, ld: 2 },
      lothian: { snp: 6, con: 1, lab: 1, ld: 1 },
      midScotland: { snp: 8, ld: 1 },
      northEast: { snp: 9, con: 1 },
      south: { snp: 4, con: 4, lab: 1 },
      west: { snp: 8, lab: 1, con: 1 },
    },
    listSeats: { snp: 4, con: 24, lab: 21, sgp: 6, ld: 1 },
    shares: { snp: 0.417, con: 0.229, lab: 0.191, sgp: 0.066, ld: 0.052, ukip: 0.020 },
    constituencyShares: { snp: 0.465, con: 0.220, lab: 0.226, ld: 0.078, sgp: 0.006, ukip: 0.002 },
    parties: ['snp', 'con', 'lab', 'sgp', 'ld', 'ukip'],
    governing: 'snp', opposition: 'con', arrangement: 'minority',
  },
  {
    election: '2021-05-06',
    blurb: 'A pandemic election. Sturgeon wins a fourth SNP term one seat short of a majority; the Greens take eight and will shortly enter government under the Bute House Agreement. Alba wins nothing.',
    seats: { snp: 64, con: 31, lab: 22, sgp: 8, ld: 4 },
    constituencySeats: {
      central: { snp: 9 },
      glasgow: { snp: 9 },
      highlands: { snp: 6, ld: 2 },
      lothian: { snp: 7, lab: 1, ld: 1 },
      midScotland: { snp: 8, ld: 1 },
      northEast: { snp: 9, con: 1 },
      south: { snp: 6, con: 3 },
      west: { snp: 8, lab: 1, con: 1 },
    },
    listSeats: { snp: 2, con: 26, lab: 20, sgp: 8 },
    shares: { snp: 0.403, con: 0.235, lab: 0.179, sgp: 0.081, ld: 0.051, alba: 0.017, reform: 0.002 },
    constituencyShares: { snp: 0.477, con: 0.219, lab: 0.216, ld: 0.069, sgp: 0.013, alba: 0.001, reform: 0.001 },
    parties: ['snp', 'con', 'lab', 'sgp', 'ld', 'alba', 'reform'],
    governing: 'snp', opposition: 'con', arrangement: 'minority',
  },
];

const WALES: LegislatureSnapshot[] = [
  {
    election: '2011-05-05',
    blurb: 'Carwyn Jones takes Labour to exactly half the chamber — thirty of sixty — on the day Wales also votes for full law-making powers. The One Wales coalition with Plaid is over; Labour governs alone.',
    seats: { lab: 30, con: 14, pc: 11, ld: 5 },
    constituencySeats: {
      northWales: { lab: 5, con: 2, pc: 2 },
      midWest: { con: 3, pc: 3, lab: 1, ld: 1 },
      southWest: { lab: 7 },
      southCentral: { lab: 8 },
      southEast: { lab: 7, con: 1 },
    },
    listSeats: { lab: 2, con: 8, pc: 6, ld: 4 },
    shares: { lab: 0.369, con: 0.225, pc: 0.179, ld: 0.080, ukip: 0.046, green: 0.034 },
    constituencyShares: { lab: 0.423, con: 0.250, pc: 0.193, ld: 0.106, ukip: 0.010, green: 0.008 },
    parties: ['lab', 'con', 'pc', 'ld', 'ukip', 'green'],
    governing: 'lab', opposition: 'con', arrangement: 'minority',
  },
  {
    election: '2016-05-05',
    blurb: 'Labour slips to 29 and UKIP wins seven list seats. Carwyn Jones is re-nominated only after a tied vote with Leanne Wood, and brings the last Liberal Democrat, Kirsty Williams, into his cabinet.',
    seats: { lab: 29, pc: 12, con: 11, ukip: 7, ld: 1 },
    constituencySeats: {
      northWales: { lab: 5, con: 2, pc: 2 },
      midWest: { con: 3, pc: 3, lab: 1, ld: 1 },
      southWest: { lab: 7 },
      southCentral: { lab: 7, pc: 1 },
      southEast: { lab: 7, con: 1 },
    },
    listSeats: { lab: 2, pc: 6, con: 5, ukip: 7 },
    shares: { lab: 0.315, pc: 0.208, con: 0.188, ukip: 0.130, ld: 0.065, green: 0.030 },
    constituencyShares: { lab: 0.347, pc: 0.205, con: 0.211, ukip: 0.125, ld: 0.077, green: 0.010 },
    parties: ['lab', 'pc', 'con', 'ukip', 'ld', 'green'],
    governing: 'lab', opposition: 'pc', arrangement: 'minority',
  },
  {
    election: '2021-05-06',
    blurb: 'Mark Drakeford’s pandemic premiership is rewarded with thirty seats, Labour’s best Senedd result. The Conservatives take second place from Plaid; a co-operation agreement with Plaid follows in December.',
    seats: { lab: 30, con: 16, pc: 13, ld: 1 },
    constituencySeats: {
      northWales: { lab: 4, con: 3, pc: 2 },
      midWest: { con: 4, pc: 3, lab: 1 },
      southWest: { lab: 7 },
      southCentral: { lab: 8 },
      southEast: { lab: 7, con: 1 },
    },
    listSeats: { lab: 3, con: 8, pc: 8, ld: 1 },
    shares: { lab: 0.362, con: 0.251, pc: 0.207, green: 0.044, ld: 0.043, reform: 0.016 },
    constituencyShares: { lab: 0.399, con: 0.261, pc: 0.203, ld: 0.049, green: 0.016, reform: 0.016 },
    parties: ['lab', 'con', 'pc', 'ld', 'green', 'reform'],
    governing: 'lab', opposition: 'con', arrangement: 'minority',
  },
];

export const DEVOLVED_LEGISLATURES: Record<DevolvedArenaId, LegislatureSnapshot[]> = {
  scotland: SCOTLAND,
  wales: WALES,
};

/** How a party's regional-list vote compares with its constituency vote, as a
 *  multiplier on the constituency share. The SNP and Labour run below their
 *  constituency vote on the list (voters lend a second vote to the Greens); the
 *  Greens and Alba are almost entirely list parties. Calibrated so the 2016 and
 *  2021 list results reproduce from the constituency maps; see listSeats.test.ts. */
export const LIST_RATIO: Record<DevolvedArenaId, Partial<Record<PartyId, number>>> = {
  scotland: {
    snp: 0.85, con: 1.07, lab: 0.83, ld: 0.74, sgp: 6.5, alba: 17, reform: 2, ukip: 10,
  },
  wales: {
    lab: 0.90, con: 0.95, pc: 1.02, ld: 0.85, green: 3.2, ukip: 1.05, reform: 1.0,
  },
};

/** The legislature a player arriving on `day` walks into: the most recent
 *  result on or before that day, or the earliest on record if they arrive
 *  before it (a 2010-era Westminster start predates the first Holyrood era). */
export function legislatureAt(arena: DevolvedArenaId, day: GameDay): LegislatureSnapshot {
  const list = DEVOLVED_LEGISLATURES[arena];
  let best = list[0];
  for (const snap of list) {
    if (isoToDay(snap.election) <= day) best = snap;
  }
  return best;
}

/** the ISO polling days a career may begin on in a given chamber */
export function erasFor(arena: DevolvedArenaId): LegislatureSnapshot[] {
  return DEVOLVED_LEGISLATURES[arena];
}
