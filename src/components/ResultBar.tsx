import { PartyId } from '../types/game';
import { PARTIES, partyTextColour } from '../data/parties';

interface ResultBarProps {
  label: string;
  value: number;
  max: number;
  partyId: PartyId;
  /** text after the bar, defaults to value */
  display?: string;
}

export function ResultBar({ label, value, max, partyId, display }: ResultBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{
        width: 52, fontSize: 'var(--fs-xs)', fontWeight: 700,
        color: partyTextColour(partyId), flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: 14, background: 'var(--surface-2)',
        borderRadius: 7, overflow: 'hidden',
      }}>
        <div
          style={{
            width: `${Math.min(100, (value / max) * 100)}%`,
            height: '100%',
            background: PARTIES[partyId].colour,
            borderRadius: 7,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
      <span style={{ width: 44, fontSize: 'var(--fs-xs)', fontWeight: 700, textAlign: 'right' }}>
        {display ?? value}
      </span>
    </div>
  );
}
