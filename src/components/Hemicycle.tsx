import { useMemo } from 'react';
import { PartyId } from '../types/game';
import { PARTIES } from '../data/parties';

interface HemicycleProps {
  seats: Partial<Record<PartyId, number>>;
  width?: number;
}

/** half-circle of 650 dots in concentric arcs, parties ordered left → right by ideology */
export function Hemicycle({ seats, width = 360 }: HemicycleProps) {
  const dots = useMemo(() => {
    const entries = (Object.entries(seats) as [PartyId, number][])
      .filter(([, n]) => (n ?? 0) > 0)
      .sort((a, b) => PARTIES[a[0]].ideology - PARTIES[b[0]].ideology);

    const total = entries.reduce((a, [, n]) => a + n, 0);
    // build seat positions: concentric arcs from inner to outer
    const rows = 11;
    const inner = 0.42;
    const positions: { x: number; y: number; angle: number }[] = [];
    let remaining = total;
    const perRowBase = total / rows;
    for (let r = 0; r < rows; r++) {
      const radius = inner + (1 - inner) * (r / (rows - 1));
      const count = r === rows - 1
        ? remaining
        : Math.min(remaining, Math.max(1, Math.round(perRowBase * (radius / ((1 + inner) / 2)))));
      remaining -= count;
      for (let i = 0; i < count; i++) {
        const angle = count === 1 ? Math.PI / 2 : Math.PI - (Math.PI * i) / (count - 1);
        positions.push({
          x: Math.cos(angle) * radius,
          y: -Math.sin(angle) * radius,
          angle,
        });
      }
      if (remaining <= 0) break;
    }
    // assign seats to positions sweeping left → right by angle
    positions.sort((a, b) => b.angle - a.angle || a.y - b.y);
    const result: { x: number; y: number; colour: string }[] = [];
    let idx = 0;
    for (const [party, n] of entries) {
      for (let i = 0; i < (n ?? 0) && idx < positions.length; i++, idx++) {
        result.push({
          x: positions[idx].x,
          y: positions[idx].y,
          colour: PARTIES[party].colour,
        });
      }
    }
    return result;
  }, [seats]);

  const h = width * 0.56;
  const cx = width / 2;
  const cy = h - 8;
  const scale = width * 0.46;

  return (
    <svg viewBox={`0 0 ${width} ${h}`} width="100%" aria-label="Composition of the House of Commons">
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={cx + d.x * scale}
          cy={cy + d.y * scale}
          r={width / 130}
          fill={d.colour}
        />
      ))}
    </svg>
  );
}
