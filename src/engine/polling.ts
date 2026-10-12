import { Era, GameDay, GameState, PartyId, RegionalBallot } from '../types/game';
import { PARLIAMENTS } from '../data/parliaments';
import { isMajorIn, polledPartiesForArena } from '../data/parties';
import { NI_WESTMINSTER } from '../data/niWestminster';
import { Rng } from './rng';

// ---------------------------------------------------------------------------
// the Northern Ireland ballot
// ---------------------------------------------------------------------------

/** the salt the NI ballot's stream is derived from, so it never shares a draw
 *  with the chamber's stream */
const NI_STREAM_SALT = 0x4e49; // 'NI'

/** the NI ballot's structural shares for an era: the real NI-wide vote,
 *  normalised over the parties the ballot polls */
export function niAnchorFor(era: Era): { anchor: Partial<Record<PartyId, number>>; parties: PartyId[] } {
  const data = NI_WESTMINSTER[era];
  const anchor: Partial<Record<PartyId, number>> = {};
  let total = 0;
  for (const p of data.polled) total += data.shares[p] ?? 0;
  for (const p of data.polled) anchor[p] = (data.shares[p] ?? 0) / (total || 1);
  return { anchor, parties: [...data.polled] };
}

/** a fresh NI ballot sitting at its era's anchor, with its own stream seeded
 *  from `seed` without drawing from anything */
export function seedNiBallot(era: Era, seed: number): RegionalBallot {
  const { anchor, parties } = niAnchorFor(era);
  return { shares: { ...anchor }, anchor, parties, rngState: (seed ^ NI_STREAM_SALT) >>> 0 };
}

/** the Commons' NI ballot, created on first use for a save that predates it.
 *  Only the Commons has one; a devolved chamber returns undefined. */
export function ensureNiBallot(state: GameState): RegionalBallot | undefined {
  if ((state.arena ?? 'uk') !== 'uk') return undefined;
  if (!state.polling.ni) state.polling.ni = seedNiBallot(state.startEra, state.rngState);
  return state.polling.ni;
}

/** the NI ballot's last result in the Commons, else its anchor: what its
 *  fundamentals revert toward */
export function lastNiShares(state: GameState, ballot: RegionalBallot): Partial<Record<PartyId, number>> {
  const results = Object.values(state.elections)
    .filter((r) => (r.arena ?? 'uk') === 'uk' && r.regionalShares?.ni)
    .sort((a, b) => b.date - a.date);
  return results[0]?.regionalShares?.ni ?? ballot.anchor;
}

/** a party's current polling, 0..1, on whichever ballot polls it */
export function partyPollingShare(state: GameState, party: PartyId): number {
  const gb = state.polling.shares[party];
  if (gb !== undefined) return gb;
  const ni = state.polling.ni;
  if (ni && ni.parties.includes(party)) return ni.shares[party] ?? ni.anchor[party] ?? 0;
  return 0;
}

/** vote shares at the last election (or game start) — the swing anchor */
export function lastElectionShares(state: GameState): Partial<Record<PartyId, number>> {
  // only elections fought in the LIVE chamber are an anchor for it — a Westminster
  // result says nothing about where the Holyrood vote sits
  const arena = state.arena ?? 'uk';
  const results = Object.values(state.elections)
    .filter((r) => (r.arena ?? 'uk') === arena)
    .sort((a, b) => b.date - a.date);
  if (results.length > 0) return results[0].voteShares;
  return arenaBaseline(state);
}

/** the live chamber's structural baseline — the shares its swing is measured
 *  from. Devolved chambers carry their own; the Commons falls back to the era. */
export function arenaBaseline(state: GameState): Partial<Record<PartyId, number>> {
  return state.anchorShares ?? PARLIAMENTS[state.startEra].baselineShares;
}

/** the parties on the live chamber's ballot */
export function arenaPolledParties(state: GameState): PartyId[] {
  return state.polledParties
    ?? polledPartiesForArena(state.arena ?? 'uk', state.startEra, state.day);
}

/** how much a NON-major party's fundamental follows its last result vs reverting to the
 *  era's structural baseline. <1 stops a minor party that overperforms once from
 *  permanently ratcheting its own support upward — so third parties leapfrog the main
 *  two less readily across all eras. Con/Lab keep a full ratchet (they alternate power). */
const MINOR_FUND_BLEND = 0.92;
/** ceiling on how far a minor party's long-run fundamental may sit ABOVE its
 *  structural baseline — caps the decade-in ratchet so a third party can rise but not
 *  run away to overtake the main parties every time (they still can in a strong cycle). */
const MINOR_FUND_CAP = 1.3;

