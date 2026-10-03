import {
  CandidateResult, ConstituencyResult, ElectionOutcome, ElectionResult, GameState, PartyId,
  SyntheticSeat,
} from '../types/game';
import { PARTIES, isMajorIn } from '../data/parties';
import { REGIONS } from '../data/regions';
import { seatSystemAt, SeatSystem } from '../data/chambers';
import { generateName } from '../generation/characters';
import { countSeats, rebuildForListPr } from '../generation/constituency';
import { arenaBaseline, arenaPolledParties } from './polling';
import { Rng } from './rng';
import { seatsForMajority, totalSeats } from './seats';
import {
  allocateRegionList, constituencyWinsByRegion, dHondt, listSeatsOf, nthSeatIndex,
  playerListRank, regionListShares, swungListShares,
} from './listSeats';

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
/** a party contesting under this share of the House is a regional party whose
 *  polled figure is a NATIONAL share of a vote that only exists in its own
 *  nation (the SNP, Plaid) */
const REGIONAL_COVERAGE = 0.5;
/** the share CAMPAIGN_NOISE is calibrated at. A polling miss is not a flat number
 *  of points regardless of a party's size: a 1.6pt miss on a party on 4% is a
 *  third of its vote, and for a regional party it lands in its own nation
 *  multiplied by its seat coverage. Scaled by sqrt(p(1-p)), the shape of
 *  sampling error, so the major parties are unchanged. */
const NOISE_CALIBRATED_AT = 0.35;
const NOISE_REF = Math.sqrt(NOISE_CALIBRATED_AT * (1 - NOISE_CALIBRATED_AT));
function campaignNoiseFor(share: number): number {
  const p = Math.min(0.95, Math.max(0.005, share));
  return CAMPAIGN_NOISE * (Math.sqrt(p * (1 - p)) / NOISE_REF);
}

/** compute this election's national GB vote shares — anchored to CURRENT POLLING
 *  (not to the last election), so the ballot box reflects the polls within a few
 *  points of campaign noise. The seat-level uniform swing in computeSeat then
 *  translates these into seats. */
