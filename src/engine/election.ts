import {
  CandidateResult, ConstituencyResult, ElectionOutcome, ElectionResult, GameState, PartyId,
  SyntheticSeat,
} from '../types/game';
import { PARTIES, POLLED_PARTIES, polledPartiesForEra } from '../data/parties';
import { PARLIAMENTS } from '../data/parliaments';
import { REGIONS } from '../data/regions';
import { generateName } from '../generation/characters';
import { lastElectionShares } from './polling';
import { Rng } from './rng';

const PER_SEAT_NOISE = 0.015;
/** election-day campaign wobble (sd) — the only gap between polling and result.
 *  Raised 0.012 → 0.016: real elections routinely diverge from the final polls by a
 *  couple of points (a "polling miss"), and the old value made the result almost a
 *  deterministic read-off of the polls. A slightly larger campaign wobble gives bad
 *  (and good) national nights real tail probability, so flawless win streaks and
 *  unlosable governments become rarer without shifting the central outcome. */
const CAMPAIGN_NOISE = 0.016;
/** the right-populist slot — only one of these polls per era and they never co-occur.
 *  Their vote is spread thin (unlike the concentrated LD/Green vote), so under FPTP
 *  it should convert to seats a little WORSE than a mainstream party at the same
 *  share: a foothold is reachable, but a thin national vote must NOT sweep marginals
 *  everywhere (the old ×2.3 amplifier let 13% → ~290 seats). A real high-share surge
 *  can still break through. */
const POPULIST_PARTIES: PartyId[] = ['ukip', 'brexit', 'reform'];
/** the populist swing-to-seat amplifier (applied to the portion of a positive swing
 *  above ~2pts). Set BELOW the mainstream ×1.6 so a spread populist vote converts a
 *  touch worse than a concentrated one. */
const POPULIST_SWING_MULT = 1.4;
/** ceiling on a populist's amplified per-seat swing — a hard cap so even a large
 *  surge can't flip a whole block of marginals at once. Tuned against the seat sims. */
const POPULIST_SWING_CAP = 0.52;
/** non-major parties (everyone but Con/Lab, incl. populists) convert an above-baseline
 *  swing into seats ~10% less efficiently, so a third party leapfrogs the main two less
 *  readily across all eras. Con/Lab are unaffected. */
const MINOR_AMP_DAMP = 0.9;
/** how much a real above-baseline swing is amplified into seats (the FPTP distortion).
 *  Lower = more proportional (seat share tracks vote share more closely). */
const MAINSTREAM_AMP = 1.2;
/** per-seat vote-share bonus for the national vote-leader — tips marginals their
 *  way so a clear lead crosses the majority line more often. Trimmed slightly so
 *  blowout 400+ majorities are a touch rarer without dampening ordinary leads. */
