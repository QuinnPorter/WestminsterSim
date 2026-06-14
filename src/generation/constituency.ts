import { Era, PartyId, RegionId, SyntheticSeat } from '../types/game';
import { PARTIES, populistPartyForEra } from '../data/parties';
import { SeatMatrix } from '../data/parliaments';
import { CONSTITUENCY_POOLS } from '../data/constituencyNames';
import { Rng } from '../engine/rng';

/** parties that realistically appear on a ballot in a region — only the era's
 *  right-populist party (UKIP / Brexit / Reform) ever contests, never the others */
function contestants(region: RegionId, era: Era): PartyId[] {
  const populist = populistPartyForEra(era);
  const wrongPopulists = (['ukip', 'brexit', 'reform'] as PartyId[]).filter((p) => p !== populist);
  return (Object.keys(PARTIES) as PartyId[]).filter((p) =>
    PARTIES[p].contestsRegions.includes(region) && !wrongPopulists.includes(p)
  );
}

function generateName(rng: Rng, region: RegionId, used: Set<string>): string {
  const pool = CONSTITUENCY_POOLS[region];
  for (let attempt = 0; attempt < 60; attempt++) {
    const stem = rng.pick(pool.stems);
    let name = stem;
    const roll = rng.next();
    if (roll < 0.45) {
      name = `${stem} ${rng.pick(pool.suffixes)}`;
    } else if (roll < 0.55) {
      const other = rng.pick(pool.stems);
      if (other !== stem) name = `${stem} and ${other}`;
    }
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  // ultra-rare fallback: numbered to stay unique
  const fallback = `${rng.pick(pool.stems)} ${used.size}`;
  used.add(fallback);
  return fallback;
}

/** winner-margin distribution: many safe seats, a tail of real marginals */
function sampleMargin(rng: Rng): number {
  return 0.01 + Math.pow(rng.next(), 1.6) * 0.32;
}

/** regional political climate: blend of seat composition and a floor so
 *  small parties still poll a few percent everywhere they stand */
function regionalClimate(
  region: RegionId,
  regionSeats: Partial<Record<PartyId, number>>,
  era: Era
): Partial<Record<PartyId, number>> {
  const parties = contestants(region, era);
  const totalSeats = Object.values(regionSeats).reduce((a, b) => a + (b ?? 0), 0) || 1;
  const climate: Partial<Record<PartyId, number>> = {};
  let sum = 0;
  for (const p of parties) {
    const seatShare = (regionSeats[p] ?? 0) / totalSeats;
    const v = 0.6 * seatShare + 0.04; // floor keeps minor parties on the board
    climate[p] = v;
    sum += v;
  }
  for (const p of parties) climate[p] = (climate[p] ?? 0) / sum;
  return climate;
}

function buildSeatShares(
  rng: Rng,
  winner: PartyId,
  region: RegionId,
  climate: Partial<Record<PartyId, number>>,
  era: Era
): Partial<Record<PartyId, number>> {
  // Speaker / independent seats: conventionally odd ballots, kept simple
  if (winner === 'spk') return { spk: 0.72, ind: 0.28 };

  const parties = contestants(region, era).filter((p) => p !== winner && p !== 'spk');
  const margin = sampleMargin(rng);

  // winner share scaled by how dominant their party is locally
  const base = 0.34 + 0.5 * (climate[winner] ?? 0.08);
  const winnerShare = Math.min(0.72, Math.max(0.3, base + rng.normal(0, 0.04)));
  const runnerUpShare = Math.max(0.05, winnerShare - margin);

  // strongest non-winner locally is the runner-up
  const ranked = [...parties].sort((a, b) => (climate[b] ?? 0) - (climate[a] ?? 0));
  const runnerUp = ranked[0] ?? 'ind';

  const shares: Partial<Record<PartyId, number>> = {
    [winner]: winnerShare,
    [runnerUp]: runnerUpShare,
  };
  const rest = ranked.slice(1);
  const restTotal = Math.max(0, 1 - winnerShare - runnerUpShare);
  const restClimateSum = rest.reduce((a, p) => a + (climate[p] ?? 0.02), 0) || 1;
  for (const p of rest) {
    shares[p] = restTotal * ((climate[p] ?? 0.02) / restClimateSum);
  }
  return shares;
}

export interface SeatMapResult {
  seatMap: SyntheticSeat[];
  playerSeatId: string;
}

/** Build the full 650-seat synthetic map. The player's seat is carved out in
 *  their chosen region: if their party holds seats there, one of those becomes
 *  the player's; otherwise the most winnable seat flips to them (a famous
 *  upset — national totals shift by one). */
export function generateSeatMap(
  rng: Rng,
  matrix: SeatMatrix,
  playerParty: PartyId,
  playerRegion: RegionId,
  era: Era
): SeatMapResult {
  const usedNames = new Set<string>();
  const seatMap: SyntheticSeat[] = [];
  let counter = 0;

  for (const [regionKey, regionSeats] of Object.entries(matrix)) {
    const region = regionKey as RegionId;
    const climate = regionalClimate(region, regionSeats, era);
    for (const [partyKey, count] of Object.entries(regionSeats)) {
      const winner = partyKey as PartyId;
      for (let i = 0; i < (count ?? 0); i++) {
        seatMap.push({
          id: `seat_${counter++}`,
          name: generateName(rng, region, usedNames),
          region,
          winner,
          shares: buildSeatShares(rng, winner, region, climate, era),
        });
      }
    }
  }

  // pick the player's seat
  const inRegion = seatMap.filter((s) => s.region === playerRegion && s.winner !== 'spk');
  let playerSeat = rng.pick(
    inRegion.filter((s) => s.winner === playerParty).length > 0
      ? inRegion.filter((s) => s.winner === playerParty)
      : [...inRegion].sort(
          (a, b) => (b.shares[playerParty] ?? 0) - (a.shares[playerParty] ?? 0)
        ).slice(0, 3)
  );

  if (playerSeat.winner !== playerParty) {
    // shock win: rebuild the seat's shares with the player's party narrowly ahead
    const oldWinner = playerSeat.winner;
    const oldWinnerShare = playerSeat.shares[oldWinner] ?? 0.4;
    const margin = 0.01 + rng.next() * 0.04;
    playerSeat.shares[playerParty] = oldWinnerShare + margin / 2;
    playerSeat.shares[oldWinner] = oldWinnerShare - margin / 2;
    playerSeat.winner = playerParty;
  }
  playerSeat.isPlayerSeat = true;

  return { seatMap, playerSeatId: playerSeat.id };
}

export function countSeats(seatMap: SyntheticSeat[]): Partial<Record<PartyId, number>> {
  const seats: Partial<Record<PartyId, number>> = {};
  for (const seat of seatMap) {
    seats[seat.winner] = (seats[seat.winner] ?? 0) + 1;
  }
  return seats;
}
