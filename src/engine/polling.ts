import { GameState, PartyId } from '../types/game';
import { PARLIAMENTS } from '../data/parliaments';
import { POLLED_PARTIES } from '../data/parties';
import { Rng } from './rng';

/** national vote shares at the last election (or game start) — the swing anchor */
export function lastElectionShares(state: GameState): Partial<Record<PartyId, number>> {
  const results = Object.values(state.elections).sort((a, b) => b.date - a.date);
  if (results.length > 0) return results[0].voteShares;
  return PARLIAMENTS[state.startEra].baselineShares;
}

/** long-run "fundamentals" each party's polling reverts toward */
function fundamentals(state: GameState): Partial<Record<PartyId, number>> {
  const base = lastElectionShares(state);
  const out: Partial<Record<PartyId, number>> = {};
  for (const p of POLLED_PARTIES) out[p] = base[p] ?? 0.01;
  return out;
}

const WEEK = 7;
/** drag on the governing party once the honeymoon ends, per week */
const GOVERNING_DRAG = 0.0005;
const HONEYMOON_DAYS = 365;
/** weekly random-walk noise (sd) and pull toward fundamentals */
const WEEKLY_NOISE = 0.005;
const MEAN_REVERSION = 0.015;

/** advance the polling random walk over elapsed days */
export function updatePolling(state: GameState, rng: Rng, toDay: number): void {
  const shares = state.polling.shares;
  const funds = fundamentals(state);
  const gov = state.government.governingParty;
  let day = state.polling.lastUpdated;

  while (day + WEEK <= toDay) {
    day += WEEK;
    for (const p of POLLED_PARTIES) {
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
    for (const p of POLLED_PARTIES) total += shares[p] ?? 0;
    for (const p of POLLED_PARTIES) shares[p] = (shares[p] ?? 0) / total;
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
