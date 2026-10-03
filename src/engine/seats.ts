import { PartyId } from '../types/game';

/** total seats in the House the standings describe. The Commons is 650, Holyrood
 *  129, the Senedd 60 and then 96 — so it is counted rather than fixed. */
export function totalSeats(seats: Partial<Record<PartyId, number>>): number {
  let total = 0;
  for (const n of Object.values(seats)) total += n ?? 0;
  return total;
}

/** Seats that count toward a working majority: every seat but the Speaker's and
 *  Sinn Féin's (who do not take theirs). The Westminster matrices carve the
 *  Speaker's seat out as `spk`; the devolved chambers do not, because a Presiding
 *  Officer is simply drawn from a party after the fact. */
export function votingSeats(seats: Partial<Record<PartyId, number>>): number {
  return totalSeats(seats) - (seats.spk ?? 0) - (seats.sf ?? 0);
}

/** the number of seats a party needs to command the House on its own */
export function seatsForMajority(seats: Partial<Record<PartyId, number>>): number {
  return Math.floor(votingSeats(seats) / 2) + 1;
}

/** a party's working majority (negative when short) */
export function workingMajority(seats: Partial<Record<PartyId, number>>, party: PartyId): number {
  const own = seats[party] ?? 0;
  return own - (votingSeats(seats) - own);
}
