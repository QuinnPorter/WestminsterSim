import {
  ArenaId, DevolvedArenaId, Era, PartyId, RegionId, SyntheticSeat,
} from '../types/game';
import { PARTIES, populistPartyForEra } from '../data/parties';
import { SeatMatrix } from '../data/parliaments';
import { CONSTITUENCY_POOLS } from '../data/constituencyNames';
import { ListRegion } from '../data/chambers';
import { LIST_RATIO, LegislatureSnapshot } from '../data/devolved';
import {
  HOLYROOD_CONSTITUENCIES, SENEDD_2026_FROM_REGION, SENEDD_CONSTITUENCIES,
} from '../data/devolvedSeats';
import { Rng } from '../engine/rng';
import { dHondt, listSeatsOf } from '../engine/listSeats';

/** The parties on a ballot in this seat. `ballot`, when given, is the list of
 *  parties that actually contested THIS parliament. Without it, the chamber's
 *  roster filtered by region: only the era's right-populist party (UKIP / Brexit /
 *  Reform) ever contests, never the others, and a devolved-only party (the
 *  Scottish Greens, Alba) never stands for Westminster. */
function contestants(
  region: RegionId, era: Era, arena: ArenaId = 'uk', ballot?: PartyId[]
): PartyId[] {
  const populist = populistPartyForEra(era);
  const wrongPopulists = (['ukip', 'brexit', 'reform'] as PartyId[]).filter((p) => p !== populist);
  if (ballot) {
    return ballot.filter((p) => PARTIES[p]?.contestsRegions.includes(region));
  }
  return (Object.keys(PARTIES) as PartyId[]).filter((p) =>
    PARTIES[p].contestsRegions.includes(region)
    && !wrongPopulists.includes(p)
    && (arena !== 'uk' || !PARTIES[p].devolvedOnly)
  );
}

function generateName(
  rng: Rng, region: RegionId, used: Set<string>, override?: string[]
): string {
  if (override) {
    // a real list of constituencies: take an unused one
    for (let attempt = 0; attempt < 80; attempt++) {
      const name = rng.pick(override);
      if (!used.has(name)) {
        used.add(name);
        return name;
      }
    }
    const free = override.find((n) => !used.has(n));
    if (free) {
      used.add(free);
      return free;
    }
    const fallback = `${rng.pick(override)} ${used.size}`;
    used.add(fallback);
    return fallback;
  }
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
  era: Era,
  arena: ArenaId = 'uk',
  ballot?: PartyId[],
  voteShares?: Partial<Record<PartyId, number>>
): Partial<Record<PartyId, number>> {
  const parties = contestants(region, era, arena, ballot);
  const totalSeats = Object.values(regionSeats).reduce((a, b) => a + (b ?? 0), 0) || 1;
  // When the parliament's real vote shares are known, blend them with the
  // region's seat composition: seat share is a terrible proxy for vote share
  // under first-past-the-post, but a region that returns nine SNP members out
  // of nine is still a more SNP place than one that returns six.
  if (voteShares) {
    const out: Partial<Record<PartyId, number>> = {};
    let sum = 0;
    for (const p of parties) {
      const seatShare = (regionSeats[p] ?? 0) / totalSeats;
      const v = Math.max(0.005, 0.7 * (voteShares[p] ?? 0.005) + 0.3 * (0.8 * seatShare + 0.02));
      out[p] = v;
      sum += v;
    }
    for (const p of parties) out[p] = (out[p] ?? 0) / sum;
    return out;
  }
  const climate: Partial<Record<PartyId, number>> = {};
  let sum = 0;
  for (const p of parties) {
    const seatShare = (regionSeats[p] ?? 0) / totalSeats;
    // weight seat-dominance more gently (was 0.6) so a party that holds most of a
    // region doesn't end up on ~60% in every seat there — keeps regional seats
    // competitive and their seat count prorated to support rather than a sweep
    const v = 0.42 * seatShare + 0.06; // floor keeps minor parties on the board
    climate[p] = v;
    sum += v;
  }
  for (const p of parties) climate[p] = (climate[p] ?? 0) / sum;
  return climate;
}

