import { GameState, PlayerStats } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { Avatar } from '../avatar/Avatar';
import { PARTIES } from '../data/parties';
import { CAUSES_BY_ID } from '../data/causes';

const REASON_TEXT: Record<string, string> = {
  retired: 'You left on your own terms — rarer than it sounds in this trade.',
  lostSeat: 'The voters wrote the final chapter, as they always could.',
  resigned: 'You walked away with your conscience intact.',
};

const STAT_ROWS: { key: keyof PlayerStats; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'partyStanding', label: 'Standing' },
  { key: 'competence', label: 'Competence' },
  { key: 'constituencyApproval', label: 'Approval' },
  { key: 'integrity', label: 'Integrity' },
];

export function GameOverScreen({ game }: { game: GameState }) {
  const abandonGame = useGameStore((s) => s.abandonGame);
  const setStarted = useUiStore((s) => s.setStarted);
  const setLanding = useUiStore((s) => s.setLanding);
  const legacy = game.gameOver!.legacy;

  const returnToMenu = () => {
    setStarted(false);
    setLanding('menu');
    abandonGame();
  };

  const causes = (legacy.causes ?? []).map((c) => CAUSES_BY_ID[c]?.label).filter(Boolean);

  return (
    <div className="screen" style={{ textAlign: 'center', paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <Avatar
          config={game.player.avatar}
          size={110}
          partyColour={PARTIES[game.player.partyId].colour}
        />
      </div>
      <h2 style={{ fontSize: 'var(--fs-xl)', marginBottom: 2 }}>{game.player.name}</h2>

      {legacy.rating && (
        <div style={{
          display: 'inline-block', margin: '6px 0 4px', padding: '3px 14px',
          borderRadius: 999, background: 'var(--party)', color: 'var(--party-ink)',
          fontWeight: 800, fontSize: 'var(--fs-sm)', letterSpacing: '0.02em',
        }}>
          {legacy.rating}
        </div>
      )}
      {legacy.verdict && (
        <p style={{ fontWeight: 600, marginBottom: 6 }}>{legacy.verdict}</p>
      )}
      <p style={{ color: 'var(--muted)', marginBottom: 18, fontSize: 'var(--fs-sm)' }}>
        {REASON_TEXT[game.gameOver!.reason]}
      </p>

      <div className="card" style={{ textAlign: 'left', marginBottom: 14 }}>
        <LegacyRow label="Years in public life" value={`${legacy.yearsServed}`} />
        <LegacyRow label="Highest office" value={legacy.highestOfficeTitle} />
        {legacy.becamePM && (legacy.pmStints ?? 0) > 0 && (
          <LegacyRow
            label="Spells as Prime Minister"
            value={`${legacy.pmStints}`}
          />
        )}
        <LegacyRow
          label="Elections won"
          value={legacy.electionsContested !== undefined
            ? `${legacy.electionsWon} of ${legacy.electionsContested}`
            : `${legacy.electionsWon}`}
        />
        {legacy.becameLeader && legacy.electionsWonAsLeader !== undefined && (
          <LegacyRow label="Elections won as leader" value={`${legacy.electionsWonAsLeader}`} />
        )}
        {legacy.leadershipContestsFought !== undefined && legacy.leadershipContestsFought > 0 && (
          <LegacyRow
            label="Leadership contests won"
            value={`${legacy.leadershipContestsWon ?? 0} of ${legacy.leadershipContestsFought}`}
          />
        )}
        {legacy.rebellions !== undefined && legacy.rebellions > 0 && (
          <LegacyRow label="Rebellions" value={`${legacy.rebellions}`} />
        )}
      </div>

      {legacy.finalStats && (
        <div className="card" style={{ textAlign: 'left', marginBottom: 14 }}>
          <h3 style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 8 }}>
            Final standing
          </h3>
          {STAT_ROWS.map(({ key, label }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
            }}>
              <span style={{
                width: 86, fontSize: 'var(--fs-xs)', color: 'var(--muted)', flexShrink: 0,
              }}>{label}</span>
              <span style={{
                flex: 1, height: 8, background: 'var(--surface-2)',
                borderRadius: 6, overflow: 'hidden',
              }}>
                <span style={{
                  display: 'block', height: '100%',
                  width: `${legacy.finalStats![key]}%`, background: 'var(--party)',
                }} />
              </span>
              <span style={{
                width: 26, textAlign: 'right', fontWeight: 700, fontSize: 'var(--fs-xs)',
              }}>{Math.round(legacy.finalStats![key])}</span>
            </div>
          ))}
        </div>
      )}

      {causes.length > 0 && (
        <div className="card" style={{ textAlign: 'left', marginBottom: 14 }}>
          <h3 style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 8 }}>
            Causes they fought for
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {causes.map((c) => (
              <span key={c} style={{
                fontSize: 'var(--fs-xs)', fontWeight: 700, padding: '4px 10px',
                borderRadius: 999, background: 'var(--surface-2)',
              }}>{c}</span>
            ))}
          </div>
        </div>
      )}

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

      <button className="btn btn-primary" onClick={returnToMenu}>
        Return to the menu
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
