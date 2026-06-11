import { useState } from 'react';
import { GameState, HistoryEntry, PartyId } from '../types/game';
import { PARTIES } from '../data/parties';
import { yearOf, formatMonthYear } from '../engine/clock';
import { playerOfficeLabel } from '../engine/career';
import { ResultBar } from '../components/ResultBar';

export function HistoryScreen({ game }: { game: GameState }) {
  const byYear = new Map<number, HistoryEntry[]>();
  for (const entry of game.history) {
    const y = yearOf(entry.date);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(entry);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <div className="screen">
      <h2 style={{ marginBottom: 14 }}>Your record</h2>
      {years.map((year) => (
        <div key={year} style={{ marginBottom: 16 }}>
          <h3 style={{
            fontSize: 'var(--fs-sm)', color: 'var(--muted)',
            marginBottom: 8, fontWeight: 800, letterSpacing: '0.04em',
          }}>
            {year}
          </h3>
          {byYear.get(year)!.slice().reverse().map((entry, i) => (
            <HistoryItem key={i} game={game} entry={entry} />
          ))}
        </div>
      ))}
    </div>
  );
}

function HistoryItem({ game, entry }: { game: GameState; entry: HistoryEntry }) {
  const [open, setOpen] = useState(false);

  if (entry.kind === 'election') {
    const result = game.elections[entry.resultId];
    if (!result) return null;
    const sorted = (Object.entries(result.seats) as [PartyId, number][])
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1]);
    return (
      <div className="card" style={{ marginBottom: 8, padding: 12 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{ width: '100%', textAlign: 'left', fontWeight: 700, fontSize: 'var(--fs-sm)' }}
        >
          🗳️ General election — {PARTIES[result.governingParty].shortName}{' '}
          {result.outcome === 'majority' ? 'majority' : 'minority'} ·{' '}
          {entry.heldSeat ? 'seat held' : 'seat lost'} {open ? '▾' : '▸'}
        </button>
        {open && (
          <div style={{ marginTop: 10 }}>
            {sorted.slice(0, 7).map(([p, n]) => (
              <ResultBar key={p} label={PARTIES[p].shortName} value={n} max={420} partyId={p} />
            ))}
          </div>
        )}
      </div>
    );
  }

  let icon = '•';
  let text = '';
  if (entry.kind === 'roleChange') {
    if (entry.how === 'becamePM') { icon = '👑'; text = 'Became Prime Minister'; }
    else if (entry.how === 'electedLeader') { icon = '🏆'; text = 'Elected party leader'; }
    else if (entry.officeId) {
      icon = '📋';
      const verb = entry.how === 'promoted' ? 'Promoted to'
        : entry.how === 'continued' ? 'Continued as'
        : 'Appointed';
      // party-aware, and historically correct for gov/shadow at that date
      text = `${verb} ${playerOfficeLabel(game, entry.officeId, entry.date)}`;
    } else {
      icon = entry.how === 'dismissed' ? '✂️' : entry.how === 'resigned' ? '✉️' : '↩️';
      text = entry.how === 'dismissed' ? 'Dismissed in a reshuffle'
        : entry.how === 'resigned' ? 'Resigned'
        : 'Returned to the backbenches';
    }
  } else if (entry.kind === 'event') {
    icon = '📰';
    text = entry.headline;
  } else if (entry.kind === 'enteredParliament') {
    icon = '🏛️';
    text = `Elected MP for ${entry.seatName}`;
  } else if (entry.kind === 'leadershipContest') {
    icon = entry.won ? '🏆' : '🥈';
    text = entry.won ? 'Won the party leadership' : 'Lost a leadership contest';
  }

  return (
    <div style={{
      display: 'flex', gap: 9, padding: '6px 4px',
      fontSize: 'var(--fs-sm)', alignItems: 'baseline',
    }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{text}</span>
      <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', flexShrink: 0 }}>
        {formatMonthYear(entry.date).split(' ')[0].slice(0, 3)}
      </span>
    </div>
  );
}