/** How far a seat tilts toward its winner, over and above the region's share. */
const LIFT_MIN = 0.04;
const LIFT_MAX = 0.28;
const WINNER_CAP = 0.70;

function buildSeatShares(
  rng: Rng,
  winner: PartyId,
  region: RegionId,
  climate: Partial<Record<PartyId, number>>,
  era: Era,
  arena: ArenaId = 'uk',
  ballot?: PartyId[],
  /** true when `climate` is anchored on the parliament's REAL vote shares */
  proportional = false
): Partial<Record<PartyId, number>> {
  // Speaker / independent seats: conventionally odd ballots, kept simple
  if (winner === 'spk') return { spk: 0.72, ind: 0.28 };

  const parties = contestants(region, era, arena, ballot).filter((p) => p !== winner && p !== 'spk');

  // The Commons keeps the original, calibrated distribution: its climate is
  // derived from seat counts, and the seat model — the swing amplifier, the
  // winner's bonus, the landslide guards — is tuned around exactly this shape.
  if (!proportional) return legacySeatShares(rng, winner, parties, climate);

  // A devolved seat is the region's politics tilted toward whoever actually won
  // it. Distributing the non-winning vote in proportion to the climate keeps the
  // map's aggregate close to the published result, which is what makes a later
  // swing behave sensibly.
  const lift = LIFT_MIN + Math.pow(rng.next(), 1.5) * (LIFT_MAX - LIFT_MIN);
  const winnerShare = Math.min(WINNER_CAP, Math.max(0.30, (climate[winner] ?? 0.08) + lift));
  const shares: Partial<Record<PartyId, number>> = { [winner]: winnerShare };
  const rest = 1 - winnerShare;
  const climateSum = parties.reduce((a, p) => a + (climate[p] ?? 0.01), 0) || 1;
  for (const p of parties) shares[p] = rest * ((climate[p] ?? 0.01) / climateSum);

  // the winner has to actually lead: a marginal, but a win
  const best = parties.reduce(
    (a, p) => ((shares[p] ?? 0) > (shares[a] ?? 0) ? p : a), parties[0] ?? winner
  );
  if (best !== winner && (shares[best] ?? 0) >= winnerShare) {
    const gap = (shares[best] ?? 0) - winnerShare + sampleMargin(rng) * 0.4;
    shares[winner] = winnerShare + gap;
    shares[best] = Math.max(0.02, (shares[best] ?? 0) - gap);
  }
  return shares;
}

/** The original per-seat distribution, used for the Commons. */
function legacySeatShares(
  rng: Rng,
  winner: PartyId,
  parties: PartyId[],
  climate: Partial<Record<PartyId, number>>
): Partial<Record<PartyId, number>> {
  const margin = sampleMargin(rng);

  // winner share scaled by how dominant their party is locally. A strict regional
  // party (SNP/PC) gets a touch more local-vote variance so its seats are genuinely
  // competitive (it can lose some), and a slightly lower ceiling than GB-wide winners.
  const regional = PARTIES[winner]?.contestsRegions.length < 3;
  const base = 0.32 + 0.46 * (climate[winner] ?? 0.08);
  const noiseSd = regional ? 0.06 : 0.04;
  const cap = regional ? 0.62 : 0.7;
  const winnerShare = Math.min(cap, Math.max(0.3, base + rng.normal(0, noiseSd)));
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
  /** the region the player's seat actually sits in — equals the chosen region
   *  unless a regional party (SNP/PC/…) was redirected to its real home nation */
  playerRegion: RegionId;
}

/** Build the full synthetic Commons map, one seat per seat in the era's House.
 *  The player's seat is carved out in their chosen region: if their party holds
 *  seats there, one of those becomes the player's; otherwise the most winnable
 *  seat flips to them (a famous upset — national totals shift by one). */
