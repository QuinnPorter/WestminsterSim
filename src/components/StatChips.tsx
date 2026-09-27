import { useState } from 'react';
import { PlayerStats } from '../types/game';
import './StatChips.css';

// `short` is what a chip shows when the row is too narrow for the full word (a
// 320–360px phone); tapping the chip still names the stat in full
const STATS: { key: keyof PlayerStats; label: string; short: string; blurb: string }[] = [
  { key: 'profile', label: 'Profile', short: 'Prof', blurb: 'How well-known you are to the public and press. Opens doors — and draws fire.' },
  { key: 'partyStanding', label: 'Standing', short: 'Stand', blurb: 'Your stock within the parliamentary party. Drives promotions and survives reshuffles.' },
  { key: 'competence', label: 'Competence', short: 'Comp', blurb: 'How good you actually are at the job. Quietly decisive when posts are handed out.' },
  { key: 'constituencyApproval', label: 'Approval', short: 'Appr', blurb: 'How your constituents feel about you. Your shield when the national tide turns.' },
  { key: 'integrity', label: 'Integrity', short: 'Integ', blurb: 'Your record of principle. Slow to build, quick to spend, remembered at leadership time.' },
];

export function StatChips({ stats }: { stats: PlayerStats }) {
  const [open, setOpen] = useState<string | null>(null);
  const openStat = STATS.find((s) => s.key === open);
  return (
    <>
      <div className="statchips">
        {STATS.map((s) => (
          <button
            key={s.key}
            className="statchip"
            aria-label={`${s.label} ${Math.round(stats[s.key])}`}
            onClick={() => setOpen(open === s.key ? null : s.key)}
          >
            <span className="statchip-label">
              <span className="statchip-label-full">{s.label}</span>
              <span className="statchip-label-short">{s.short}</span>
            </span>
            <span className="statchip-bar">
              <span className="statchip-fill" style={{ width: `${stats[s.key]}%` }} />
            </span>
            <span className="statchip-value">{Math.round(stats[s.key])}</span>
          </button>
        ))}
      </div>
      {openStat && (
        <div className="statchip-sheet fade-in" onClick={() => setOpen(null)}>
          <strong>{openStat.label}: {Math.round(stats[openStat.key])}</strong>
          <p>{openStat.blurb}</p>
        </div>
      )}
    </>
  );
}
