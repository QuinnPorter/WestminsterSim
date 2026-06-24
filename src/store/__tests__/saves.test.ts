import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import type { CreationInput } from '../../engine/newGame';

// the game store uses zustand `persist` (localStorage). The test env is node, so
// stub a minimal in-memory localStorage BEFORE importing the store module.
const mem = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
};

let store: typeof import('../gameStore');
let createNewGame: typeof import('../../engine/newGame')['createNewGame'];
let SAVE_VERSION: number;

const input: CreationInput = {
  name: 'Test MP', gender: 'f', age: 40, region: 'yorkshire',
  background: 'teacher', partyId: 'lab',
  avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
  era: '2024', seed: 1,
};

beforeAll(async () => {
  vi.stubGlobal('localStorage', localStorageMock);
  store = await import('../gameStore');
  const ng = await import('../../engine/newGame');
  createNewGame = ng.createNewGame;
  SAVE_VERSION = ng.SAVE_VERSION;
});

beforeEach(() => {
  store.useGameStore.setState({ game: null, slots: [] });
});

describe('migrateGameState', () => {
  it('backfills fields missing from an old save', () => {
    const g = createNewGame(input);
    // simulate a pre-v5 save
    delete (g.government as { termsInPower?: number }).termsInPower;
    delete (g.player as { officeSinceDay?: number | null }).officeSinceDay;
    (g as { version: number }).version = 1;

    store.migrateGameState(g);

    expect(g.government.termsInPower).toBe(1);
    expect(g.player.officeSinceDay !== undefined).toBe(true);
    expect(g.government.arrangement).toBeDefined();
    expect(g.version).toBe(SAVE_VERSION);
  });
});

describe('save slots', () => {
  it('caps named slots at 3', () => {
    const s = store.useGameStore.getState();
    s.startNewGame(input);
    s.saveToSlot('A');
    s.saveToSlot('B');
    s.saveToSlot('C');
    s.saveToSlot('D'); // ignored — full
    const slots = store.useGameStore.getState().slots;
    expect(slots).toHaveLength(3);
    expect(slots.map((x) => x.name)).toEqual(['A', 'B', 'C']);
  });

  it('loadSlot restores a deep-cloned snapshot', () => {
    const s = store.useGameStore.getState();
    s.startNewGame(input);
    s.saveToSlot('snapshot');
    const slot = store.useGameStore.getState().slots[0];
    const savedDay = slot.game.day;

    // mutate the live game well away from the snapshot
    store.useGameStore.setState({
      game: { ...store.useGameStore.getState().game!, day: 999999 },
    });

    store.useGameStore.getState().loadSlot(slot.id);
    const loaded = store.useGameStore.getState().game!;
    expect(loaded.day).toBe(savedDay);
    // it's a clone, not a shared reference with the stored slot
    expect(loaded).not.toBe(store.useGameStore.getState().slots[0].game);
  });

  it('overwriteSlot replaces in place and deleteSlot removes', () => {
    const s = store.useGameStore.getState();
    s.startNewGame(input);
    s.saveToSlot('first');
    const id = store.useGameStore.getState().slots[0].id;
    s.overwriteSlot(id, 'renamed');
    expect(store.useGameStore.getState().slots[0].id).toBe(id);
    expect(store.useGameStore.getState().slots[0].name).toBe('renamed');
    s.deleteSlot(id);
    expect(store.useGameStore.getState().slots).toHaveLength(0);
  });

  it('loadSlot survives a corrupt slot without throwing or clobbering the live game', () => {
    const s = store.useGameStore.getState();
    s.startNewGame(input);
    const liveDay = store.useGameStore.getState().game!.day;
    // inject a structurally broken snapshot (migrateGameState would throw on it)
    store.useGameStore.setState({
      slots: [{
        id: 'bad', name: 'bad', savedAt: 0, era: '2024', legacyLabel: 'x',
        game: { junk: true } as never,
      }],
    });
    expect(() => store.useGameStore.getState().loadSlot('bad')).not.toThrow();
    // the corrupt slot must not have replaced the live game
    expect(store.useGameStore.getState().game!.day).toBe(liveDay);
  });
});

describe('continue as protégé', () => {
  it('re-seeds the event calendar so set-pieces still fire in the dynasty run', () => {
    const s = store.useGameStore.getState();
    s.startNewGame(input);
    store.useGameStore.getState().continueAsProtege({ ...input, name: 'Heir MP', seed: 2 });
    const game = store.useGameStore.getState().game!;
    // continueAsProtegeCore wipes calendarDone; the store must re-seed it
    expect(Object.keys(game.calendarDone).length).toBeGreaterThan(0);
  });
});
