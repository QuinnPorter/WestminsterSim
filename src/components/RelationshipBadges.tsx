import { GameState } from '../types/game';
import { relationshipValue, characterName } from '../engine/relationships';
import './RelationshipBadges.css';

/** A compact, always-visible row under the main stats: the numeric temperature of
 *  the key relationships (no emoji), plus any banked favours. When the player is
 *  the party leader the Leader badge is replaced by their Deputy (responsive to
 *  whoever currently holds the post). */
export function RelationshipBadges({ game }: { game: GameState }) {
  const playerIsLeader = game.player.officeId === 'leader';
  const whip = relationshipValue(game, 'chiefWhip');
  const favours = game.player.favours ?? [];

  // when you ARE the leader, the 'leader' relationship is yourself — show the deputy instead
  let primary: { label: string; value: string } | null;
  if (playerIsLeader) {
    const deputyId = game.government.deputyPmId;
    if (deputyId && deputyId !== 'player') {
      const name = characterName(game, deputyId);
      const rel = game.relationships.find((r) => r.characterId === deputyId);
      primary = { label: 'Deputy', value: rel ? `${name} ${Math.round(rel.value)}` : name };
    } else {
      primary = null; // no deputy appointed
    }
  } else {
    primary = { label: 'Leader', value: `${Math.round(relationshipValue(game, 'leader'))}` };
  }

  return (
    <div className="rb-row">
      {primary && (
        <span className="rb-badge">
          <span className="rb-label">{primary.label}</span>
          {primary.value}
        </span>
      )}
      <span className="rb-badge">
        <span className="rb-label">Whip</span>
        {Math.round(whip)}
      </span>
      {favours.length > 0 && (
        <span className="rb-badge" title={favours.map((f) => f.note).filter(Boolean).join('\n')}>
          <span className="rb-label">Favours</span>
          {favours.length}
        </span>
      )}
    </div>
  );
}