export function generateSeatMap(
  rng: Rng,
  matrix: SeatMatrix,
  playerParty: PartyId,
  playerRegion: RegionId,
  era: Era,
  opts: {
    arena?: ArenaId; namePool?: string[]; ballot?: PartyId[];
    /** the parliament's real vote shares, used as the per-seat climate */
    voteShares?: Partial<Record<PartyId, number>>;
  } = {}
): SeatMapResult {
  const arena = opts.arena ?? 'uk';
  const usedNames = new Set<string>();
  const seatMap: SyntheticSeat[] = [];
  let counter = 0;

  for (const [regionKey, regionSeats] of Object.entries(matrix)) {
    const region = regionKey as RegionId;
    const climate = regionalClimate(region, regionSeats, era, arena, opts.ballot, opts.voteShares);
    for (const [partyKey, count] of Object.entries(regionSeats)) {
      const winner = partyKey as PartyId;
      for (let i = 0; i < (count ?? 0); i++) {
        const shares = buildSeatShares(
          rng, winner, region, climate, era, arena, opts.ballot, !!opts.voteShares
        );
        seatMap.push({
          id: `seat_${counter++}`,
          name: generateName(rng, region, usedNames, opts.namePool),
          region,
          winner,
          shares,
          base: { ...shares }, // immutable swing baseline
        });
      }
    }
  }

  // A regional party only stands where it actually fights elections: the SNP in
  // Scotland, Plaid Cymru in Wales, the NI parties in Northern Ireland. If the
  // player picked an incompatible home region (e.g. an SNP candidate notionally
  // from Yorkshire), redirect their seat to a region the party realistically
  // contests, so we never produce an "SNP MP for Sheffield" / "Plaid MP for
  // Sheffield" mismatch. Britain-wide parties keep their chosen region untouched.
  const partyRegions = PARTIES[playerParty]?.contestsRegions ?? [];
  let effectiveRegion = playerRegion;
  if (partyRegions.length > 0 && !partyRegions.includes(playerRegion)) {
    // prefer a region where the party actually holds seats (most plausible home),
    // else any region it contests; pick deterministically via the seeded rng.
    const heldRegions = partyRegions.filter((r) =>
      seatMap.some((s) => s.region === r && s.winner === playerParty));
    const pickFrom = heldRegions.length > 0 ? heldRegions : partyRegions;
    effectiveRegion = rng.pick(pickFrom);
  }

  const playerSeatId = carveOutPlayerSeat(
    rng, seatMap.filter((s) => s.region === effectiveRegion && s.winner !== 'spk'), playerParty
  );
  return { seatMap, playerSeatId, playerRegion: effectiveRegion };
}

/** pick the player's seat from `candidates`: one their party holds, else the most
 *  winnable flipped to them narrowly */
