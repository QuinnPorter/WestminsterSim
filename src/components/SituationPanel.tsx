import { useState } from 'react';
import { GameState, PartyId, RelationshipKind } from '../types/game';
import { PARTIES, partyTextColour, polledPartiesForEra } from '../data/parties';
import { partyPolling } from '../engine/polling';
import { getRelationship, relationshipValue, characterName } from '../engine/relationships';
import { PartyBadge } from './PartyBadge';
import './SituationPanel.css';

function tempFace(v: number): string {
  return v >= 25 ? '🙂' : v <= -25 ? '😠' : '😐';
}

/** A glanceable read of where the player stands: the clock to the next election,
 *  their polling against the strongest rival party, the temperature of the key
 *  relationships, who their named rival/ally are, and any favours in the bank. */
export function SituationPanel({ game }: { game: GameState }) {
  const [open, setOpen] = useState(true);

  const ownParty = game.player.partyId;
  const own = partyPolling(game, ownParty);
  // strongest polled party that isn't the player's own
  const rivalParty = polledPartiesForEra(game.startEra)
    .filter((p) => p !== ownParty)
    .map((p) => ({ p, v: partyPolling(game, p) }))
    .sort((a, b) => b.v - a.v)[0];
  const pollMax = Math.max(own, rivalParty?.v ?? 0, 1);

  const daysToElection = Math.max(0, game.nextElectionBy - game.day);
  const monthsToElection = Math.round(daysToElection / 30);
  const electionText =
    daysToElection <= 0 ? 'overdue'
    : monthsToElection <= 1 ? 'within a month'
    : monthsToElection < 24 ? `~${monthsToElection} months`
    : `~${Math.round(monthsToElection / 12)} years`;

  const leaderVal = relationshipValue(game, 'leader');
  const whipVal = relationshipValue(game, 'chiefWhip');
  const playerIsLeader = game.player.officeId === 'leader';

  const namedRel = (kind: RelationshipKind) => {
    const rel = getRelationship(game, kind);
    if (!rel || rel.characterId === 'player') return null;
    const c = game.characters[rel.characterId];
    if (!c || !c.active) return null;
    return { name: characterName(game, rel.characterId), partyId: c.partyId as PartyId, value: rel.value };
  };
  const rival = namedRel('rival');
  const ally = namedRel('ally');

  const favours = game.player.favours ?? [];

  // plot watch: brewing trouble for a leader, or a restless party around a non-leader
  const plotting = playerIsLeader
    ? (game.government.pmHeavePressure ?? 0) > 0
    : leaderVal < -25 && game.player.stats.profile > 55;

  return (
    <div className="card sit-panel">
      <button className="sit-head" onClick={() => setOpen((o) => !o)}>
        <span>The lie of the land</span>
        <span className="sit-toggle">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="sit-body">
          <div className="sit-row">
            <span className="sit-label">Next election</span>
            <span className="sit-value">{electionText}</span>
          </div>

          <div className="sit-polls">
            <PollLine label={PARTIES[ownParty].shortName} value={own} max={pollMax} partyId={ownParty} you />
            {rivalParty && (
              <PollLine
                label={PARTIES[rivalParty.p].shortName}
                value={rivalParty.v}
                max={pollMax}
                partyId={rivalParty.p}
              />
            )}
          </div>

          <div className="sit-rels">
            <span className="sit-chip">
              <span className="sit-chip-label">Leader</span>
              {tempFace(leaderVal)} {Math.round(leaderVal)}
            </span>
            <span className="sit-chip">
              <span className="sit-chip-label">Whip</span>
              {tempFace(whipVal)} {Math.round(whipVal)}
            </span>
            {favours.length > 0 && (
              <span className="sit-chip sit-favour" title={favours.map((f) => f.note).join('\n')}>
                <span className="sit-chip-label">Favours</span>
                ⭐ {favours.length}
              </span>
            )}
          </div>

          {(rival || ally) && (
            <div className="sit-people">
              {rival && (
                <span className="sit-person">
                  <span className="sit-person-role">Rival</span>
                  {rival.name} <PartyBadge partyId={rival.partyId} />
                </span>
              )}
              {ally && (
                <span className="sit-person">
                  <span className="sit-person-role">Ally</span>
                  {ally.name} <PartyBadge partyId={ally.partyId} />
                </span>
              )}
            </div>
          )}

          {plotting && (
            <p className="sit-plot">⚠ The corridors are restless — a challenge may be brewing.</p>
          )}
        </div>
      )}
    </div>
  );
}

function PollLine({ label, value, max, partyId, you }: {
  label: string; value: number; max: number; partyId: PartyId; you?: boolean;
}) {
  return (
    <div className="sit-poll">
      <span className="sit-poll-label" style={{ color: partyTextColour(partyId) }}>
        {label}{you ? ' (you)' : ''}
      </span>
      <span className="sit-poll-track">
        <span
          className="sit-poll-fill"
          style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: PARTIES[partyId].colour }}
        />
      </span>
      <span className="sit-poll-val">{value.toFixed(0)}%</span>
    </div>
  );
}
