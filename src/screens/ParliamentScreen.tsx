import { GameState, PartyId } from '../types/game';
import { PARTIES, partyTextColour } from '../data/parties';
import { Hemicycle } from '../components/Hemicycle';
import { PollGraph } from '../components/PollGraph';
import { partyPolling } from '../engine/polling';
import { POLLED_PARTIES } from '../data/parties';

export function ParliamentScreen({ game }: { game: GameState }) {
  const sorted = (Object.entries(game.seats) as [PartyId, number][])
    .filter(([, n]) => (n ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  const gov = game.government;
  const sfSeats = game.seats.sf ?? 0;
  const workingTarget = Math.floor((650 - sfSeats - 1) / 2) + 1;
  const govSeats = game.seats[gov.governingParty] ?? 0;

  const polls = POLLED_PARTIES
    .map((p) => ({ p, v: partyPolling(game, p) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);

  return (
    <div className="screen">
      <h2 style={{ marginBottom: 4 }}>The House of Commons</h2>
      <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', marginBottom: 12 }}>
        {PARTIES[gov.governingParty].name}{' '}
        {gov.majority > 0 ? `majority of ${gov.majority}` : 'minority government'}
      </p>

      <div className="card" style={{ marginBottom: 12 }}>
        <Hemicycle seats={game.seats} />
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
          marginTop: 10, justifyContent: 'center',
        }}>
          {sorted.map(([p, n]) => (
            <span key={p} style={{
              fontSize: 'var(--fs-xs)', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: PARTIES[p].colour, border: '1px solid rgba(0,0,0,0.1)',
              }} />
              {PARTIES[p].shortName} {n}
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>Majority maths</h3>
        <div style={{
          height: 16, background: 'var(--surface-2)', borderRadius: 8,
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            width: `${(govSeats / 650) * 100}%`, height: '100%',
            background: PARTIES[gov.governingParty].colour,
          }} />
          <div style={{
            position: 'absolute', left: `${(workingTarget / 650) * 100}%`,
            top: 0, bottom: 0, width: 2, background: 'var(--ink)',
          }} />
        </div>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 6 }}>
          {govSeats} government seats · {workingTarget} needed to win votes
          {sfSeats > 0 ? ` (Sinn Féin's ${sfSeats} MPs don't take their seats)` : ''}
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>Latest polling</h3>
        {polls.map(({ p, v }) => (
          <div key={p} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '4px 0', fontSize: 'var(--fs-sm)',
          }}>
            <span style={{ fontWeight: 700, color: partyTextColour(p) }}>
              {PARTIES[p].shortName}
            </span>
            <span style={{ fontWeight: 700 }}>{v.toFixed(0)}%</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>Polling since the last election</h3>
        <PollGraph game={game} />
      </div>
    </div>
  );
}
