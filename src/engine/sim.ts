import { Era, GameState, PartyId } from '../types/game';
import { OFFICES } from '../data/offices';
import { createNewGame } from './newGame';
import { initCalendar, nextStep } from './scheduler';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from './turn';
import { Rng } from './rng';

export interface SimSummary {
  seed: number;
  yearsPlayed: number;
  steps: number;
  highestTier: number;
  becameLeader: boolean;
  becamePM: boolean;
  electionsContested: number;
  electionsWonSeat: number;
  lostSeatEver: boolean;
  gameOverReason: string | null;
  /** an NPC PM resigned (scandal or longevity) at some point */
  npcPmResigned: boolean;
  /** a PM (NPC or player) called an early/snap election at some point */
  earlyElectionCalled: boolean;
  /** cardId -> times seen, for repetition analysis */
  cardCounts: Record<string, number>;
  finalStats: GameState['player']['stats'];
}

export interface SimOptions {
  seed: number;
  years: number;
  era?: Era;
  partyId?: PartyId;
  /** chance the policy picks the "first" (usually ambitious/loyal) choice */
  ambition?: number;
}

/** Drive a full career headlessly with a simple random policy.
 *  Used by balance tests and the repetition report. */
export function simulateCareer(opts: SimOptions): SimSummary {
  const rng = new Rng(opts.seed ^ 0x5eed);
  const era: Era = opts.era ?? (rng.chance(0.5) ? '2019' : '2024');
  const partyId: PartyId =
    opts.partyId ?? (era === '2019'
      ? rng.chance(0.5) ? 'con' : 'lab'
      : rng.chance(0.5) ? 'lab' : 'con');

  const game = createNewGame({
    name: 'Sim Subject',
    gender: 'f',
    age: 38,
    region: rng.pick(['london', 'northWest', 'southEast', 'scotland', 'wales'] as const),
    background: rng.pick(['lawyer', 'teacher', 'advisor', 'business', 'doctor'] as const),
    partyId,
    avatar: {
      skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0,
      outfit: 0, outfitColour: 0, accessory: 0, bg: 0,
    },
    era,
    seed: opts.seed,
  });
  initCalendar(game);
  const gameRng = new Rng(game.rngState);
  nextStep(game, gameRng);

  const ambition = opts.ambition ?? 0.65;
  const endDay = game.startDay + opts.years * 365;
  const cardCounts: Record<string, number> = {};
  let steps = 0;
  let highestTier = 0;
  let becameLeader = false;
  let becamePM = false;
  let lostSeatEver = false;

  while (!game.gameOver && game.day < endDay && steps < opts.years * 40) {
    steps++;
    if (game.pendingElectionId) {
      acknowledgeElectionCore(game, gameRng);
      continue;
    }
    const card = game.currentCard;
    if (!card) {
      // should not happen — guard against stalls
      nextStep(game, gameRng);
      if (!game.currentCard && !game.pendingElectionId && !game.gameOver) {
        throw new Error(`engine stalled on day ${game.day}`);
      }
      continue;
    }
    if (card.kind === 'normal') {
      cardCounts[card.cardId] = (cardCounts[card.cardId] ?? 0) + 1;
    }
    // policy: ambitious players take the first option (accept jobs, stand, fight)
    const choiceIndex = gameRng.chance(ambition) ? 0 : gameRng.int(0, card.choices.length - 1);
    resolveChoiceCore(game, gameRng, choiceIndex);
    continueCore(game, gameRng);

    const tier = game.player.officeId ? OFFICES[game.player.officeId].tier : 0;
    if (tier > highestTier) highestTier = tier;
    if (game.player.officeId === 'leader') {
      becameLeader = true;
      if (game.government.pmId === 'player') becamePM = true;
    }
    if (!game.player.hasSeat) lostSeatEver = true;
  }
  game.rngState = gameRng.state;

  const electionsContested = Object.keys(game.elections).length;
  const electionsWonSeat = Object.values(game.elections).filter((e) => e.playerHeldSeat).length;
  const headlines = game.history
    .filter((h) => h.kind === 'event')
    .map((h) => (h as { headline: string }).headline);

  return {
    npcPmResigned: headlines.some((h) =>
      /resigns as Prime Minister|announces resignation after/.test(h)
    ),
    earlyElectionCalled: headlines.some((h) =>
      /calls a general election|snap general election/.test(h)
    ),
    seed: opts.seed,
    yearsPlayed: (game.day - game.startDay) / 365,
    steps,
    highestTier,
    becameLeader,
    becamePM,
    electionsContested,
    electionsWonSeat,
    lostSeatEver,
    gameOverReason: game.gameOver?.reason ?? null,
    cardCounts,
    finalStats: game.player.stats,
  };
}
