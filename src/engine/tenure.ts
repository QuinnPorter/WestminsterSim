import { GameState, PartyId } from '../types/game';
import { chamberOf } from '../data/chambers';

/** the head-of-government and opposition-leader tenure ledgers: close the open
 *  span unless the same person is serving on, then open theirs */

function nameAndParty(
  state: GameState, characterId: string, fallbackName: string, fallbackParty: PartyId
): { name: string; partyId: PartyId } {
  if (characterId === 'player') return { name: state.player.name, partyId: state.player.partyId };
  const c = state.characters[characterId];
  return { name: c?.name ?? fallbackName, partyId: c?.partyId ?? fallbackParty };
}

export function recordPmChange(state: GameState, characterId: string): void {
  if (!state.pmHistory) state.pmHistory = [];
  const last = state.pmHistory[state.pmHistory.length - 1];
  if (last && last.endDay === null) {
    if (last.characterId === characterId) return; // already serving
    last.endDay = state.day;
  }
  const { name, partyId } = nameAndParty(
    state, characterId, `the ${chamberOf(state.arena).head}`, state.government.governingParty
  );
  state.pmHistory.push({ characterId, name, partyId, startDay: state.day, endDay: null });
}

export function recordLoChange(state: GameState, characterId: string): void {
  if (!characterId) return;
  if (!state.loHistory) state.loHistory = [];
  const last = state.loHistory[state.loHistory.length - 1];
  if (last && last.endDay === null) {
    if (last.characterId === characterId) return; // already serving
    last.endDay = state.day;
  }
  // the LO belongs to the opposition party, not the governing one
  const { name, partyId } = nameAndParty(
    state, characterId, 'the Leader of the Opposition', state.government.oppositionParty
  );
  state.loHistory.push({ characterId, name, partyId, startDay: state.day, endDay: null });
}
