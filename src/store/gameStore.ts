import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState } from '../types/game';
import { CreationInput, createNewGame, SAVE_VERSION } from '../engine/newGame';
import { initCalendar, nextStep, queueGeneralElection } from '../engine/scheduler';
import { CauseId } from '../types/game';
import {
  acknowledgeElectionCore, continueCore, resolveChoiceCore,
} from '../engine/turn';
import {
  buildLegacy, changeParty, resignOfficeCore, sackMinisterCore, callForPmResignationCore,
  callForLeaderResignationCore, setDeputyPmCore, playerOfficeTitle, reconstructPmHistory,
  continueAsProtegeCore, backfillCabinetOffices, reconcileCharacterOffices,
  withdrawFromCoalitionCore,
} from '../engine/career';
import { OFFICES } from '../data/offices';
import { Era, OfficeId, PartyId } from '../types/game';
import { Rng } from '../engine/rng';
import { useUiStore } from './uiStore';

/** the four "chosen exit" roles a 65+ MP can be offered (see the exit-offer framework) */
export type ExitRole = 'peerage' | 'international' | 'executive' | 'university';

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
  /** carry on the current (finished) world as a fresh protégé of the same party */
  continueAsProtege: (input: CreationInput) => void;
  resolveChoice: (choiceIndex: number) => void;
  continueAfterOutcome: () => void;
  acknowledgeElection: () => void;
  crossFloor: (partyId: PartyId) => void;
  resignOffice: () => void;
  sackMinister: (officeId: OfficeId) => void;
  /** player-PM names a cabinet Secretary of State as Deputy PM / First Secretary */
  setDeputyPm: (characterId: string) => void;
  callForPmResignation: () => void;
  /** in opposition: the player moves against their own (NPC) party leader */
  callForLeaderResignation: () => void;
  /** player-PM dissolves Parliament; the campaign fires at the next decision */
  callSnapElection: () => void;
  /** the player pulls their party out of (or, as PM, ends) the governing coalition */
  withdrawFromCoalition: () => void;
  /** update the player's chosen causes (the agenda) mid-career */
  setCauses: (causes: CauseId[]) => void;
  retire: () => void;
  /** confirm an accepted "chosen exit" — ends the game with a bespoke exit legacy */
  retireToRole: (role: ExitRole) => void;
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
  if (game.player.causes === undefined) {
    game.player.causes = [];
  }
  if (game.player.favours === undefined) {
    game.player.favours = [];
  }
  if (game.player.committeeChair === undefined) {
    game.player.committeeChair = null;
  }
  if (!game.pmHistory) {
    game.pmHistory = reconstructPmHistory(game);
  }
  if (!game.loHistory) {
    // start the LO record fresh from the sitting opposition leader (older saves
    // have no captured succession; the modal simply begins from here)
    const loId = game.government.loId;
    const name = loId === 'player'
      ? game.player.name
      : (game.characters[loId]?.name ?? 'the Leader of the Opposition');
    const partyId = loId === 'player'
      ? game.player.partyId
      : (game.characters[loId]?.partyId ?? game.government.oppositionParty);
    game.loHistory = loId
      ? [{ characterId: loId, name, partyId, startDay: game.government.pmSinceDay ?? game.parliamentStart, endDay: null }]
      : [];
  }
  if (!game.mentors) {
    game.mentors = [];
  }
  // fill any cabinet seats added since the save was written (Energy Secretary,
  // Chancellor of the Duchy of Lancaster). Idempotent — only adds missing posts.
  {
    const rng = new Rng(game.rngState);
    backfillCabinetOffices(game, rng);
    game.rngState = rng.state;
  }
  // clear any "ghost" ministers carrying a cabinet title they no longer hold
  // (e.g. an NPC the player displaced in an older save). Idempotent.
  reconcileCharacterOffices(game);
  game.version = SAVE_VERSION;
  return game;
}

/** the platform store, or null when unavailable (SSR / test env without a stub) */
function getLS(): Storage | null {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

/** localStorage wrapper that never throws: a full disk (QuotaExceededError) or a
 *  corrupt blob degrades to a console warning instead of crashing the app. Reads
 *  validate the JSON and discard an unparseable blob so boot can't fail on it. */
const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      const raw = getLS()?.getItem(name);
      if (raw == null) return null;
      JSON.parse(raw); // validate; a corrupt blob is discarded rather than thrown
      return raw;
    } catch (e) {
      console.error('Westminster.sim: discarding unreadable save', e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      getLS()?.setItem(name, value);
    } catch (e) {
      console.error('Westminster.sim: could not write save (storage full?)', e);
    }
  },
  removeItem: (name: string): void => {
    try {
      getLS()?.removeItem(name);
    } catch (e) {
      console.error('Westminster.sim: could not clear save', e);
    }
  },
};

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

/** exit-role confirm copy: a full-sentence message (period), and a period-free
 *  title/label — one entry per accepted "chosen exit" role. */
