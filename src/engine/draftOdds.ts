import { GameState } from '../types/game';
import { clamp } from './rng';

/** the odds a party's members choose a figure from another chamber (or from a
 *  mayoralty) as their leader: a cabinet record and a public name carry it, and
 *  a party out of office is readier to look outside */
export function draftOdds(state: GameState, desperate: boolean): number {
  const s = state.player.stats;
  const peak = Number(state.player.flags._peakTier ?? 0);
  const base = 0.20
    + (peak >= 5 ? 0.16 : peak >= 4 ? 0.10 : 0)
    + (s.profile - 60) / 250
    + (s.competence - 55) / 300
    + (desperate ? 0.12 : 0);
  return clamp(base, 0.15, 0.75);
}
