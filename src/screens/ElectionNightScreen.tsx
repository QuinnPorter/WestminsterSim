import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setStage(0);
  }, [game.pendingElectionId]);

  if (!result) return null;

  return (
    <div className="screen election-night">
      <div className="en-banner">
        <span className="en-live">ELECTION NIGHT</span>
        <h2>{formatFull(result.date)}</h2>
      </div>

      {stage >= 0 && <ExitPoll result={result} />}
      {stage >= 1 && result.playerResult && <PlayerCount game={game} result={result} />}
      {stage >= 2 && <NationalPicture result={result} />}

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

function NationalPicture({ result }: { result: ElectionResult }) {
  const sorted = (Object.entries(result.seats) as [PartyId, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  return (
    <div className="card fade-in en-section">
      <h3 className="en-heading">All 650 seats declared</h3>
      {sorted.map(([p, n]) => (
        <ResultBar key={p} label={PARTIES[p].shortName} value={n} max={420} partyId={p} />
      ))}
      <p className="en-outcome" style={{ color: partyTextColour(result.governingParty) }}>
        {PARTIES[result.governingParty].name}{' '}
        {result.outcome === 'majority'
          ? 'wins a majority'
          : result.outcome === 'hung'
            ? 'largest party in a hung parliament'
            : 'to govern in a minority'}.
      </p>
    </div>
  );
}
