import { useEffect, useRef, useState } from 'react';
import { ElectionResult, GameState, PartyId } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { PARTIES, partyTextColour } from '../data/parties';
import { ResultBar } from '../components/ResultBar';
import { formatFull } from '../engine/clock';
import './ElectionNightScreen.css';

/** staged reveal: exit poll → your count → national picture → outcome */
export function ElectionNightScreen({ game }: { game: GameState }) {
  const acknowledge = useGameStore((s) => s.acknowledgeElection);
  const result = game.elections[game.pendingElectionId!];
  const [stage, setStage] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStage(0);
  }, [game.pendingElectionId]);

  // each staged reveal appends content below; bring the view back to the top so the
  // player reads the new section from the start rather than being left at the bottom
  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0 });
  }, [stage]);

  if (!result) return null;

  return (
    <div className="screen election-night" ref={rootRef}>
      <div className="en-banner">
        <span className="en-live">ELECTION NIGHT</span>
        <h2>{formatFull(result.date)}</h2>
      </div>

      {stage >= 0 && <ExitPoll result={result} />}
      {stage >= 1 && result.playerResult && <PlayerCount game={game} result={result} />}
      {stage >= 2 && <NationalPicture game={game} result={result} />}

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={() => (stage < 2 ? setStage(stage + 1) : acknowledge())}
      >
        {stage === 0 ? 'To the count…' : stage === 1 ? 'The national picture' : 'Carry on'}
      </button>
    </div>
  );
}

function ExitPoll({ result }: { result: ElectionResult }) {
  const sorted = (Object.entries(result.seats) as [PartyId, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  return (
    <div className="card fade-in en-section">
      <h3 className="en-heading">The exit poll</h3>
      <p className="en-sub">
        Big Ben strikes ten. The broadcasters project:{' '}
        <strong style={{ color: partyTextColour(result.governingParty) }}>
          {PARTIES[result.governingParty].name}
        </strong>{' '}
        {result.outcome === 'majority' ? 'majority' : 'short of a majority'}.
      </p>
      {sorted.map(([p, n]) => (
        <ResultBar key={p} label={PARTIES[p].shortName} value={n} max={420} partyId={p} />
      ))}
    </div>
  );
}

function PlayerCount({ game, result }: { game: GameState; result: ElectionResult }) {
  const pr = result.playerResult!;
  const held = pr.winnerPartyId === game.player.partyId;
  return (
    <div className="card fade-in en-section">
      <h3 className="en-heading">{pr.seatName}</h3>
      <p className="en-sub">
        {held
          ? `You are ${result.playerHeldSeat ? 're-elected' : 'elected'} — majority ${pr.majorityVotes.toLocaleString()}.`
          : `Lost to the ${PARTIES[pr.winnerPartyId].shortName} candidate.`}{' '}
        Swing {pr.swing >= 0 ? '+' : ''}{pr.swing.toFixed(1)}% · Turnout {(pr.turnout * 100).toFixed(0)}%
      </p>
      <table className="en-table">
        <tbody>
          {pr.candidates.map((c) => (
            <tr key={c.partyId} className={c.partyId === game.player.partyId ? 'en-you' : ''}>
              <td>
                <span className="en-dot" style={{ background: PARTIES[c.partyId].colour }} />
                {c.name}
              </td>
              <td>{PARTIES[c.partyId].shortName}</td>
              <td style={{ textAlign: 'right' }}>{c.votes.toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>{(c.share * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NationalPicture({ game, result }: { game: GameState; result: ElectionResult }) {
  const sorted = (Object.entries(result.seats) as [PartyId, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const gov = game.government;
  // a player-led hung result hasn't been resolved yet (coalition talks are queued)
  const pending = game.forcedQueue.some(
    (e) => e.kind === 'coalitionTalks' || e.kind === 'coalitionOffer'
  );
  const partner = gov.coalitionPartner ?? gov.confidencePartner;
  let verdict: string;
  if (result.outcome === 'majority') {
    verdict = 'wins a majority';
  } else if (gov.arrangement === 'coalition' && partner) {
    verdict = `to govern in coalition with the ${PARTIES[partner].shortName}`;
  } else if (gov.arrangement === 'supplyConfidence' && partner) {
    verdict = `to govern with ${PARTIES[partner].shortName} confidence-and-supply`;
  } else {
    verdict = 'to govern as a minority';
  }
  return (
    <div className="card fade-in en-section">
      <h3 className="en-heading">All 650 seats declared</h3>
      {sorted.map(([p, n]) => (
        <ResultBar key={p} label={PARTIES[p].shortName} value={n} max={420} partyId={p} />
      ))}
      <p className="en-outcome" style={{ color: partyTextColour(result.governingParty) }}>
        {pending
          ? `Hung parliament — ${PARTIES[result.governingParty].name} set to govern, but short of a majority.`
          : `${PARTIES[result.governingParty].name} ${verdict}.`}
      </p>
    </div>
  );
}