const WINNER_BONUS = 0.007;

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
  // incumbent fatigue: a first-term government gets a boost at its FIRST re-election
  // (a one-term government usually — but no longer almost-always — earns a second
  // term), then a growing anti-incumbency penalty from the SECOND re-election on (the
  // public tires of a long-governing party).
  // Tuned for swingier elections: the first-term boost is trimmed +1.8 → +1.2pt so a
  // first re-election is winnable, not a coronation; and the per-term penalty is
  // steepened -3 → -3.5pt (cap -16%) so a third/fourth-term government faces a real
  // headwind and CAN lose. This keeps career.test.ts's monotone-fatigue guard green
  // (terms-4 share still sits well below terms-1) while widening the downside.
  const gov = state.government.governingParty;
  const terms = state.government.termsInPower ?? 1;
  const fatigue = terms <= 1 ? 0.012
    : -Math.min(0.16, (terms - 1) * 0.035);
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
  playerBoost: { party: PartyId; pts: number } | null,
  leaderBonus: { party: PartyId; pts: number } | null = null
): SeatOutcome {
  // the Speaker is conventionally unopposed
  if (seat.winner === 'spk' && !playerBoost) {
    return { shares: { ...seat.shares }, winner: 'spk' };
  }

  const sens = REGIONS[seat.region].swingSensitivity;
  const shares: Partial<Record<PartyId, number>> = {};
  // swing always from the IMMUTABLE build-time baseline (never the last result), so
  // the map can't compound/polarise election-on-election (old saves: fall back to shares)
  for (const [partyKey, base] of Object.entries(seat.base ?? seat.shares)) {
    const p = partyKey as PartyId;
    let v = base ?? 0;
    if (POLLED_PARTIES.includes(p)) {
      let swing = ((national[p] ?? 0) - (anchor[p] ?? 0)) * sens;
      // a party making real gains converts votes to seats faster: amplify only the
      // portion of a positive swing above ~2pts, so a genuine surge wins more seats
      // while ordinary campaign noise (and a flat vote) stays FPTP-punished
      if (swing > 0.02) {
        // non-major parties (everyone but Con/Lab) convert a surge ~10% less efficiently
        const damp = PARTIES[p].major ? 1 : MINOR_AMP_DAMP;
        if (POPULIST_PARTIES.includes(p)) {
          // a spread populist vote converts a little WORSE than mainstream, hard-capped
          swing = Math.min(POPULIST_SWING_CAP, 0.02 + (swing - 0.02) * POPULIST_SWING_MULT * damp);
        } else {
          // convert a real swing to seats — big national leads earn a decisive
          // majority while a spread vote still converts reasonably (tuned vs sims)
          swing = 0.02 + (swing - 0.02) * MAINSTREAM_AMP * damp;
        }
      }
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
  // winner's bonus: the national vote-leader's vote distributes a little more
  // efficiently, tipping a handful of marginals their way so a clear lead crosses
  // the majority line more often (more decisive parliaments). Safe/distant seats
  // are unaffected; only close seats actually flip.
  if (leaderBonus) {
    shares[leaderBonus.party] = Math.max(0, (shares[leaderBonus.party] ?? 0) + leaderBonus.pts);
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

/** Convert the internal national shares into a realistic DISPLAY table. Regional
 *  parties (SNP / Plaid) are polled at their region's strength, which over-reads as a
 *  GB-wide figure (SNP showing ~23%). Scale a strict regional party down by its
 *  region's share of seats so the published table is sane and the GB parties aren't
 *  artificially compressed. DISPLAY ONLY — the seat model keeps using the unscaled
 *  `national`, so seat counts are unchanged. */
function displayVoteShares(
  state: GameState,
  national: Partial<Record<PartyId, number>>
): Partial<Record<PartyId, number>> {
  const regionSeats: Record<string, number> = {};
  let totalSeats = 0;
  for (const seat of state.seatMap) {
    regionSeats[seat.region] = (regionSeats[seat.region] ?? 0) + 1;
    totalSeats++;
  }
  const out: Partial<Record<PartyId, number>> = {};
  for (const [pk, v] of Object.entries(national)) {
    const p = pk as PartyId;
    const regions = PARTIES[p]?.contestsRegions;
    const coverage = regions
      ? regions.reduce((n, r) => n + (regionSeats[r] ?? 0), 0) / (totalSeats || 1)
      : 1;
    // a strict regional party (contests well under half the seats) reads at region
    // strength → rescale to a national figure; GB-wide parties are left untouched
    out[p] = coverage < 0.5 ? (v ?? 0) * coverage : (v ?? 0);
  }
  let total = 0;
  for (const v of Object.values(out)) total += v ?? 0;
  if (total > 0) for (const k of Object.keys(out)) out[k as PartyId] = (out[k as PartyId] ?? 0) / total;
  return out;
}

export interface RunElectionOutput {
  result: ElectionResult;
  playerWonSeat: boolean;
}

/** Run a general election: swing every synthetic seat, build the result,
 *  and write the new shares/winners back into the seat map.
 *  Government formation and career fallout are handled by the caller. */
export function runElection(state: GameState, rng: Rng): RunElectionOutput {
  // FIXED anchor: swing is measured from the era's starting national shares — the
  // distribution the per-seat baseline corresponds to — NOT the last election (which
  // would let the map drift/run away). seat.base supplies the matching per-seat base.
  const anchor = PARLIAMENTS[state.startEra].baselineShares;
  const national = electionNationalShares(state, rng);
  const playerParty = state.player.partyId;

  // the national vote-leader gets a small per-seat winner's bonus so a clear lead
  // converts into a single-party majority more often (see computeSeat)
  const leaderParty = (Object.entries(national) as [PartyId, number][])
    .filter(([p]) => PARTIES[p]?.major)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? null;
  const leaderBonus = leaderParty ? { party: leaderParty, pts: WINNER_BONUS } : null;

  const playerSeat = state.seatMap.find((s) => s.id === state.player.seatId)!;
  const approval = state.player.stats.constituencyApproval;
  const personalVote = ((approval - 50) / 50) * 0.06;
  // defectors face the voters without the comfort of incumbency — and a penalty
  const defected = state.player.flags.defected === 1;
  // personal incumbency advantage. Trimmed 0.02 → 0.012: the real UK personal-vote
  // bonus is ~1–1.5pts, not a flat two, and the old cushion was offsetting roughly
  // half of a typical bad-night national swing — so even marginal seats almost never
  // fell. A smaller cushion leaves marginals genuinely exposed when the national mood
  // turns, while a safe seat's underlying margin still carries the day.
  const baseIncumbency = state.player.hasSeat && !defected ? 0.012 : 0;
  // "time for a change" fatigue: a long-serving incumbent accrues a modest
  // anti-incumbency headwind (the public eventually tires of a fixture). ~-0.35pt per
  // year in the seat beyond the first ~4 years, capped at -2.6pt — enough to make a
  // serial flawless 9/9 streak rarer and to tip a long-held MARGINAL on a bad night,
  // but still too small to threaten a genuinely safe (>15pt) seat.
  const yearsInSeat = Math.max(0, (state.day - state.player.enteredParliament) / 365);
  const tenureFatigue = state.player.hasSeat && !defected
    ? -Math.min(0.026, Math.max(0, (yearsInSeat - 4)) * 0.0035)
    : 0;
  const incumbency = baseIncumbency + tenureFatigue;
  const defectionPenalty = defected ? -0.03 : 0;

  const seats: Partial<Record<PartyId, number>> = {};
  let playerResult: ConstituencyResult | null = null;
  let playerWonSeat = false;
  // by convention a sitting Speaker is not opposed by the major parties and is
  // returned to their seat — effectively a guaranteed hold while in the Chair
  const playerIsSpeaker = state.player.flags._isSpeaker === true;

  for (const seat of state.seatMap) {
    const isPlayerSeat = seat.id === playerSeat.id;

    if (isPlayerSeat && playerIsSpeaker) {
      const prevShare = seat.shares[playerParty] ?? 0;
      const outcome: SeatOutcome = { shares: { ...seat.shares }, winner: playerParty };
      outcome.shares[playerParty] = Math.max(prevShare, 0.55);
      playerResult = buildConstituencyResult(state, seat, outcome, prevShare, rng);
      playerWonSeat = true;
      seat.shares = outcome.shares;
      seat.winner = playerParty;
      seats[playerParty] = (seats[playerParty] ?? 0) + 1;
      continue;
    }

    const outcome = computeSeat(
      seat, national, anchor, rng,
      isPlayerSeat
        ? { party: playerParty, pts: personalVote + incumbency + defectionPenalty }
        : null,
      leaderBonus
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
    voteShares: displayVoteShares(state, national),
    playerResult,
    outcome,
    governingParty,
    playerHeldSeat: playerWonSeat,
  };

  state.elections[result.id] = result;
  state.seats = seats;
  return { result, playerWonSeat };
}
