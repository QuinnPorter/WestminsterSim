import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from '../types/game';
import { CreationInput, createNewGame, SAVE_VERSION } from '../engine/newGame';
import { initCalendar, nextStep } from '../engine/scheduler';
import {
  acknowledgeElectionCore, continueCore, resolveChoiceCore,
} from '../engine/turn';
import { buildLegacy, changeParty, resignOfficeCore, sackMinisterCore } from '../engine/career';
import { OFFICES } from '../data/offices';
import { OfficeId, PartyId } from '../types/game';
import { Rng } from '../engine/rng';

interface GameStore {
  game: GameState | null;
  startNewGame: (input: CreationInput) => void;
  resolveChoice: (choiceIndex: number) => void;
  continueAfterOutcome: () => void;
  acknowledgeElection: () => void;
  crossFloor: (partyId: PartyId) => void;
  resignOffice: () => void;
  sackMinister: (officeId: OfficeId) => void;
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

      resignOffice: () =>
        mutateGame(get, set, (game, rng) => resignOfficeCore(game, rng)),

      sackMinister: (officeId) =>
        mutateGame(get, set, (game, rng) => sackMinisterCore(game, rng, officeId)),

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
        const game = store.game;
        if (game) {
          if (version < 2) {
            // v1 saves predate PM-tenure tracking
            game.government.pmSinceDay = game.parliamentStart;
          }
          if (version < 3) {
            // v3 adds the polling tracker and peak-tier career memory
            if (!game.pollHistory) {
              game.pollHistory = [{ day: game.parliamentStart, shares: { ...game.polling.shares } }];
            }
            if (game.player.flags._peakTier === undefined) {
              let peak = 0;
              for (const h of game.history) {
                if (h.kind === 'roleChange' && h.officeId) {
                  const t = OFFICES[h.officeId]?.tier ?? 0;
                  if (t > peak) peak = t;
                }
              }
              game.player.flags._peakTier = peak;
            }
          }
        }
        return store;
      },
    }
  )
);
