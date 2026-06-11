import { GameState } from '../types/game';
import { formatMonthYear } from '../engine/clock';
import { playerOfficeTitle } from '../engine/career';
import { partyTextColour } from '../data/parties';
import './TopBar.css';

export function TopBar({ game }: { game: GameState }) {
  const latestHeadline = [...game.history]
    .reverse()
    .find((h) => h.kind === 'event') as { headline: string } | undefined;

  return (
    <header className="topbar">
      <div className="topbar-row">
        <span className="topbar-date">{formatMonthYear(game.day)}</span>
        <span
          className="topbar-role"
          style={{ background: 'var(--party)', color: 'var(--party-ink)' }}
        >
          {game.player.hasSeat ? playerOfficeTitle(game) : 'Out of Parliament'}
        </span>
      </div>
      {latestHeadline && (
        <div className="topbar-ticker" style={{ color: partyTextColour(game.player.partyId) }}>
          <span className="topbar-ticker-tag">LATEST</span>
          <span className="topbar-ticker-text">{latestHeadline.headline}</span>
        </div>
      )}
    </header>
  );
}
