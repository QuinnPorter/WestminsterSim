import {
  CandidateResult, ConstituencyResult, ElectionOutcome, ElectionResult, GameState, PartyId,
  SyntheticSeat,
} from '../types/game';
import { PARTIES, POLLED_PARTIES, polledPartiesForEra } from '../data/parties';
import { REGIONS } from '../data/regions';
import { generateName } from '../generation/characters';
import { lastElectionShares } from './polling';
import { Rng } from './rng';

const PER_SEAT_NOISE = 0.015;
/** election-day campaign wobble (sd) — the only gap between polling and result */
const CAMPAIGN_NOISE = 0.012;

/** compute this election's national GB vote shares — anchored to CURRENT POLLING
 *  (not to the last election), so the ballot box reflects the polls within a few
 *  points of campaign noise. The seat-level uniform swing in computeSeat then
 *  translates these into seats. */
export function electionNationalShares(
  state: GameState,
  rng: Rng
): Partial<Record<PartyId, number>> {
  const anchor = lastElectionShares(state);
  const polledParties = polledPartiesForEra(state.startEra);
  const out: Partial<Record<PartyId, number>> = {};
  let total = 0;
  for (const p of polledParties) {
    const polled = state.polling.shares[p] ?? anchor[p] ?? 0.01;
    const v = Math.max(0.003, polled + rng.normal(0, CAMPAIGN_NOISE));
    out[p] = v;
    total += v;
  }
  // incumbent fatigue: a slight boost for a first re-election, then a growing
  // anti-incumbency penalty from the third term on (the public tires of them)
  const gov = state.government.governingParty;
  const terms = state.government.termsInPower ?? 1;
  const fatigue = terms <= 1 ? 0.005
    : terms === 2 ? 0
      : -Math.min(0.09, (terms - 2) * 0.020);
  if (out[gov] !== undefined && fatigue !== 0) {
    total += -(out[gov] ?? 0);
    out[gov] = Math.max(0.003, (out[gov] ?? 0) + fatigue);
    total += out[gov] ?? 0;
  }
  for (const p of polledParties) out[p] = (out[p] ?? 0) / total;
  return out;
}

interface SeatOutcome {
  shares: Partial<Record<PartyId, number>>;
  winner: PartyId;
}

function computeSeat(
  seat: SyntheticSeat,
  national: Partial<Record<PartyId, number>>,
  anchor: Partial<Record<PartyId, number>>,
  rng: Rng,
  playerBoost: { party: PartyId; pts: number } | null
): SeatOutcome {
  // the Speaker is conventionally unopposed
  if (seat.winner === 'spk' && !playerBoost) {
    return { shares: { ...seat.shares }, winner: 'spk' };
  }

  const sens = REGIONS[seat.region].swingSensitivity;
  const shares: Partial<Record<PartyId, number>> = {};
  for (const [partyKey, base] of Object.entries(seat.shares)) {
    const p = partyKey as PartyId;
    let v = base ?? 0;
    if (POLLED_PARTIES.includes(p)) {
      const swing = ((national[p] ?? 0) - (anchor[p] ?? 0)) * sens;
      v += swing;
    } else if (p === 'ind') {
      v -= 0.02; // independents' personal vote fades
    }
    v += rng.normal(0, PER_SEAT_NOISE);
    shares[p] = Math.max(0, v);
  }

  if (playerBoost) {
    shares[playerBoost.party] = Math.max(0, (shares[playerBoost.party] ?? 0.05) + playerBoost.pts);
  }

  // renormalise so the result reads as real vote shares
  let total = 0;
  for (const v of Object.values(shares)) total += v ?? 0;
  if (total > 0) {
    for (const k of Object.keys(shares)) {
      shares[k as PartyId] = (shares[k as PartyId] ?? 0) / total;
    }
  }

  let winner: PartyId = seat.winner;
  let best = -1;
  for (const [p, v] of Object.entries(shares)) {
    if ((v ?? 0) > best) {
      best = v ?? 0;
      winner = p as PartyId;
    }
  }
  return { shares, winner };
}

