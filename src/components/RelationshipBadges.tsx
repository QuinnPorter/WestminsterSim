import { GameState } from '../types/game';
import { relationshipValue } from '../engine/relationships';
import './RelationshipBadges.css';

/** A compact, always-visible row under the main stats: the numeric temperature of
 *  the key relationships (no emoji), plus any banked favours. When the player is
 *  the party leader the Leader badge is replaced by their Deputy (responsive to
 *  whoever currently holds the post). */
export function RelationshipBadges({ game }: { game: GameState }) {
  const playerIsLeader = game.player.officeId === 'leader';
  const favours = game.player.favours ?? [];

  return (
    <div className="rb-row">
      {/* a party leader has no meaningful Leader/Deputy/Whip relationship to show */}
      {!playerIsLeader && (
        <>
          <span className="rb-badge">
            <span className="rb-label">Leader</span>
            {Math.round(relationshipValue(game, 'leader'))}
          </span>
          <span className="rb-badge">
            <span className="rb-label">Whip</span>
            {Math.round(relationshipValue(game, 'chiefWhip'))}
          </span>
        </>
      )}
      {favours.length > 0 && (
        <span className="rb-badge" title={favours.map((f) => f.note).filter(Boolean).join('\n')}>
          <span className="rb-label">Favours</span>
          {favours.length}
        </span>
      )}
    </div>
  );
}
