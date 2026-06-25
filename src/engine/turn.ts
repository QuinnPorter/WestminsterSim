import { GameState } from '../types/game';
import { ALL_CARDS } from '../content/cards';
import {
  nextStep, resolveCalendarChoice, resolveEarlyElectionChoice,
} from './scheduler';
import { resolveForcedChoice, dissolveCoalition } from './career';
import { applyEffects } from './effects';
import { resolveTokens } from './cardEngine';
import { updatePolling, samplePolling } from './polling';
import { Rng } from './rng';

/** apply the player's choice to the current card and attach the outcome */
export function resolveChoiceCore(game: GameState, rng: Rng, choiceIndex: number): void {
  const card = game.currentCard;
  if (!card || card.outcome) return;

  if (card.kind === 'normal') {
    const content = ALL_CARDS.find((c) => c.id === card.cardId);
    if (!content) return;
    const choice = content.choices[choiceIndex];
    const deltas = applyEffects(game, choice.effects);

    let text: string;
    // a trigger may come from the choice itself or from the picked weighted outcome
    let triggered = choice.effects.trigger;
    if (Array.isArray(choice.outcomeText)) {
      const picked = rng.pickWeighted(choice.outcomeText, (o) => o.weight);
      text = picked.text;
      if (picked.extra) {
        deltas.push(...applyEffects(game, picked.extra));
        triggered = triggered ?? picked.extra.trigger;
      }
    } else {
      text = choice.outcomeText;
    }

    if (triggered === 'resignOffice' && game.player.officeId) {
      game.forcedQueue.push({ kind: 'resignPrompt', payload: { reason: 'principle' } });
    }
    if (triggered === 'resignScandal' && game.player.officeId) {
      game.forcedQueue.push({ kind: 'resignPrompt', payload: { reason: 'scandal' } });
    }
    if (triggered === 'leadershipChallenge') {
      game.forcedQueue.push({ kind: 'leadershipStand' });
    }
    if (triggered === 'coalitionBreak') {
      dissolveCoalition(game, rng);
    }
    card.outcome = { text: resolveTokens(game, text), deltas };
  } else if (card.kind === 'calendar') {
    const key = card.payload?.calKey as string;
    const outcome = key === 'earlyElection'
      ? resolveEarlyElectionChoice(game, choiceIndex)
      : resolveCalendarChoice(game, rng, card, choiceIndex);
    card.outcome = { text: resolveTokens(game, outcome.text), deltas: outcome.deltas };
  } else {
    const outcome = resolveForcedChoice(game, rng, card, choiceIndex);
    card.outcome = { text: resolveTokens(game, outcome.text), deltas: outcome.deltas };
  }
}

/** dismiss the outcome: advance the clock, update the world, draw what's next */
export function continueCore(game: GameState, rng: Rng): void {
  const card = game.currentCard;
  if (!card || !card.outcome) return;

  const advance = (card.payload?.advance as number) ?? rng.int(21, 42);
  const before = game.day;
  game.day += advance;
  updatePolling(game, rng, game.day);
  samplePolling(game);

  const yearsBefore = Math.floor((before - game.startDay) / 365);
  const yearsAfter = Math.floor((game.day - game.startDay) / 365);
  if (yearsAfter > yearsBefore) {
    game.player.age += yearsAfter - yearsBefore;
  }

  game.currentCard = null;
  nextStep(game, rng);
}

/** dismiss the election-night screen and let the world move on */
export function acknowledgeElectionCore(game: GameState, rng: Rng): void {
  game.pendingElectionId = null;
  nextStep(game, rng);
}
