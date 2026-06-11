import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from '../types/game';
import { CreationInput, createNewGame, SAVE_VERSION } from '../engine/newGame';
import { initCalendar, nextStep } from '../engine/scheduler';
import {
  acknowledgeElectionCore, continueCore, resolveChoiceCore,
} from '../engine/turn';
import { buildLegacy, changeParty } from '../engine/career';
import { PartyId } from '../types/game';
import { Rng } from '../engine/rng';

interface GameStore {
  game: GameState | null;
  startNewGame: (input: CreationInput) => void;
  resolveChoice: (choiceIndex: number) => void;
  continueAfterOutcome: () => void;
  acknowledgeElection: () => void;
  crossFloor: (partyId: PartyId) => void;
  retire: () => void;
  abandonGame: () => void;
  /** debug helper (used by the ?debug menu) */
  debugMutate: (fn: (game: GameState, rng: Rng) => void) => void;
}

function withRng(game: GameState, fn: (rng: Rng) => void): void {
  const rng = new Rng(game.rngState);
  fn(rng);
  game.rngState = rng.state;
}

function mutateGame(
  get: () => GameStore,
  set: (partial: Partial<GameStore>) => void,
  fn: (game: GameState, rng: Rng) => void
): void {
  const current = get().game;
  if (!current) return;
  const game = structuredClone(current);
  withRng(game, (rng) => fn(game, rng));
  set({ game });
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,

      startNewGame: (input) => {
        const game = createNewGame(input);
        initCalendar(game);
        withRng(game, (rng) => nextStep(game, rng));
        set({ game });
      },

      resolveChoice: (choiceIndex) =>
        mutateGame(get, set, (game, rng) => resolveChoiceCore(game, rng, choiceIndex)),

      continueAfterOutcome: () =>
        mutateGame(get, set, (game, rng) => continueCore(game, rng)),

      acknowledgeElection: () =>
        mutateGame(get, set, (game, rng) => acknowledgeElectionCore(game, rng)),

      crossFloor: (partyId) =>
        mutateGame(get, set, (game, rng) => changeParty(game, rng, partyId)),

      retire: () =>
        mutateGame(get, set, (game) => {
          if (game.gameOver) return;
          game.gameOver = { reason: 'retired', legacy: buildLegacy(game) };
          game.currentCard = null;
        }),

      abandonGame: () => set({ game: null }),

      debugMutate: (fn) => mutateGame(get, set, fn),
    }),
    {
      name: 'westminstersim-save',
      version: SAVE_VERSION,
      migrate: (persisted, version) => {
        const store = persisted as GameStore;
        if (version < 2 && store.game) {
          // v1 saves predate PM-tenure tracking
          store.game.government.pmSinceDay = store.game.parliamentStart;
        }
        return store;
      },
    }
  )
);
