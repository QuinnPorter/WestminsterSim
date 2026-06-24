import { GameState, PartyId } from '../types/game';
import { PARLIAMENTS } from '../data/parliaments';
import { PARTIES, polledPartiesForEra } from '../data/parties';
import { Rng } from './rng';

/** national vote shares at the last election (or game start) — the swing anchor */
export function lastElectionShares(state: GameState): Partial<Record<PartyId, number>> {
  const results = Object.values(state.elections).sort((a, b) => b.date - a.date);
  if (results.length > 0) return results[0].voteShares;
  return PARLIAMENTS[state.startEra].baselineShares;
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
  const baseline = PARLIAMENTS[state.startEra].baselineShares;
  const out: Partial<Record<PartyId, number>> = {};
  for (const p of polledPartiesForEra(state.startEra)) {
    if (PARTIES[p]?.major) {
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
/** minimum days between recorded snapshots */
const POLL_SAMPLE_GAP = 25;

/** record a polling snapshot for the tracker graph, if enough time has passed */
export function samplePolling(state: GameState): void {
  const hist = state.pollHistory;
  const last = hist[hist.length - 1];
  if (last && state.day - last.day < POLL_SAMPLE_GAP) return;
  hist.push({ day: state.day, shares: { ...state.polling.shares } });
  if (hist.length > MAX_POLL_SNAPSHOTS) hist.splice(0, hist.length - MAX_POLL_SNAPSHOTS);
}

/** advance the polling random walk over elapsed days */
export function updatePolling(state: GameState, rng: Rng, toDay: number): void {
  const shares = state.polling.shares;
  const funds = fundamentals(state);
  const polled = polledPartiesForEra(state.startEra);
  const gov = state.government.governingParty;
  let day = state.polling.lastUpdated;

  while (day + WEEK <= toDay) {
    day += WEEK;
    for (const p of polled) {
      const current = shares[p] ?? funds[p] ?? 0.01;
      let next = current
        + rng.normal(0, WEEKLY_NOISE)
        + MEAN_REVERSION * ((funds[p] ?? 0.01) - current);
      if (p === gov && day - state.parliamentStart > HONEYMOON_DAYS) {
        next -= GOVERNING_DRAG;
      }
      shares[p] = Math.max(0.004, next);
    }
    // renormalise
    let total = 0;
    for (const p of polled) total += shares[p] ?? 0;
    for (const p of polled) shares[p] = (shares[p] ?? 0) / total;
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
