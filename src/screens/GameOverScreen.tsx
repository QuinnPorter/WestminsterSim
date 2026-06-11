import { GameState } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { Avatar } from '../avatar/Avatar';
import { PARTIES } from '../data/parties';

const REASON_TEXT: Record<string, string> = {
  retired: 'You left on your own terms — rarer than it sounds in this trade.',
  lostSeat: 'The voters wrote the final chapter, as they always could.',
  resigned: 'You walked away with your conscience intact.',
};

export function GameOverScreen({ game }: { game: GameState }) {
  const abandonGame = useGameStore((s) => s.abandonGame);
  const legacy = game.gameOver!.legacy;

  return (
    <div className="screen" style={{ textAlign: 'center', paddingTop: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <Avatar
          config={game.player.avatar}
          size={110}
          partyColour={PARTIES[game.player.partyId].colour}
        />
      </div>
      <h2 style={{ fontSize: 'var(--fs-xl)', marginBottom: 4 }}>{game.player.name}</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 18 }}>
        {REASON_TEXT[game.gameOver!.reason]}
      </p>

      <div className="card" style={{ textAlign: 'left', marginBottom: 14 }}>
        <LegacyRow label="Years in public life" value={`${legacy.yearsServed}`} />
        <LegacyRow label="Highest office" value={legacy.highestOfficeTitle} />
        <LegacyRow label="Elections won" value={`${legacy.electionsWon}`} />
      </div>

      {legacy.headlines.length > 0 && (
        <div className="card" style={{ textAlign: 'left', marginBottom: 18 }}>
          <h3 style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 8 }}>
            How they'll remember it
          </h3>
          {legacy.headlines.map((h, i) => (
            <p key={i} style={{ fontSize: 'var(--fs-sm)', padding: '4px 0', fontWeight: 600 }}>
              “{h}”
            </p>
          ))}
        </div>
      )}

      <button className="btn btn-primary" onClick={abandonGame}>
        Start a new career
      </button>
    </div>
  );
}

function LegacyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 12,
      padding: '7px 0', borderBottom: '1px solid var(--line)',
    }}>
      <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
