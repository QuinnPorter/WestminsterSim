import { GameState, Relationship, RelationshipKind } from '../types/game';
import { clamp } from './rng';

export const KIND_LABELS: Record<RelationshipKind, string> = {
  leader: 'Leader',
  chiefWhip: 'Chief Whip',
  mentor: 'Mentor',
  rival: 'Rival',
  ally: 'Ally',
  journalist: 'Press',
  colleague: 'Colleague',
};

export function getRelationship(
  state: GameState,
  kind: RelationshipKind
): Relationship | undefined {
  return state.relationships.find((r) => r.kind === kind);
}

export function relationshipValue(state: GameState, kind: RelationshipKind): number {
  return getRelationship(state, kind)?.value ?? 0;
}

export function adjustRelationship(
  state: GameState,
  kind: RelationshipKind,
  delta: number
): void {
  const rel = getRelationship(state, kind);
  if (rel) rel.value = clamp(rel.value + delta, -100, 100);
}

/** point the 'leader' relationship at a new character (new party leader) */
export function replaceLeader(state: GameState, characterId: string, startValue: number): void {
  const rel = getRelationship(state, 'leader');
  if (rel) {
    rel.characterId = characterId;
    rel.value = startValue;
  } else {
    state.relationships.push({ characterId, kind: 'leader', value: startValue });
  }
  // a fresh leader wipes the slate: any accumulated heave pressure is gone
  state.government.oppLeaderPressure = 0;
}

export function characterName(state: GameState, id: string | undefined): string {
  if (!id) return 'someone';
  if (id === 'player') return state.player.name;
  return state.characters[id]?.name ?? 'someone';
}

export function relationshipName(state: GameState, kind: RelationshipKind): string {
  return characterName(state, getRelationship(state, kind)?.characterId);
}

/** average of colleague-ish relationships, used in leadership contests */
export function averageColleagueWarmth(state: GameState): number {
  const kinds: RelationshipKind[] = ['mentor', 'ally', 'rival', 'colleague'];
  const rels = state.relationships.filter((r) => kinds.includes(r.kind));
  if (rels.length === 0) return 0;
  return rels.reduce((a, r) => a + r.value, 0) / rels.length;
}
