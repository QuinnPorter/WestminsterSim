import { useState } from 'react';
import { GameState, PartyId } from '../types/game';
import { PARTIES, partyTextColour } from '../data/parties';
import { partyPolling } from '../engine/polling';
import './SituationPanel.css';

/** A PM's-eye view: the government's polling against the official opposition, plus
 *  a warning when a heave against the leader is brewing. Only rendered when the
 *  player is Prime Minister. */
export function SituationPanel({ game }: { game: GameState }) {
  const [open, setOpen] = useState(true);

  const govParty = game.government.governingParty;
  const oppParty = game.government.oppositionParty;
  const govVal = partyPolling(game, govParty);
  const oppVal = partyPolling(game, oppParty);
  const pollMax = Math.max(govVal, oppVal, 1);

  const plotting = (game.government.pmHeavePressure ?? 0) > 0;

  return (
    <div className="card sit-panel">
      <button className="sit-head" onClick={() => setOpen((o) => !o)}>
        <span>The lie of the land</span>
        <span className="sit-toggle">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="sit-body">
          <div className="sit-polls">
            <PollLine label={PARTIES[govParty].shortName} value={govVal} max={pollMax} partyId={govParty} you />
            <PollLine label={PARTIES[oppParty].shortName} value={oppVal} max={pollMax} partyId={oppParty} />
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
