import { GameState, PartyId, RegionId } from '../types/game';
import { createNewGame } from '../engine/newGame';
import { nextStep } from '../engine/scheduler';
import { initCalendar } from '../engine/calendar';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from '../engine/turn';
import { Rng } from '../engine/rng';

/** the shared fixtures of the interlude tests: a Commons career and a turn loop */

export type TestEra = '2010' | '2015' | '2017' | '2019' | '2024';

export function newTestGame(opts: {
  seed: number; region?: RegionId; partyId?: PartyId; era?: TestEra; profile?: number; age?: number;
}): GameState {
  const g = createNewGame({
    name: 'Test Subject', gender: 'f', age: opts.age ?? 40, region: opts.region ?? 'london', background: 'lawyer',
    partyId: opts.partyId ?? 'lab',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: opts.era ?? '2019', seed: opts.seed,
  });
  initCalendar(g);
  if (opts.profile !== undefined) g.player.stats.profile = opts.profile;
  return g;
}

/** play turns, answering each card with `onCard`'s choice (the first by default),
 *  stopping early when `until` says so; returns the kinds of the cards answered */
export function play(
  g: GameState, rng: Rng, turns: number,
  onCard: (g: GameState, kind: string) => number = () => 0,
  until?: (g: GameState) => boolean
): string[] {
  const kinds: string[] = [];
  for (let turn = 0; turn < turns && !g.gameOver; turn++) {
    if (until?.(g)) break;
    if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
    if (!g.currentCard) nextStep(g, rng);
    if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
    const card = g.currentCard;
    if (!card) break;
    kinds.push(card.kind);
    resolveChoiceCore(g, rng, onCard(g, card.kind));
    if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
    continueCore(g, rng);
  }
  return kinds;
}
