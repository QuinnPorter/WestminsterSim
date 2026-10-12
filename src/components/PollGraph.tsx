import { GameState, PartyId, PollSnapshot } from '../types/game';
import { PARTIES, partyTextColour } from '../data/parties';
import { arenaPolledParties, onNiBallot } from '../engine/polling';
import { formatMonthYear } from '../engine/clock';

/** a small multi-line poll tracker for the current parliament */
export function PollGraph({ game, width = 320, height = 140 }: {
  game: GameState; width?: number; height?: number;
}) {
  const hist = game.pollHistory;
  const ni = onNiBallot(game);
  const shareOf = (s: PollSnapshot, p: PartyId): number => (ni ? s.ni?.[p] : s.shares[p]) ?? 0;
  const points = ni ? hist.filter((s) => s.ni) : hist;
  if (!points || points.length < 2) {
    return (
      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
        Not enough polling yet this parliament — check back in a few months.
      </p>
    );
  }

  // which parties to plot: the ballot's parties that poll meaningfully at any point
  const ballot = ni ? (game.polling.ni?.parties ?? []) : arenaPolledParties(game);
  const parties = ballot.filter((p) => points.some((s) => shareOf(s, p) > 0.03));

  const padL = 26, padR = 6, padT = 8, padB = 18;
  const x0 = points[0].day;
  const x1 = game.day;
  const span = Math.max(1, x1 - x0);
  const yMax = 0.55; // 55% ceiling
  const px = (day: number) => padL + ((day - x0) / span) * (width - padL - padR);
  const py = (share: number) => padT + (1 - share / yMax) * (height - padT - padB);

  const linesFor = (p: PartyId): string =>
    points.map((s, i) => `${i === 0 ? 'M' : 'L'}${px(s.day).toFixed(1)},${py(shareOf(s, p)).toFixed(1)}`).join(' ');

  const gridYs = [0.1, 0.2, 0.3, 0.4, 0.5];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={ni ? 'Northern Ireland polling since the last election' : 'Polling since the last election'}>
        {gridYs.map((g) => (
          <g key={g}>
            <line x1={padL} y1={py(g)} x2={width - padR} y2={py(g)} stroke="var(--line)" strokeWidth="1" />
            <text x={2} y={py(g) + 3} fontSize="8" fill="var(--muted)">{Math.round(g * 100)}</text>
          </g>
        ))}
        {parties.map((p) => (
          <path
            key={p}
            d={linesFor(p)}
            fill="none"
            stroke={PARTIES[p].colour}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        <text x={padL} y={height - 5} fontSize="8" fill="var(--muted)">{formatMonthYear(x0)}</text>
        <text x={width - padR} y={height - 5} fontSize="8" fill="var(--muted)" textAnchor="end">
          {formatMonthYear(x1)}
        </text>
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 6 }}>
        {parties.map((p) => (
          <span key={p} style={{
            fontSize: 'var(--fs-xs)', fontWeight: 700, color: partyTextColour(p),
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: PARTIES[p].colour }} />
            {PARTIES[p].shortName}
          </span>
        ))}
      </div>
      {ni && (
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
          Northern Ireland only — the GB parties do not stand here.
        </p>
      )}
    </div>
  );
}
