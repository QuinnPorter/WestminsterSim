import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from '../types/game';
import { CreationInput, createNewGame, SAVE_VERSION } from '../engine/newGame';
import { initCalendar, nextStep } from '../engine/scheduler';
import {
  acknowledgeElectionCore, continueCore, resolveChoiceCore,
} from '../engine/turn';
import {
  buildLegacy, changeParty, resignOfficeCore, sackMinisterCore, callForPmResignationCore,
  playerOfficeTitle,
} from '../engine/career';
import { OFFICES } from '../data/offices';
import { Era, OfficeId, PartyId } from '../types/game';
import { Rng } from '../engine/rng';

/** a named manual save (distinct from the auto-saved live `game`) */
export interface SaveSlot {
  id: string;
  name: string;
  savedAt: number;
  era: Era;
  /** short "Name — Office" descriptor for the load list */
  legacyLabel: string;
  game: GameState;
}

interface GameStore {
  game: GameState | null;
  /** up to 3 named manual saves, kept separate from the live auto-save */
  slots: SaveSlot[];
  startNewGame: (input: CreationInput) => void;
  resolveChoice: (choiceIndex: number) => void;
  continueAfterOutcome: () => void;
  acknowledgeElection: () => void;
  crossFloor: (partyId: PartyId) => void;
  resignOffice: () => void;
  sackMinister: (officeId: OfficeId) => void;
  callForPmResignation: () => void;
  retire: () => void;
  abandonGame: () => void;
  /** save the current career into a new named slot (caller ensures < 3 slots) */
  saveToSlot: (name: string) => void;
  /** replace an existing named slot with the current career */
  overwriteSlot: (id: string, name: string) => void;
  /** load a named slot as the live game */
  loadSlot: (id: string) => void;
  deleteSlot: (id: string) => void;
  /** debug helper (used by the ?debug menu) */
  debugMutate: (fn: (game: GameState, rng: Rng) => void) => void;
}

/** Backfill fields added across save versions onto a GameState, idempotently.
 *  Used by the persist `migrate` (root blob) and when loading a manual slot
 *  whose snapshot may predate the current shape. */
export function migrateGameState(game: GameState): GameState {
  if (game.government.pmSinceDay === undefined) {
    game.government.pmSinceDay = game.parliamentStart;
  }
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
  if (game.player.officeSinceDay === undefined) {
    game.player.officeSinceDay = game.player.officeId ? game.day : null;
  }
  if (game.government.arrangement === undefined) {
    game.government.arrangement = game.government.majority > 0 ? 'majority' : 'minority';
  }
  if (game.government.termsInPower === undefined) {
    game.government.termsInPower = 1;
  }
  game.version = SAVE_VERSION;
  return game;
}

function makeSlotId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function snapshotSlot(game: GameState, id: string, name: string): SaveSlot {
  return {
    id,
    name: name.trim() || 'Saved career',
    savedAt: Date.now(),
    era: game.startEra,
    legacyLabel: `${game.player.name} — ${playerOfficeTitle(game)}`,
    game: structuredClone(game),
  };
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
      slots: [],

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

      callForPmResignation: () =>
        mutateGame(get, set, (game, rng) => { callForPmResignationCore(game, rng); }),

      retire: () =>
        mutateGame(get, set, (game) => {
          if (game.gameOver) return;
          game.gameOver = { reason: 'retired', legacy: buildLegacy(game) };
          game.currentCard = null;
        }),

      abandonGame: () => set({ game: null }),

      saveToSlot: (name) => {
        const game = get().game;
        if (!game) return;
        const slots = get().slots;
        if (slots.length >= 3) return; // UI offers overwrite when full
        set({ slots: [...slots, snapshotSlot(game, makeSlotId(), name)] });
      },

      overwriteSlot: (id, name) => {
        const game = get().game;
        if (!game) return;
        set({
          slots: get().slots.map((s) =>
            s.id === id ? snapshotSlot(game, id, name) : s
          ),
        });
      },

      loadSlot: (id) => {
        const slot = get().slots.find((s) => s.id === id);
        if (!slot) return;
        set({ game: migrateGameState(structuredClone(slot.game)) });
      },

      deleteSlot: (id) => set({ slots: get().slots.filter((s) => s.id !== id) }),

      debugMutate: (fn) => mutateGame(get, set, fn),
    }),
    {
      name: 'westminstersim-save',
      version: SAVE_VERSION,
      migrate: (persisted) => {
        const store = persisted as GameStore;
        if (store.game) migrateGameState(store.game);
        if (!store.slots) store.slots = [];
        for (const slot of store.slots) migrateGameState(slot.game);
        return store;
      },
    }
  )
);
