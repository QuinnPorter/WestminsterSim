import { GameState, PartyId, StatDelta } from '../types/game';
import { EffectSpec } from '../types/content';
import { POLLED_PARTIES } from '../data/parties';
import { adjustRelationship, KIND_LABELS } from './relationships';
import { clamp } from './rng';

export const STAT_LABELS: Record<string, string> = {
  profile: 'Profile',
  partyStanding: 'Standing',
  competence: 'Competence',
  constituencyApproval: 'Approval',
  integrity: 'Integrity',
};

function resolveParty(state: GameState, ref: 'own' | 'gov' | PartyId): PartyId {
  if (ref === 'own') return state.player.partyId;
  if (ref === 'gov') return state.government.governingParty;
  return ref;
}

export function applyPollingShock(
  state: GameState,
  party: PartyId,
  deltaPts: number
): void {
  const shares = state.polling.shares;
  if (shares[party] === undefined) return;
  shares[party] = Math.max(0.005, (shares[party] ?? 0) + deltaPts / 100);
  let total = 0;
  for (const p of POLLED_PARTIES) total += shares[p] ?? 0;
  for (const p of POLLED_PARTIES) shares[p] = (shares[p] ?? 0) / total;
}

/** Apply an effect spec to the state. Returns user-facing stat deltas. */
export function applyEffects(state: GameState, spec: EffectSpec): StatDelta[] {
  const deltas: StatDelta[] = [];

  if (spec.stats) {
    for (const [key, delta] of Object.entries(spec.stats)) {
      if (!delta) continue;
      const k = key as keyof typeof state.player.stats;
      state.player.stats[k] = clamp(state.player.stats[k] + delta, 0, 100);
      deltas.push({ label: STAT_LABELS[k] ?? k, delta });
    }
  }

  if (spec.relationships) {
    for (const { kind, delta } of spec.relationships) {
      if (!delta) continue;
      adjustRelationship(state, kind, delta);
      deltas.push({ label: KIND_LABELS[kind], delta });
    }
  }

  if (spec.pollingShock) {
    applyPollingShock(
      state,
      resolveParty(state, spec.pollingShock.party),
      spec.pollingShock.delta
    );
  }

  if (spec.setFlags) {
    for (const [flag, value] of Object.entries(spec.setFlags)) {
      state.player.flags[flag] = value;
    }
  }

  if (spec.addHeadline) {
    state.history.push({ kind: 'event', date: state.day, headline: spec.addHeadline });
  }

  if (spec.trigger === 'rebel') {
    state.player.rebellionCount += 1;
  }
  // 'resignOffice' and 'leadershipChallenge' triggers are handled by the
  // scheduler/career layer after effects are applied (they queue forced events)

  return deltas;
}