function buildConstituencyResult(
  state: GameState,
  seat: SyntheticSeat,
  outcome: SeatOutcome,
  previousPlayerShare: number,
  rng: Rng
): ConstituencyResult {
  const turnout = 0.55 + rng.next() * 0.16;
  const totalVotes = Math.round((42000 + rng.next() * 18000) * turnout);
  const usedNames = new Set<string>();

  const entries = Object.entries(outcome.shares)
    .filter(([, v]) => (v ?? 0) > 0.005)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 6);

  const candidates: CandidateResult[] = entries.map(([partyKey, share]) => {
    const p = partyKey as PartyId;
    const isPlayer = p === state.player.partyId;
    return {
      name: isPlayer
        ? state.player.name
        : generateName(rng, rng.chance(0.5) ? 'm' : 'f', usedNames, seat.region),
      partyId: p,
      share: share ?? 0,
      votes: Math.round((share ?? 0) * totalVotes),
    };
  });

  const playerShare = outcome.shares[state.player.partyId] ?? 0;
  const majorityVotes =
    candidates.length >= 2 ? candidates[0].votes - candidates[1].votes : candidates[0]?.votes ?? 0;

  return {
    seatId: seat.id,
    seatName: seat.name,
    candidates,
    winnerPartyId: outcome.winner,
    playerStood: true,
    swing: (playerShare - previousPlayerShare) * 100,
    turnout,
    majorityVotes,
  };
}

export interface RunElectionOutput {
  result: ElectionResult;
  playerWonSeat: boolean;
}

/** Run a general election: swing every synthetic seat, build the result,
 *  and write the new shares/winners back into the seat map.
 *  Government formation and career fallout are handled by the caller. */
export function runElection(state: GameState, rng: Rng): RunElectionOutput {
  const anchor = lastElectionShares(state);
  const national = electionNationalShares(state, rng);
  const playerParty = state.player.partyId;

  const playerSeat = state.seatMap.find((s) => s.id === state.player.seatId)!;
  const approval = state.player.stats.constituencyApproval;
  const personalVote = ((approval - 50) / 50) * 0.06;
  // defectors face the voters without the comfort of incumbency — and a penalty
  const defected = state.player.flags.defected === 1;
  const incumbency = state.player.hasSeat && !defected ? 0.02 : 0;
  const defectionPenalty = defected ? -0.03 : 0;

  const seats: Partial<Record<PartyId, number>> = {};
  let playerResult: ConstituencyResult | null = null;
  let playerWonSeat = false;

  for (const seat of state.seatMap) {
    const isPlayerSeat = seat.id === playerSeat.id;
    const outcome = computeSeat(
      seat, national, anchor, rng,
      isPlayerSeat
        ? { party: playerParty, pts: personalVote + incumbency + defectionPenalty }
        : null
    );

    if (isPlayerSeat) {
      const prevShare = seat.shares[playerParty] ?? 0;
      playerResult = buildConstituencyResult(state, seat, outcome, prevShare, rng);
      playerWonSeat = outcome.winner === playerParty;
    }

    seat.shares = outcome.shares;
    seat.winner = outcome.winner;
    seats[outcome.winner] = (seats[outcome.winner] ?? 0) + 1;
  }

  // who forms the government
  const ranked = (Object.entries(seats) as [PartyId, number][])
    .filter(([p]) => PARTIES[p].major || (seats[p] ?? 0) > 80)
    .sort((a, b) => b[1] - a[1]);
  const governingParty = ranked[0]?.[0] ?? state.government.governingParty;
  const sfSeats = seats.sf ?? 0;
  const votingSeats = 650 - sfSeats - 1; // minus Speaker
  const govSeats = seats[governingParty] ?? 0;

  // classify by the gap to a working majority: a clear majority, a "hung"
  // parliament (close enough that a partner can form a working arrangement),
  // or a bare minority further out. Both sub-majority outcomes are unstable.
  const seatsForMajority = Math.floor(votingSeats / 2) + 1;
  const HUNG_BAND = 16;
  const outcome: ElectionOutcome =
    govSeats >= seatsForMajority ? 'majority'
      : govSeats >= seatsForMajority - HUNG_BAND ? 'hung'
        : 'minority';

  const result: ElectionResult = {
    id: `ge_${state.day}`,
    date: state.day,
    seats,
    voteShares: national,
    playerResult,
    outcome,
    governingParty,
    playerHeldSeat: playerWonSeat,
  };

  state.elections[result.id] = result;
  state.seats = seats;
  return { result, playerWonSeat };
}
