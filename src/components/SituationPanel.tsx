import { useState } from 'react';
import { GameState, PartyId } from '../types/game';
import { PARTIES, partyTextColour } from '../data/parties';
import { partyPolling } from '../engine/polling';
import { playerIsPM } from '../engine/career';
import './SituationPanel.css';

/** A leader's-eye view: the player's party against the field (the governing party
 *  and the official opposition), plus a heave warning for a sitting PM. Rendered
 *  for any party leader — PM sees gov vs opp, the LO sees themselves vs the
 *  government, a minor-party leader sees their party plus the two largest. */
export function SituationPanel({ game }: { game: GameState }) {
  const [open, setOpen] = useState(true);

  const own = game.player.partyId;
  // "you vs the field": your party plus the two big benches, de-duplicated
  const parties = [...new Set<PartyId>([own, game.government.governingParty, game.government.oppositionParty])]
    .map((p) => ({ p, v: partyPolling(game, p) }))
    .sort((a, b) => b.v - a.v);
  const pollMax = Math.max(...parties.map((x) => x.v), 1);

  const plotting = playerIsPM(game) && (game.government.pmHeavePressure ?? 0) > 0;

  return (
    <div className="card sit-panel">
      <button className="sit-head" onClick={() => setOpen((o) => !o)}>
        <span>The Lie of the Land</span>
        <span className="sit-toggle">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="sit-body">
          <div className="sit-polls">
            {parties.map(({ p, v }) => (
              <PollLine key={p} label={PARTIES[p].shortName} value={v} max={pollMax} partyId={p} you={p === own} />
            ))}
          </div>

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
        {label}{you ? ' (You)' : ''}
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
