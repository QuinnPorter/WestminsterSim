import { ArenaId, PartyId } from '../types/game';
import { abstainsIn } from '../data/parties';

/** total seats in the House the standings describe. The Commons is 650, Holyrood
 *  129, the Senedd 60 and then 96 — so it is counted rather than fixed. */
export function totalSeats(seats: Partial<Record<PartyId, number>>): number {
  let total = 0;
  for (const n of Object.values(seats)) total += n ?? 0;
  return total;
}

/** Seats that count toward a working majority in a chamber: every seat but the
 *  Speaker's and those of a party that does not take its seats there (Sinn
 *  Féin at Westminster, nobody in a devolved chamber). The Westminster matrices
 *  carve the Speaker's seat out as `spk`; the devolved chambers do not, because
 *  a Presiding Officer is simply drawn from a party after the fact. */
export function votingSeatsIn(
  seats: Partial<Record<PartyId, number>>, arena: ArenaId | undefined
): number {
  let total = 0;
  for (const [p, n] of Object.entries(seats) as [PartyId, number | undefined][]) {
    if (p === 'spk' || abstainsIn(p, arena)) continue;
    total += n ?? 0;
  }
  return total;
}

/** the number of seats a party needs to command the chamber on its own */
export function seatsForMajorityIn(
  seats: Partial<Record<PartyId, number>>, arena: ArenaId | undefined
): number {
  return Math.floor(votingSeatsIn(seats, arena) / 2) + 1;
}

/** a party's working majority in a chamber (negative when short) */
export function workingMajorityIn(
  seats: Partial<Record<PartyId, number>>, party: PartyId, arena: ArenaId | undefined
): number {
  const own = seats[party] ?? 0;
  return own - (votingSeatsIn(seats, arena) - own);
}