function carveOutPlayerSeat(rng: Rng, candidates: SyntheticSeat[], playerParty: PartyId): string {
  const held = candidates.filter((s) => s.winner === playerParty);
  const playerSeat = rng.pick(
    held.length > 0
      ? held
      : [...candidates].sort(
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
    playerSeat.base = { ...playerSeat.shares }; // keep the baseline in sync with the upset
  }
  playerSeat.isPlayerSeat = true;
  return playerSeat.id;
}

/** Rescale a finished set of constituency seats so the vote it implies matches
 *  the vote actually cast. A few passes, because renormalising each seat perturbs
 *  the aggregate again; the winner of each seat is pinned so the calibration can
 *  never flip a result the real election decided. */
export function calibrateToVoteShares(
  seatMap: SyntheticSeat[],
  target: Partial<Record<PartyId, number>>,
  parties: PartyId[]
): void {
  if (seatMap.length === 0) return;
  const total = parties.reduce((a, p) => a + (target[p] ?? 0), 0) || 1;

  for (let pass = 0; pass < 4; pass++) {
    const implied: Partial<Record<PartyId, number>> = {};
    for (const seat of seatMap) {
      for (const p of parties) implied[p] = (implied[p] ?? 0) + (seat.shares[p] ?? 0);
    }
    for (const seat of seatMap) {
      for (const p of parties) {
        const want = (target[p] ?? 0) / total;
        const have = (implied[p] ?? 0) / seatMap.length;
        if (have <= 0 || want <= 0) continue;
        seat.shares[p] = (seat.shares[p] ?? 0) * (want / have);
      }
      // back to a valid ballot, with the real winner still ahead
      let sum = 0;
      for (const v of Object.values(seat.shares)) sum += v ?? 0;
      if (sum <= 0) continue;
      for (const p of Object.keys(seat.shares) as PartyId[]) {
        seat.shares[p] = (seat.shares[p] ?? 0) / sum;
      }
      const best = (Object.keys(seat.shares) as PartyId[])
        .reduce((a, p) => ((seat.shares[p] ?? 0) > (seat.shares[a] ?? 0) ? p : a), seat.winner);
      if (best !== seat.winner) {
        const swap = seat.shares[best] ?? 0;
        seat.shares[best] = seat.shares[seat.winner] ?? 0;
        seat.shares[seat.winner] = swap;
      }
    }
  }
  for (const seat of seatMap) seat.base = { ...seat.shares };
}

export function countSeats(seatMap: SyntheticSeat[]): Partial<Record<PartyId, number>> {
  const seats: Partial<Record<PartyId, number>> = {};
  for (const seat of seatMap) {
    seats[seat.winner] = (seats[seat.winner] ?? 0) + 1;
  }
  return seats;
}

// ---------------------------------------------------------------------------
// devolved chambers: the Additional Member System
// ---------------------------------------------------------------------------

/** the constituency names of a list region */
function regionNamePool(arena: DevolvedArenaId, regionId: string): string[] {
  return (arena === 'scotland' ? HOLYROOD_CONSTITUENCIES : SENEDD_CONSTITUENCIES)[regionId] ?? [];
}

/** rescale a set of shares so the modelled parties sum to exactly 1 */
export function normalisedShares(
  raw: Partial<Record<PartyId, number>>, parties: PartyId[]
): Partial<Record<PartyId, number>> {
  let total = 0;
  for (const p of parties) total += raw[p] ?? 0;
  if (total <= 0) return { ...raw };
  const out: Partial<Record<PartyId, number>> = {};
  for (const p of parties) out[p] = (raw[p] ?? 0) / total;
  return out;
}

/** Build a Holyrood or (pre-2026) Senedd map as it stood after a real election:
 *  every constituency seat from the per-region matrices, calibrated to the real
 *  constituency vote; then the regional lists, with each region's list vote
 *  derived from its constituency vote and the per-party list ratio, calibrated so
 *  the national list totals come out as they really did. */
export function generateDevolvedSeatMap(
  rng: Rng,
  arena: DevolvedArenaId,
  snap: LegislatureSnapshot,
  regions: ListRegion[],
  playerParty: PartyId,
  era: Era
): SeatMapResult {
  const region: RegionId = arena;
  const ballot = snap.parties;
  const usedNames = new Set<string>();
  const seatMap: SyntheticSeat[] = [];
  let counter = 0;
  const constShares = normalisedShares(snap.constituencyShares, ballot);

  for (const lr of regions) {
    const row = snap.constituencySeats[lr.id] ?? {};
    const climate = regionalClimate(region, row, era, arena, ballot, constShares);
    const pool = regionNamePool(arena, lr.id);
    for (const [partyKey, count] of Object.entries(row)) {
      const winner = partyKey as PartyId;
      for (let i = 0; i < (count ?? 0); i++) {
        const shares = buildSeatShares(rng, winner, region, climate, era, arena, ballot, true);
        seatMap.push({
          id: `seat_${arena}_${counter++}`,
          name: generateName(rng, region, usedNames, pool),
          region,
          winner,
          shares,
          base: { ...shares },
          kind: 'constituency',
          listRegion: lr.id,
        });
      }
    }
  }
  // the whole constituency map lands on the real constituency vote
  calibrateToVoteShares(seatMap, constShares, contestants(region, era, arena, ballot));

  // the regional lists
  const listVotes: Record<string, Partial<Record<PartyId, number>>> = {};
  const ratio = LIST_RATIO[arena];
  for (const lr of regions) {
    const inRegion = seatMap.filter((s) => s.listRegion === lr.id);
    const mean: Partial<Record<PartyId, number>> = {};
    for (const p of ballot) {
      let sum = 0;
      for (const s of inRegion) sum += s.shares[p] ?? 0;
      mean[p] = inRegion.length > 0 ? sum / inRegion.length : (snap.shares[p] ?? 0);
    }
    const votes: Partial<Record<PartyId, number>> = {};
    for (const p of ballot) votes[p] = Math.max(0.002, (mean[p] ?? 0) * (ratio[p] ?? 1));
    listVotes[lr.id] = votes;
    for (let k = 1; k <= lr.listSeats; k++) {
      seatMap.push({
        id: `seat_${arena}_${counter++}`,
        name: `${lr.name} (regional list)`,
        region,
        winner: ballot[0],
        shares: {},
        kind: 'list',
        listRegion: lr.id,
        listRank: k,
      });
    }
  }
  calibrateListAllocation(seatMap, regions, listVotes, snap.listSeats, ballot);

  const playerSeatId = pickDevolvedPlayerSeat(rng, seatMap, playerParty, 2);
  return { seatMap, playerSeatId, playerRegion: region };
}

/** Nudge each party's list vote up or down across every region until the
 *  d'Hondt allocation reproduces the real national list totals, then write the
 *  final regional list shares onto the list seats as their baseline. */
function calibrateListAllocation(
  seatMap: SyntheticSeat[],
  regions: ListRegion[],
  listVotes: Record<string, Partial<Record<PartyId, number>>>,
  target: Partial<Record<PartyId, number>>,
  ballot: PartyId[]
): void {
  const constWon = (regionId: string): Partial<Record<PartyId, number>> => {
    const won: Partial<Record<PartyId, number>> = {};
    for (const s of seatMap) {
      if (s.kind !== 'list' && s.listRegion === regionId) won[s.winner] = (won[s.winner] ?? 0) + 1;
    }
    return won;
  };
  const allocateAll = (): Partial<Record<PartyId, number>> => {
    const totals: Partial<Record<PartyId, number>> = {};
    for (const lr of regions) {
      const order = dHondt(listVotes[lr.id], lr.listSeats, constWon(lr.id));
      listSeatsOf(seatMap, lr.id).forEach((seat, i) => {
        seat.winner = order[i] ?? seat.winner;
      });
      for (const p of order) totals[p] = (totals[p] ?? 0) + 1;
    }
    return totals;
  };
  // independents on a list (Margo MacDonald) are not modelled as a party; their
  // seat goes to whoever is next, which keeps the House the right size
  const wanted: Partial<Record<PartyId, number>> = {};
  for (const p of ballot) wanted[p] = target[p] ?? 0;
  const spare = Object.entries(target).filter(([p]) => !ballot.includes(p as PartyId))
    .reduce((a, [, n]) => a + (n ?? 0), 0);
  if (spare > 0) {
    const biggest = ballot.reduce((a, p) => ((wanted[p] ?? 0) > (wanted[a] ?? 0) ? p : a), ballot[0]);
    wanted[biggest] = (wanted[biggest] ?? 0) + spare;
  }

  // multiplicative search with a shrinking step, keeping the closest configuration
  // seen: two parties fighting over the same marginal list seat can otherwise
  // trade it back and forth for ever at a fixed step
  let best: Record<string, Partial<Record<PartyId, number>>> | null = null;
  let bestOff = Number.MAX_SAFE_INTEGER;
  for (let pass = 0; pass < 400; pass++) {
    const got = allocateAll();
    let off = 0;
    for (const p of ballot) off += Math.abs((wanted[p] ?? 0) - (got[p] ?? 0));
    if (off < bestOff) {
      bestOff = off;
      best = Object.fromEntries(Object.entries(listVotes).map(([k, v]) => [k, { ...v }]));
    }
    if (off === 0) break;
    const step = 0.06 * Math.pow(0.992, pass) + 0.004;
    for (const p of ballot) {
      const diff = (wanted[p] ?? 0) - (got[p] ?? 0);
      if (diff === 0) continue;
      const factor = diff > 0 ? 1 + step : 1 - step;
      for (const lr of regions) {
        listVotes[lr.id][p] = Math.max(0.001, (listVotes[lr.id][p] ?? 0.001) * factor);
      }
    }
  }
  if (best) for (const lr of regions) listVotes[lr.id] = best[lr.id];
  // Exact repair. A uniform per-party multiplier cannot always land every total
  // — the seat a party is over by may sit in a region where the party under
  // would need a different step than everywhere else. Move single seats: for
  // the over-party's cheapest seat, lift the under-party's vote in just that
  // region by exactly enough to take it.
  for (let guard = 0; guard < 60; guard++) {
    const got = allocateAll();
    const over = ballot.find((p) => (got[p] ?? 0) > (wanted[p] ?? 0));
    const under = ballot.find((p) => (got[p] ?? 0) < (wanted[p] ?? 0));
    if (!over || !under) break;
    let bestRegion: string | null = null;
    let bestFactor = Number.MAX_VALUE;
    for (const lr of regions) {
      const won = constWon(lr.id);
      const order = dHondt(listVotes[lr.id], lr.listSeats, won);
      const overList = order.filter((p) => p === over).length;
      if (overList === 0) continue;
      const overHeld = (won[over] ?? 0) + overList;
      const underHeld = (won[under] ?? 0) + order.filter((p) => p === under).length;
      const overLast = (listVotes[lr.id][over] ?? 0) / overHeld;
      const underNext = (listVotes[lr.id][under] ?? 0.001) / (underHeld + 1);
      const factor = (overLast / underNext) * 1.001;
      if (factor < bestFactor) { bestFactor = factor; bestRegion = lr.id; }
    }
    if (!bestRegion) break;
    listVotes[bestRegion][under] = (listVotes[bestRegion][under] ?? 0.001) * bestFactor;
  }
  allocateAll();
  for (const lr of regions) {
    const shares = normalisedShares(listVotes[lr.id], ballot);
    for (const seat of listSeatsOf(seatMap, lr.id)) {
      seat.shares = { ...shares };
      seat.base = { ...shares };
    }
  }
}

/** The player's seat in a devolved chamber: a constituency their party holds;
 *  failing that a list seat their party holds (the Scottish Greens have never won
 *  a constituency — their members ARE list members); failing that the most
 *  winnable constituency, flipped. `rank` is where the party would place them
 *  on a list. */
export function pickDevolvedPlayerSeat(
  rng: Rng, seatMap: SyntheticSeat[], party: PartyId, rank: number
): string {
  for (const s of seatMap) delete s.isPlayerSeat;
  const constituencies = seatMap.filter((s) => s.kind !== 'list');
  const held = constituencies.filter((s) => s.winner === party);
  if (held.length > 0) return carveOutPlayerSeat(rng, held, party);

  const listHeld = seatMap.filter((s) => s.kind === 'list' && s.winner === party);
  if (listHeld.length > 0) {
    // the party's rank-th list seat in the region where it did best, else any
    const byRegion = new Map<string, SyntheticSeat[]>();
    for (const s of listHeld) {
      const arr = byRegion.get(s.listRegion ?? '') ?? [];
      arr.push(s);
      byRegion.set(s.listRegion ?? '', arr);
    }
    const regionsRanked = [...byRegion.values()].sort((a, b) => b.length - a.length);
    const best = regionsRanked[0].sort((a, b) => (a.listRank ?? 0) - (b.listRank ?? 0));
    const seat = best[Math.min(best.length - 1, Math.max(0, rank - 1))];
    seat.isPlayerSeat = true;
    return seat.id;
  }
  if (constituencies.length > 0) return carveOutPlayerSeat(rng, constituencies, party);
  // a pure list-PR chamber with no seat of the party's at all: take the first
  // seat of the district where it runs strongest and flip it
  const district = [...seatMap].sort((a, b) => (b.shares[party] ?? 0) - (a.shares[party] ?? 0))[0];
  district.winner = party;
  district.isPlayerSeat = true;
  return district.id;
}

// ---------------------------------------------------------------------------
// the 2026 Senedd: closed-list PR in sixteen six-member constituencies
// ---------------------------------------------------------------------------

/** Rebuild a Senedd map for the expanded chamber. Each new constituency inherits
 *  the politics of the old region most of its voters came from, so the valleys
 *  stay Labour and Gwynedd stays Plaid. Returns the new map and the id of the
 *  seat the player now stands for (their party's `rank`-th seat in a home
 *  constituency drawn from their old region). */
export function rebuildForListPr(
  rng: Rng,
  oldMap: SyntheticSeat[],
  districts: { id: string; name: string }[],
  seatsPer: number,
  playerSeatId: string,
  playerParty: PartyId,
  rank: number,
  polled: PartyId[]
): { seatMap: SyntheticSeat[]; playerSeatId: string } {
  const region: RegionId = 'wales';
  const oldPlayerSeat = oldMap.find((s) => s.id === playerSeatId);
  // district -> old region
  const parentOf: Record<string, string> = {};
  for (const [oldRegion, ids] of Object.entries(SENEDD_2026_FROM_REGION)) {
    for (const id of ids) parentOf[id] = oldRegion;
  }
  const regionMean = (oldRegion: string): Partial<Record<PartyId, number>> => {
    const seats = oldMap.filter((s) => s.listRegion === oldRegion);
    const pool = seats.length > 0 ? seats : oldMap;
    const out: Partial<Record<PartyId, number>> = {};
    for (const p of polled) {
      let sum = 0;
      for (const s of pool) sum += s.shares[p] ?? 0;
      out[p] = pool.length > 0 ? sum / pool.length : 0;
    }
    return out;
  };

  const seatMap: SyntheticSeat[] = [];
  let counter = 0;
  for (const d of districts) {
    const mean = regionMean(parentOf[d.id] ?? '');
    const raw: Partial<Record<PartyId, number>> = {};
    for (const p of polled) raw[p] = Math.max(0.005, (mean[p] ?? 0.01) * (1 + rng.normal(0, 0.12)));
    const shares = normalisedShares(raw, polled);
    const order = dHondt(shares, seatsPer);
    for (let k = 1; k <= seatsPer; k++) {
      seatMap.push({
        id: `seat_wales96_${counter++}`,
        name: d.name,
        region,
        winner: order[k - 1] ?? polled[0],
        shares: { ...shares },
        base: { ...shares },
        kind: 'list',
        listRegion: d.id,
        listRank: k,
      });
    }
  }

  // the player's home: a district from their old region, where their party is strongest
  const homeRegion = oldPlayerSeat?.listRegion ?? '';
  const homeIds = SENEDD_2026_FROM_REGION[homeRegion] ?? districts.map((d) => d.id);
  const home = homeIds
    .map((id) => ({ id, share: seatMap.find((s) => s.listRegion === id)?.shares[playerParty] ?? 0 }))
    .sort((a, b) => b.share - a.share)[0].id;
  const homeSeats = listSeatsOf(seatMap, home);
  const order = homeSeats.map((s) => s.winner);
  // make sure the party holds at least `rank` seats here, so the player has one
  let have = order.filter((p) => p === playerParty).length;
  for (let i = homeSeats.length - 1; i >= 0 && have < rank; i--) {
    if (homeSeats[i].winner !== playerParty) {
      homeSeats[i].winner = playerParty;
      have++;
    }
  }
  let seen = 0;
  let chosen = homeSeats[0];
  for (const s of homeSeats) {
    if (s.winner === playerParty && ++seen === rank) { chosen = s; break; }
  }
  chosen.isPlayerSeat = true;
  return { seatMap, playerSeatId: chosen.id };
}
