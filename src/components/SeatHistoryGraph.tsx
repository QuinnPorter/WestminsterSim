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

/** A line graph of every party's seat count across the whole career: stepped lines
 *  (seats hold between elections, jump at each), a dot at each election, and the
 *  background tinted by whichever party governed during that stretch. */
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

  // only plot parties that ever held a meaningful number of seats (keeps it legible)
  const parties = (Object.keys(PARTIES) as PartyId[]).filter((p) =>
    points.some((pt) => (pt.seats[p] ?? 0) > 10)
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

  const stepPath = (p: PartyId): string => {
    let d = '';
    points.forEach((pt, i) => {
      const y = py(pt.seats[p] ?? 0);
      const xStart = px(pt.day), xEnd = px(segEnd(i));
      d += `${i === 0 ? 'M' : ' L'}${xStart.toFixed(1)},${y.toFixed(1)} L${xEnd.toFixed(1)},${y.toFixed(1)}`;
    });
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
          <path key={p} d={stepPath(p)} fill="none" stroke={PARTIES[p].colour}
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
