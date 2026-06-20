import { GameState, PartyId } from '../types/game';
import { PARTIES, partyTextColour } from '../data/parties';
import { PARLIAMENTS, nationalTotals } from '../data/parliaments';
import { formatMonthYear } from '../engine/clock';

interface SeatPoint {
  day: number;
  seats: Partial<Record<PartyId, number>>;
  gov: PartyId;
  isElection: boolean;
}

/** A line graph of every party's seat count across the whole career: smooth lines
 *  easing between elections (a relaxed gradual rise/fall rather than hard steps), a
 *  dot at each election marking the true value, and the background tinted by
 *  whichever party governed during that stretch. */
export function SeatHistoryGraph({ game, width = 320, height = 172 }: {
  game: GameState; width?: number; height?: number;
}) {
  const start = PARLIAMENTS[game.startEra];
  const points: SeatPoint[] = [
    { day: game.startDay, seats: nationalTotals(start.matrix), gov: start.governingParty, isElection: false },
    ...Object.values(game.elections)
      .sort((a, b) => a.date - b.date)
      .map((e) => ({ day: e.date, seats: e.seats, gov: e.governingParty, isElection: true })),
  ];

  // plot every party that ever held a seat (start matrix or any election), not just the
  // big parties — so minor/NI parties (SNP, DUP, Plaid, Green, …) appear in every era
  const parties = (Object.keys(PARTIES) as PartyId[]).filter((p) =>
    points.some((pt) => (pt.seats[p] ?? 0) > 0)
  );

  const padL = 24, padR = 8, padT = 10, padB = 26;
  const x0 = game.startDay;
  const x1 = Math.max(game.day, x0 + 1);
  const span = x1 - x0;
  const maxEver = Math.max(0, ...points.flatMap((pt) => parties.map((p) => pt.seats[p] ?? 0)));
  const maxSeats = Math.max(350, Math.ceil(maxEver / 50) * 50);
  const px = (day: number) => padL + ((day - x0) / span) * (width - padL - padR);
  const py = (seats: number) => padT + (1 - seats / maxSeats) * (height - padT - padB);

  // each point's seats hold until the next point's day (the last runs to today)
  const segEnd = (i: number) => (i + 1 < points.length ? points[i + 1].day : x1);

  // smooth (Catmull-Rom → cubic-bézier) line easing through each election point, so
  // the trend reads as a gradual rise/fall instead of hard steps. The dots still mark
  // the true seat values; only the connecting line is stylised.
  const clampY = (y: number) => Math.max(padT, Math.min(height - padB, y));
  const TENSION = 0.7; // <1 keeps the curve relaxed (less overshoot / jitter)

  const smoothPath = (p: PartyId): string => {
    const pts = points.map((pt) => ({ x: px(pt.day), y: py(pt.seats[p] ?? 0) }));
    const tailX = px(x1);
    if (pts.length === 1) {
      // only the career-start point so far → a flat line to today
      return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L${tailX.toFixed(1)},${pts[0].y.toFixed(1)}`;
    }
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? pts[i + 1];
      const c1x = p1.x + ((p2.x - p0.x) * TENSION) / 6;
      const c1y = clampY(p1.y + ((p2.y - p0.y) * TENSION) / 6);
      const c2x = p2.x - ((p3.x - p1.x) * TENSION) / 6;
      const c2y = clampY(p2.y - ((p3.y - p1.y) * TENSION) / 6);
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    // the most recent election's seats hold to today: a flat tail
    const last = pts[pts.length - 1];
    if (tailX > last.x + 0.5) d += ` L${tailX.toFixed(1)},${last.y.toFixed(1)}`;
    return d;
  };

  const gridYs = [100, 200, 300].filter((s) => s < maxSeats);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Party seats over the course of the game">
        {/* who governed: a tinted band per inter-election stretch */}
        {points.map((pt, i) => {
          const xS = px(pt.day), xE = px(segEnd(i));
          return (
            <rect key={`bg${i}`} x={xS.toFixed(1)} y={padT} width={Math.max(0, xE - xS).toFixed(1)}
              height={height - padT - padB} fill={PARTIES[pt.gov].colour} opacity={0.12} />
          );
        })}
        {gridYs.map((s) => (
          <g key={s}>
            <line x1={padL} y1={py(s)} x2={width - padR} y2={py(s)} stroke="var(--line)" strokeWidth="1" />
            <text x={2} y={py(s) + 3} fontSize="8" fill="var(--muted)">{s}</text>
          </g>
        ))}
        {parties.map((p) => (
          <path key={p} d={smoothPath(p)} fill="none" stroke={PARTIES[p].colour}
            strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* a dot at each election, on each party's line */}
        {points.flatMap((pt, i) => (pt.isElection
          ? parties.map((p) => (
            <circle key={`m${i}-${p}`} cx={px(pt.day).toFixed(1)} cy={py(pt.seats[p] ?? 0).toFixed(1)}
              r={2.1} fill={PARTIES[p].colour} stroke="var(--surface)" strokeWidth="0.75" />
          ))
          : []))}
        <text x={padL} y={height - 6} fontSize="8" fill="var(--muted)">{formatMonthYear(x0)}</text>
        <text x={width - padR} y={height - 6} fontSize="8" fill="var(--muted)" textAnchor="end">{formatMonthYear(x1)}</text>
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
    </div>
  );
}
