import { useEffect, useRef, useState } from 'react';
import { ElectionResult, GameState, PartyId } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { PARTIES, partyTextColour } from '../data/parties';
import { ResultBar } from '../components/ResultBar';
import { formatFull } from '../engine/clock';
import { totalSeats } from '../engine/seats';
import { chamberAt } from '../data/chambers';
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
  const house = totalSeats(result.seats);
  const devolved = (result.arena ?? 'uk') !== 'uk';
  return (
    <div className="card fade-in en-section">
      <h3 className="en-heading">{devolved ? 'The first declarations' : 'The exit poll'}</h3>
      <p className="en-sub">
        {devolved ? 'The polls close at ten and the count runs overnight. The broadcasters project:' : 'Big Ben strikes ten. The broadcasters project:'}{' '}
        <strong style={{ color: partyTextColour(result.governingParty) }}>
          {PARTIES[result.governingParty].name}
        </strong>{' '}
        {result.outcome === 'majority' ? 'majority' : 'short of a majority'}.
      </p>
      {sorted.map(([p, n]) => (
        <ResultBar key={p} label={PARTIES[p].shortName} value={n} max={devolved ? house : 420} partyId={p} />
      ))}
    </div>
  );
}

function PlayerCount({ game, result }: { game: GameState; result: ElectionResult }) {
  const pr = result.playerResult!;
  const held = pr.winnerPartyId === game.player.partyId;
  const chamber = chamberAt(result.arena ?? 'uk', result.date);
  const listSeat = pr.listRank !== undefined;
  let line: string;
  if (listSeat) {
    line = result.playerHeldSeat
      ? `Your party takes ${pr.partyListSeats} ${pr.partyListSeats === 1 ? 'seat' : 'seats'} here and you were ${ordinal(pr.listRank!)} on the list — you are returned.`
      : `Your party takes ${pr.partyListSeats ?? 0} ${pr.partyListSeats === 1 ? 'seat' : 'seats'} here and you were ${ordinal(pr.listRank!)} on the list — not enough.`;
  } else if (held) {
    line = `You are ${result.playerHeldSeat ? 're-elected' : 'elected'} — majority ${pr.majorityVotes.toLocaleString()}.`;
  } else if (pr.savedByList) {
    line = `Lost the constituency to the ${PARTIES[pr.winnerPartyId].shortName} candidate — but the regional list saves you, and you return as a list ${chamber.member}.`;
  } else {
    line = `Lost to the ${PARTIES[pr.winnerPartyId].shortName} candidate.`;
  }
  return (
    <div className="card fade-in en-section">
      <h3 className="en-heading">{pr.seatName}</h3>
      <p className="en-sub">
        {line}{' '}
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

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function NationalPicture({ game, result }: { game: GameState; result: ElectionResult }) {
  const sorted = (Object.entries(result.seats) as [PartyId, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const house = totalSeats(result.seats);
  const devolved = (result.arena ?? 'uk') !== 'uk';
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
      <h3 className="en-heading">All {house} seats declared</h3>
      {sorted.map(([p, n]) => (
        <ResultBar key={p} label={PARTIES[p].shortName} value={n} max={devolved ? house : 420} partyId={p} />
      ))}
      {result.listSeats && (
        <p className="en-sub" style={{ marginTop: 6 }}>
          Of which from the regional lists:{' '}
          {sorted.filter(([p]) => (result.listSeats?.[p] ?? 0) > 0)
            .map(([p]) => `${PARTIES[p].shortName} ${result.listSeats?.[p]}`).join(' · ')}
        </p>
      )}
      <p className="en-outcome" style={{ color: partyTextColour(result.governingParty) }}>
        {pending
          ? `Hung parliament — ${PARTIES[result.governingParty].name} set to govern, but short of a majority.`
          : `${PARTIES[result.governingParty].name} ${verdict}.`}
      </p>
    </div>
  );
}