/** long-run "fundamentals" each party's polling reverts toward */
function fundamentals(state: GameState): Partial<Record<PartyId, number>> {
  const last = lastElectionShares(state);
  const baseline = arenaBaseline(state);
  const out: Partial<Record<PartyId, number>> = {};
  for (const p of arenaPolledParties(state)) {
    if (isMajorIn(p, state.arena)) {
      out[p] = last[p] ?? 0.01;
    } else {
      // pull a minor party partway back toward its structural baseline each cycle,
      // and cap how far it can ratchet above that baseline over a long game
      const l = last[p] ?? baseline[p] ?? 0.01;
      const b = baseline[p] ?? 0.01;
      out[p] = Math.min(MINOR_FUND_BLEND * l + (1 - MINOR_FUND_BLEND) * b, b * MINOR_FUND_CAP);
    }
  }
  return out;
}

const WEEK = 7;
/** drag on the governing party once the honeymoon ends, per week — incumbency
 *  erodes support over a parliament, making re-election (and majorities) harder */
const GOVERNING_DRAG = 0.0009;
const HONEYMOON_DAYS = 365;
/** weekly random-walk noise (sd) and pull toward fundamentals */
const WEEKLY_NOISE = 0.006;
const MEAN_REVERSION = 0.015;
/** keep at most this many poll snapshots per parliament */
const MAX_POLL_SNAPSHOTS = 80;
/** the share WEEKLY_NOISE is calibrated at. Polling does not move by a flat number
 *  of points regardless of a party's size — a flat sd let a party on 7% halve or
 *  double over a parliament on noise alone, and for a regional party that lands in
 *  its own nation multiplied by its seat coverage. Scaled by sqrt(p(1-p)), the
 *  shape of sampling error, so the major parties are unchanged. */
const NOISE_CALIBRATED_AT = 0.35;
const NOISE_REF = Math.sqrt(NOISE_CALIBRATED_AT * (1 - NOISE_CALIBRATED_AT));

function weeklyNoiseFor(share: number): number {
  const p = Math.min(0.95, Math.max(0.005, share));
  return WEEKLY_NOISE * (Math.sqrt(p * (1 - p)) / NOISE_REF);
}
/** minimum days between recorded snapshots */
const POLL_SAMPLE_GAP = 25;

/** record a polling snapshot for the tracker graph, if enough time has passed */
export function samplePolling(state: GameState): void {
  const hist = state.pollHistory;
  const last = hist[hist.length - 1];
  if (last && state.day - last.day < POLL_SAMPLE_GAP) return;
  hist.push({
    day: state.day,
    shares: { ...state.polling.shares },
    ...(state.polling.ni ? { ni: { ...state.polling.ni.shares } } : {}),
  });
  if (hist.length > MAX_POLL_SNAPSHOTS) hist.splice(0, hist.length - MAX_POLL_SNAPSHOTS);
}

/** one ballot's weekly random walk from `fromDay` to `toDay`: noise scaled to
 *  each party's size, mean reversion toward its fundamentals, and the drag on
 *  the governing party once its honeymoon is over. Draws two numbers per party
 *  per week from `rng`, in party order. */
function stepBallot(
  shares: Partial<Record<PartyId, number>>,
  polled: PartyId[],
  funds: Partial<Record<PartyId, number>>,
  gov: PartyId | null,
  parliamentStart: GameDay,
  rng: Rng,
  fromDay: GameDay,
  toDay: GameDay
): void {
  let day = fromDay;
  while (day + WEEK <= toDay) {
    day += WEEK;
    for (const p of polled) {
      const current = shares[p] ?? funds[p] ?? 0.01;
      let next = current
        + rng.normal(0, weeklyNoiseFor(current))
        + MEAN_REVERSION * ((funds[p] ?? 0.01) - current);
      if (p === gov && day - parliamentStart > HONEYMOON_DAYS) {
        next -= GOVERNING_DRAG;
      }
      shares[p] = Math.max(0.004, next);
    }
    // renormalise
    let total = 0;
    for (const p of polled) total += shares[p] ?? 0;
    for (const p of polled) shares[p] = (shares[p] ?? 0) / total;
  }
}

/** advance the polling random walk over elapsed days */
export function updatePolling(state: GameState, rng: Rng, toDay: number): void {
  const from = state.polling.lastUpdated;
  stepBallot(
    state.polling.shares, arenaPolledParties(state), fundamentals(state),
    state.government.governingParty, state.parliamentStart, rng, from, toDay
  );
  // the Northern Ireland ballot walks alongside, on its own stream. Every NI
  // party reverts toward its last result (none is a "minor" party there), and
  // no NI party governs at Westminster, so there is no drag.
  const ni = ensureNiBallot(state);
  if (ni) {
    const niRng = new Rng(ni.rngState);
    stepBallot(ni.shares, ni.parties, lastNiShares(state, ni), null, state.parliamentStart, niRng, from, toDay);
    ni.rngState = niRng.state;
  }
  state.polling.lastUpdated = toDay;
}

export function pollingLead(state: GameState): number {
  const gov = state.polling.shares[state.government.governingParty] ?? 0;
  const opp = state.polling.shares[state.government.oppositionParty] ?? 0;
  return (gov - opp) * 100;
}

export function partyPolling(state: GameState, party: PartyId): number {
  return (state.polling.shares[party] ?? 0) * 100;
}