export function electionNationalShares(
  state: GameState,
  rng: Rng
): Partial<Record<PartyId, number>> {
  const anchor = arenaBaseline(state);
  const polledParties = arenaPolledParties(state);
  const coverage = partyCoverage(state);
  const out: Partial<Record<PartyId, number>> = {};
  let total = 0;
  for (const p of polledParties) {
    const polled = state.polling.shares[p] ?? anchor[p] ?? 0.01;
    // a regional party's miss is scaled to its size: a flat 1.6pt on a party on 4%
    // is a third of its vote, and lands in its own nation multiplied elevenfold.
    // The nationwide parties keep the flat, calibrated wobble.
    const sd = (coverage[p] ?? 1) < REGIONAL_COVERAGE ? campaignNoiseFor(polled) : CAMPAIGN_NOISE;
    const v = Math.max(0.003, polled + rng.normal(0, sd));
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

/** the share of the House each party contests: 1 for a nationwide party, the
 *  nation's share of seats for the SNP and Plaid. Devolved chambers sit inside
 *  one nation, so every party there reads 1. */
function partyCoverage(state: GameState): Partial<Record<PartyId, number>> {
  const regionSeats: Record<string, number> = {};
  let total = 0;
  for (const seat of state.seatMap) {
    regionSeats[seat.region] = (regionSeats[seat.region] ?? 0) + 1;
    total++;
  }
  const out: Partial<Record<PartyId, number>> = {};
  for (const p of arenaPolledParties(state)) {
    const regions = PARTIES[p]?.contestsRegions ?? [];
    out[p] = total > 0
      ? regions.reduce((n, r) => n + (regionSeats[r] ?? 0), 0) / total
      : 1;
  }
  return out;
}

function computeSeat(
  seat: SyntheticSeat,
  national: Partial<Record<PartyId, number>>,
  anchor: Partial<Record<PartyId, number>>,
  coverage: Partial<Record<PartyId, number>>,
  rng: Rng,
  playerBoost: { party: PartyId; pts: number } | null,
  leaderBonus: { party: PartyId; pts: number } | null,
  polled: PartyId[],
  /** 'uk' | devolved — decides which parties count as major and whether the
   *  region's swing sensitivity applies (a devolved poll IS the nation's mood) */
  arena: GameState['arena']
): SeatOutcome {
  // the Speaker is conventionally unopposed
  if (seat.winner === 'spk' && !playerBoost) {
    return { shares: { ...seat.shares }, winner: 'spk' };
  }

  const sens = arena === 'uk' ? REGIONS[seat.region].swingSensitivity : 1;
  const shares: Partial<Record<PartyId, number>> = {};
  // swing always from the IMMUTABLE build-time baseline (never the last result), so
  // the map can't compound/polarise election-on-election (old saves: fall back to shares)
  for (const [partyKey, base] of Object.entries(seat.base ?? seat.shares)) {
    const p = partyKey as PartyId;
    let v = base ?? 0;
    if (polled.includes(p)) {
      const move = (national[p] ?? 0) - (anchor[p] ?? 0);
      const cov = coverage[p] ?? 1;
      // A regional party's polled figure is a NATIONAL share, but its vote only
      // exists inside its own nation — so a given national move is a far larger
      // move where it actually stands. The SNP's vote lives in 9% of the House,
      // so a 1pt national fall is an 11pt fall in Scotland. Convert before
      // swinging. The region's swing sensitivity is deliberately skipped for
      // those parties: it measures how much a nation follows the NATIONAL mood,
      // and a regional party's national number is already its own nation's mood.
      let swing = cov < REGIONAL_COVERAGE ? move / cov : move * sens;
      // a party making real gains converts votes to seats faster: amplify only the
      // portion of a positive swing above ~2pts, so a genuine surge wins more seats
      // while ordinary campaign noise (and a flat vote) stays FPTP-punished
      if (swing > 0.02) {
        // non-major parties convert a surge ~10% less efficiently
        const damp = isMajorIn(p, arena) ? 1 : MINOR_AMP_DAMP;
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

/** the result card for a list member: the region's list vote, with the party
 *  slate standing in for a candidate list */
function buildListResult(
  state: GameState,
  seat: SyntheticSeat,
  listShares: Partial<Record<PartyId, number>>,
  previousPlayerShare: number,
  won: boolean,
  rank: number,
  partySeats: number,
  rng: Rng
): ConstituencyResult {
  const turnout = 0.52 + rng.next() * 0.16;
  const totalVotes = Math.round((280000 + rng.next() * 120000) * turnout);
  const entries = Object.entries(listShares)
    .filter(([, v]) => (v ?? 0) > 0.005)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 7);
  const candidates: CandidateResult[] = entries.map(([partyKey, share]) => {
    const p = partyKey as PartyId;
    return {
      name: p === state.player.partyId ? `${state.player.name} (list)` : `${PARTIES[p].shortName} list`,
      partyId: p,
      share: share ?? 0,
      votes: Math.round((share ?? 0) * totalVotes),
    };
  });
  const playerShare = listShares[state.player.partyId] ?? 0;
  return {
    seatId: seat.id,
    seatName: seat.name,
    candidates,
    winnerPartyId: won ? state.player.partyId : (entries[0]?.[0] as PartyId) ?? seat.winner,
    playerStood: true,
    swing: (playerShare - previousPlayerShare) * 100,
    turnout,
    majorityVotes: 0,
    listRank: rank,
    partyListSeats: partySeats,
  };
}

/** Convert the internal national shares into a realistic DISPLAY table. Regional
 *  parties (SNP / Plaid) are polled at their region's strength, which over-reads as a
 *  GB-wide figure (SNP showing ~23%). Scale a strict regional party down by its
 *  region's share of seats so the published table is sane and the GB parties aren't
 *  artificially compressed. DISPLAY ONLY — the seat model keeps using the unscaled
 *  `national`, so seat counts are unchanged. In a devolved chamber every party's
 *  coverage is 1, so this is a plain renormalisation there. */
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

/** can this party form the government of the chamber */
function canGovern(p: PartyId, seats: Partial<Record<PartyId, number>>, arena: GameState['arena']): boolean {
  if (p === 'spk' || p === 'ind' || p === 'sf') return false;
  if (!PARTIES[p]) return false;
  if (arena !== 'uk') return true;
  return !!PARTIES[p].major || (seats[p] ?? 0) > 80;
}

/** The Senedd grows from 60 to 96 at the 2026 election and changes its voting
 *  system. If the map in hand was built for the old system, rebuild it now, so
 *  the election about to run is fought on the right map. */
function ensureSeatSystem(state: GameState, rng: Rng, system: SeatSystem): void {
  if (system.kind !== 'listPr') return;
  const alreadyListPr = state.seatMap.length > 0
    && state.seatMap.every((s) => s.kind === 'list')
    && state.seatMap.length === system.districts.length * system.seatsPer;
  if (alreadyListPr) return;
  const rebuilt = rebuildForListPr(
    rng, state.seatMap, system.districts, system.seatsPer,
    state.player.seatId, state.player.partyId, playerListRank(state),
    arenaPolledParties(state)
  );
  state.seatMap = rebuilt.seatMap;
  if (state.player.hasSeat || state.player.seatId) state.player.seatId = rebuilt.playerSeatId;
  state.history.push({
    kind: 'event', date: state.day,
    headline: 'The Senedd expands to 96 members, elected by closed-list PR in sixteen constituencies',
  });
}

/** Run a general election: swing every synthetic seat, build the result,
 *  and write the new shares/winners back into the seat map. Under the Additional
 *  Member System the constituency count is followed by the regional lists; under
 *  list PR every seat is allocated by d'Hondt from the district vote.
 *  Government formation and career fallout are handled by the caller. */
export function runElection(state: GameState, rng: Rng): RunElectionOutput {
  const arena = state.arena ?? 'uk';
  const system = seatSystemAt(arena, state.day);
  ensureSeatSystem(state, rng, system);

  // FIXED anchor: swing is measured from the chamber's structural shares — the
  // distribution the per-seat baseline corresponds to — NOT the last election (which
  // would let the map drift/run away). seat.base supplies the matching per-seat base.
  const anchor = arenaBaseline(state);
  const polled = arenaPolledParties(state);
  const national = electionNationalShares(state, rng);
  const coverage = partyCoverage(state);
  const playerParty = state.player.partyId;

  // the national vote-leader gets a small per-seat winner's bonus so a clear lead
  // converts into a single-party majority more often (see computeSeat)
  const leaderParty = (Object.entries(national) as [PartyId, number][])
    .filter(([p]) => isMajorIn(p, arena))
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? null;
  // under AMS the lists already reward the largest party in proportion; the FPTP
  // winner's bonus on top of that over-produced majorities
  const leaderBonus = leaderParty && system.kind === 'fptp' ? { party: leaderParty, pts: WINNER_BONUS } : null;

  // may legitimately be undefined: a dormant chamber is run with no player in it
  const playerSeat = state.seatMap.find((s) => s.id === state.player.seatId);
  const playerOnList = playerSeat?.kind === 'list';
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
  const seatSince = Number(state.player.flags._seatSinceDay ?? state.player.enteredParliament);
  const yearsInSeat = Math.max(0, (state.day - seatSince) / 365);
  const tenureFatigue = state.player.hasSeat && !defected
    ? -Math.min(0.026, Math.max(0, (yearsInSeat - 4)) * 0.0035)
    : 0;
  const incumbency = baseIncumbency + tenureFatigue;
  const defectionPenalty = defected ? -0.03 : 0;

  let playerResult: ConstituencyResult | null = null;
  let playerWonSeat = false;
  // by convention a sitting Speaker is not opposed by the major parties and is
  // returned to their seat — effectively a guaranteed hold while in the Chair
  const playerIsSpeaker = state.player.flags._isSpeaker === true;

  // ---- 1. the constituency count ----
  for (const seat of state.seatMap) {
    if (seat.kind === 'list') continue;
    const isPlayerSeat = playerSeat !== undefined && seat.id === playerSeat.id;

    if (isPlayerSeat && playerIsSpeaker) {
      const prevShare = seat.shares[playerParty] ?? 0;
      const outcome: SeatOutcome = { shares: { ...seat.shares }, winner: playerParty };
      outcome.shares[playerParty] = Math.max(prevShare, 0.55);
      playerResult = buildConstituencyResult(state, seat, outcome, prevShare, rng);
      playerWonSeat = true;
      seat.shares = outcome.shares;
      seat.winner = playerParty;
      continue;
    }

    const outcome = computeSeat(
      seat, national, anchor, coverage, rng,
      isPlayerSeat
        ? { party: playerParty, pts: personalVote + incumbency + defectionPenalty }
        : null,
      leaderBonus, polled, arena
    );

    if (isPlayerSeat) {
      const prevShare = seat.shares[playerParty] ?? 0;
      playerResult = buildConstituencyResult(state, seat, outcome, prevShare, rng);
      playerWonSeat = outcome.winner === playerParty;
    }

    seat.shares = outcome.shares;
    seat.winner = outcome.winner;
  }

  // ---- 2. the lists ----
  const listSeats: Partial<Record<PartyId, number>> = {};
  if (system.kind === 'ams') {
    const constWon = constituencyWinsByRegion(state.seatMap);
    const rank = playerListRank(state);
    for (const lr of system.regions) {
      const base = regionListShares(state.seatMap, lr.id, true);
      const listShares = swungListShares(base, national, anchor, polled, rng);
      const order = allocateRegionList(state.seatMap, lr.id, listShares, constWon[lr.id] ?? {});
      for (const p of order) listSeats[p] = (listSeats[p] ?? 0) + 1;

      if (!playerSeat || playerSeat.listRegion !== lr.id) continue;
      const partySeats = order.filter((p) => p === playerParty).length;
      const idx = nthSeatIndex(order, playerParty, rank);
      if (playerOnList) {
        // a list member is returned if the party won enough seats here
        const prevShare = playerSeat.shares[playerParty] ?? 0;
        const won = idx >= 0;
        playerWonSeat = won;
        playerResult = buildListResult(state, playerSeat, listShares, prevShare, won, rank, partySeats, rng);
        if (won) movePlayerToListSeat(state, lr.id, idx);
      } else if (!playerWonSeat && idx >= 0 && !playerIsSpeaker) {
        // lost the constituency, saved by the list — Sarwar and Ross in 2021
        playerWonSeat = true;
        if (playerResult) playerResult.savedByList = true;
        movePlayerToListSeat(state, lr.id, idx);
      }
    }
  } else if (system.kind === 'listPr') {
    const rank = playerListRank(state);
    for (const d of system.districts) {
      const seats = listSeatsOf(state.seatMap, d.id);
      const base = regionListShares(state.seatMap, d.id, true);
      const shares = swungListShares(base, national, anchor, polled, rng);
      const order = dHondt(shares, seats.length);
      seats.forEach((seat, i) => {
        seat.winner = order[i] ?? seat.winner;
        seat.shares = { ...shares };
      });
      for (const p of order) listSeats[p] = (listSeats[p] ?? 0) + 1;
      if (!playerSeat || playerSeat.listRegion !== d.id) continue;
      const partySeats = order.filter((p) => p === playerParty).length;
      const idx = nthSeatIndex(order, playerParty, rank);
      const prevShare = playerSeat.shares[playerParty] ?? 0;
      playerWonSeat = idx >= 0;
      playerResult = buildListResult(state, playerSeat, shares, prevShare, playerWonSeat, rank, partySeats, rng);
      if (playerWonSeat) movePlayerToListSeat(state, d.id, idx);
    }
  }

  const seats = countSeats(state.seatMap);

  // who forms the government
  const ranked = (Object.entries(seats) as [PartyId, number][])
    .filter(([p]) => canGovern(p, seats, arena))
    .sort((a, b) => b[1] - a[1]);
  const governingParty = ranked[0]?.[0] ?? state.government.governingParty;
  const govSeats = seats[governingParty] ?? 0;

  // classify by the gap to a working majority: a clear majority, a "hung"
  // parliament (close enough that a partner can form a working arrangement),
  // or a bare minority further out. Both sub-majority outcomes are unstable.
  // The band scales with the House: 16 seats of 650 is 3 of 129.
  const majorityLine = seatsForMajority(seats);
  const hungBand = Math.max(3, Math.round(16 * totalSeats(seats) / 650));
  const outcome: ElectionOutcome =
    govSeats >= majorityLine ? 'majority'
      : govSeats >= majorityLine - hungBand ? 'hung'
        : 'minority';

  const result: ElectionResult = {
    // namespaced by chamber: a devolved and a Westminster election can otherwise
    // fall on the same day and collide in state.elections
    id: arena === 'uk' ? `ge_${state.day}` : `ge_${arena}_${state.day}`,
    date: state.day,
    arena,
    seats,
    ...(system.kind === 'fptp' ? {} : { listSeats }),
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

/** re-point the player at the `idx`-th list seat of a region (the one their
 *  party's allocation gave them) and unmark whatever they stood for before */
function movePlayerToListSeat(state: GameState, listRegion: string, idx: number): void {
  const target = listSeatsOf(state.seatMap, listRegion)[idx];
  if (!target) return;
  for (const s of state.seatMap) if (s.isPlayerSeat) delete s.isPlayerSeat;
  target.isPlayerSeat = true;
  target.winner = state.player.partyId;
  state.player.seatId = target.id;
}

/** How much more likely a leader is to go after an election, given how the
 *  party did: a party that went backwards sheds its leader more readily than one
 *  that gained, and a winner with a fresh majority is nearly safe. 1 = neutral. */
export function resignationPressure(
  seatsNow: number, seatsBefore: number, wonMajority: boolean
): number {
  if (wonMajority) return 0.35;
  const delta = seatsNow - (seatsBefore || seatsNow);
  if (delta < 0) return Math.min(1.6, 1 + (-delta / Math.max(1, seatsBefore)) * 1.2);
  return Math.max(0.5, 1 - (delta / Math.max(1, seatsBefore)) * 0.8);
}
