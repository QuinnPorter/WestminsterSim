import { GameState } from '../types/game';

/** what `generateCharacter` needs to mint somebody new without a clash: every
 *  name in use and the next free npc id */
export interface CastContext {
  usedNames: Set<string>;
  idCounter: { value: number };
}

/** the cast in play. The live chamber's by default; with `includeDormant` the
 *  chambers the player has left behind too, so a new chamber's cast cannot
 *  collide with one they may return to. */
export function castContext(state: GameState, opts: { includeDormant?: boolean } = {}): CastContext {
  const usedNames = new Set<string>([state.player.name]);
  let max = 0;
  const scan = (chars: Record<string, { id: string; name: string }>) => {
    for (const c of Object.values(chars)) {
      usedNames.add(c.name);
      const n = Number(c.id.replace('npc_', ''));
      if (!Number.isNaN(n) && n >= max) max = n + 1;
    }
  };
  scan(state.characters);
  if (opts.includeDormant) {
    for (const snap of Object.values(state.dormant ?? {})) scan(snap.characters);
  }
  return { usedNames, idCounter: { value: max } };
}