const EXIT_CONFIRM: Record<ExitRole, { title: string; message: string; label: string }> = {
  peerage: {
    title: 'Leave the Commons for the Lords?',
    message: 'Accepting the peerage ends your career in the Commons for good and sends you to the red benches.',
    label: 'Take the peerage',
  },
  international: {
    title: 'Leave the Commons for the world stage?',
    message: 'Accepting the international role means resigning your seat and leaving the House behind for good.',
    label: 'Leave for the role',
  },
  executive: {
    title: 'Leave the Commons for the boardroom?',
    message: 'Taking the executive role means standing down as an MP and closing out your political career for good.',
    label: 'Cash out',
  },
  university: {
    title: 'Leave the Commons for academia?',
    message: 'Becoming Chancellor means retiring from the Commons for good and trading the green benches for the quad.',
    label: 'Retire to academia',
  },
};

/** After an exit offer is accepted, `flags._pendingExit` is set. Fire the existing
 *  confirm modal over the outcome: confirming ends the game via `retireToRole`;
 *  cancelling simply closes the modal and returns to play (the flag is cleared here
 *  so the "decision" doesn't linger — the offer can still return next parliament). */
function maybeFireExitConfirm(
  get: () => GameStore,
  set: (partial: Partial<GameStore>) => void
): void {
  const game = get().game;
  const role = game?.player.flags._pendingExit as ExitRole | undefined;
  if (!role || !EXIT_CONFIRM[role]) return;
  // clear the pending flag up front: cancelling the modal then just leaves the player
  // in play (offer can return next parliament); confirming calls retireToRole below.
  mutateGame(get, set, (g) => { delete g.player.flags._pendingExit; });
  const copy = EXIT_CONFIRM[role];
  useUiStore.getState().requestConfirm({
    title: copy.title,
    message: copy.message,
    confirmLabel: copy.label,
    onConfirm: () => get().retireToRole(role),
  });
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

      continueAsProtege: (input) =>
        mutateGame(get, set, (game, rng) => {
          continueAsProtegeCore(game, rng, input);
          // continueAsProtegeCore wipes calendarDone; re-seed it so the
          // Budget/conference/locals/recess/PMQs set-pieces still fire in the
          // dynasty run (mirrors startNewGame).
          initCalendar(game);
          nextStep(game, rng);
        }),

      resolveChoice: (choiceIndex) => {
        mutateGame(get, set, (game, rng) => resolveChoiceCore(game, rng, choiceIndex));
        // if resolving an accepted exit offer flagged a pending exit, offer the
        // confirm modal now (over the outcome text). Confirming ends the game;
        // cancelling clears the flag and returns to play (offer can return later).
        maybeFireExitConfirm(get, set);
      },

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

      setDeputyPm: (characterId) =>
        mutateGame(get, set, (game, rng) => setDeputyPmCore(game, rng, characterId)),

      callForPmResignation: () =>
        mutateGame(get, set, (game, rng) => { callForPmResignationCore(game, rng); }),

      callForLeaderResignation: () =>
        mutateGame(get, set, (game, rng) => { callForLeaderResignationCore(game, rng); }),

      callSnapElection: () =>
        mutateGame(get, set, (game) => {
          // guard: don't double-queue if a campaign is already under way
          if (game.forcedQueue.some((e) => e.kind === 'campaign' || e.kind === 'electionNight')) return;
          queueGeneralElection(game);
          game.history.push({
            kind: 'event', date: game.day,
            headline: `${game.player.name} calls a snap general election`,
          });
        }),

      withdrawFromCoalition: () =>
        mutateGame(get, set, (game, rng) => { withdrawFromCoalitionCore(game, rng); }),

      setCauses: (causes) =>
        mutateGame(get, set, (game) => {
          game.player.causes = causes.slice(0, 3);
        }),

      retire: () =>
        mutateGame(get, set, (game) => {
          if (game.gameOver) return;
          game.gameOver = { reason: 'retired', legacy: buildLegacy(game) };
          game.currentCard = null;
        }),

      retireToRole: (role) =>
        mutateGame(get, set, (game) => {
          if (game.gameOver) return;
          // record the accepted exit so the verdict/legacy can be bespoke (read by A4),
          // then clear the pending flag and end the career.
          game.player.flags._acceptedExit = role;
          delete game.player.flags._pendingExit;
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
        try {
          set({ game: migrateGameState(structuredClone(slot.game)) });
        } catch (e) {
          // a corrupt slot must not crash the app — keep the current game
          console.error('Westminster.sim: failed to load save slot', e);
        }
      },

      deleteSlot: (id) => set({ slots: get().slots.filter((s) => s.id !== id) }),

      debugMutate: (fn) => mutateGame(get, set, fn),
    }),
    {
      name: 'westminstersim-save',
      version: SAVE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persisted) => {
        try {
          const store = persisted as GameStore;
          if (store.game) migrateGameState(store.game);
          if (!store.slots || !Array.isArray(store.slots)) store.slots = [];
          // drop any individual slot that can't be migrated rather than failing boot
          const goodSlots: SaveSlot[] = [];
          for (const slot of store.slots) {
            try {
              migrateGameState(slot.game);
              goodSlots.push(slot);
            } catch (e) {
              console.error('Westminster.sim: dropping unreadable save slot', e);
            }
          }
          store.slots = goodSlots;
          return store;
        } catch (e) {
          // a structurally broken root blob starts the player fresh rather than
          // white-screening on launch
          console.error('Westminster.sim: save migration failed; starting fresh', e);
          return { game: null, slots: [] } as Partial<GameStore>;
        }
      },
    }
  )
);
