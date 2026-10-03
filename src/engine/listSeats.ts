import { GameState, PartyId, SyntheticSeat } from '../types/game';
import { OFFICES } from '../data/offices';
import { Rng } from './rng';

/**
 * Proportional seat allocation — the half of a devolved election the Commons
 * engine has no notion of.
 *
 * Holyrood and the pre-2026 Senedd use the Additional Member System: FPTP
 * constituencies, then regional "top-up" lists allocated by d'Hondt with each
 * party's constituency seats already counted in its divisor, so a party that
 * sweeps the constituencies gets few or no list seats and a party that wins
 * none gets most of its representation here. The 2026 Senedd drops the
 * constituencies altogether and allocates six seats per constituency by the
 * same highest-averages method from a standing start.
 */

/** d'Hondt: hand out `seats` one at a time to the party with the highest
 *  vote / (seats already held + 1), starting from `initial` (constituency seats
 *  under AMS, zero under pure list PR). Returns the parties in allocation order. */
export function dHondt(
  votes: Partial<Record<PartyId, number>>,
  seats: number,
  initial: Partial<Record<PartyId, number>> = {}
): PartyId[] {
  const held: Partial<Record<PartyId, number>> = {};
  for (const [p, n] of Object.entries(initial)) held[p as PartyId] = n ?? 0;
  const order: PartyId[] = [];
  const parties = (Object.keys(votes) as PartyId[]).filter((p) => (votes[p] ?? 0) > 0);
  for (let i = 0; i < seats; i++) {
    let best: PartyId | null = null;
    let bestQ = -1;
    for (const p of parties) {
      const q = (votes[p] ?? 0) / ((held[p] ?? 0) + 1);
      // ties break toward the larger raw vote, then alphabetically for determinism
      if (q > bestQ + 1e-12 || (Math.abs(q - bestQ) <= 1e-12 && best !== null
        && ((votes[p] ?? 0) > (votes[best] ?? 0) || ((votes[p] ?? 0) === (votes[best] ?? 0) && p < best)))) {
        best = p;
        bestQ = q;
      }
    }
    if (!best) break;
    held[best] = (held[best] ?? 0) + 1;
    order.push(best);
  }
  return order;
}

/** the list seats of one region, in allocation order */
export function listSeatsOf(seatMap: SyntheticSeat[], listRegion: string): SyntheticSeat[] {
  return seatMap
    .filter((s) => s.kind === 'list' && s.listRegion === listRegion)
    .sort((a, b) => (a.listRank ?? 0) - (b.listRank ?? 0));
}

/** the constituency seats of one region */
export function constituencySeatsOf(seatMap: SyntheticSeat[], listRegion: string): SyntheticSeat[] {
  return seatMap.filter((s) => s.kind !== 'list' && s.listRegion === listRegion);
}

/** the region's current list-vote shares, kept duplicated on each of its list
 *  seats so the swing has a baseline to work from */
export function regionListShares(
  seatMap: SyntheticSeat[], listRegion: string, baseline = false
): Partial<Record<PartyId, number>> {
  const first = listSeatsOf(seatMap, listRegion)[0];
  if (!first) return {};
  return { ...((baseline ? first.base : undefined) ?? first.shares) };
}

/** Where the party puts the player on its list. A leader heads it; a Cabinet
 *  Secretary is near the top; a well-regarded backbencher sits a place or two
 *  down; a rebel with a poor standing is further down than the party will ever
 *  win. Clamped to the list length a party could plausibly win from. */
export function playerListRank(state: GameState): number {
  const office = state.player.officeId ? OFFICES[state.player.officeId] : undefined;
  const s = state.player.stats;
  let rank: number;
  if (office && office.tier >= 4) rank = 1;
  else if (office?.tier === 3) rank = 2;
  else {
    rank = s.partyStanding >= 65 ? 2 : s.partyStanding >= 45 ? 3 : 4;
    if (s.constituencyApproval >= 70) rank -= 1;
    if (s.constituencyApproval <= 35) rank += 1;
    if (state.player.rebellionCount >= 3) rank += 1;
  }
  // a sitting list member is an incumbent: the party ranks its incumbents ahead
  // of its hopefuls, so they are never placed below the number of list seats the
  // party already holds in that region — a Green holding the region's one Green
  // seat heads the Green list there
  const seat = state.seatMap.find((x) => x.id === state.player.seatId);
  if (seat?.kind === 'list' && seat.listRegion && state.player.hasSeat) {
    const held = state.seatMap.filter(
      (x) => x.kind === 'list' && x.listRegion === seat.listRegion && x.winner === state.player.partyId
    ).length;
    if (held > 0) rank = Math.min(rank, held);
  }
  return Math.max(1, Math.min(6, rank));
}

/** Apply the national swing to a region's list vote. Same shape as the
 *  constituency swing (absolute delta from the chamber's anchor) with a little
 *  regional noise; list-only parties move with their polled share directly. */
export function swungListShares(
  base: Partial<Record<PartyId, number>>,
  national: Partial<Record<PartyId, number>>,
  anchor: Partial<Record<PartyId, number>>,
  polled: PartyId[],
  rng: Rng,
  noise = 0.01
): Partial<Record<PartyId, number>> {
  const out: Partial<Record<PartyId, number>> = {};
  const parties = new Set<PartyId>([...(Object.keys(base) as PartyId[]), ...polled]);
  let total = 0;
  for (const p of parties) {
    let v = base[p] ?? 0;
    if (polled.includes(p)) {
      v += (national[p] ?? 0) - (anchor[p] ?? 0);
    } else if (p === 'ind') {
      v -= 0.01;
    }
    v += rng.normal(0, noise);
    v = Math.max(0, v);
    out[p] = v;
    total += v;
  }
  if (total > 0) for (const p of parties) out[p] = (out[p] ?? 0) / total;
  return out;
}

/** Allocate a region's list seats for THIS election and write the winners onto
 *  its list-seat records in rank order. Returns the allocation order. */
export function allocateRegionList(
  seatMap: SyntheticSeat[],
  listRegion: string,
  listShares: Partial<Record<PartyId, number>>,
  constituencyWon: Partial<Record<PartyId, number>>
): PartyId[] {
  const seats = listSeatsOf(seatMap, listRegion);
  const order = dHondt(listShares, seats.length, constituencyWon);
  seats.forEach((seat, i) => {
    seat.winner = order[i] ?? seat.winner;
    seat.shares = { ...listShares };
  });
  return order;
}

/** the index (0-based) of the party's `rank`-th seat in an allocation order, or -1 */
export function nthSeatIndex(order: PartyId[], party: PartyId, rank: number): number {
  let seen = 0;
  for (let i = 0; i < order.length; i++) {
    if (order[i] === party && ++seen === rank) return i;
  }
  return -1;
}

/** count a party's constituency wins by region from the freshly-counted map */
export function constituencyWinsByRegion(
  seatMap: SyntheticSeat[]
): Record<string, Partial<Record<PartyId, number>>> {
  const out: Record<string, Partial<Record<PartyId, number>>> = {};
  for (const s of seatMap) {
    if (s.kind === 'list' || !s.listRegion) continue;
    const row = (out[s.listRegion] ??= {});
    row[s.winner] = (row[s.winner] ?? 0) + 1;
  }
  return out;
}
