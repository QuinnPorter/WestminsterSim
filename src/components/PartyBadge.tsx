import { PartyId } from '../types/game';
import { PARTIES, partyTextColour } from '../data/parties';

export function PartyBadge({ partyId, full = false }: { partyId: PartyId; full?: boolean }) {
  const party = PARTIES[partyId];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        color: partyTextColour(partyId),
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: party.colour,
          border: '1px solid rgba(0,0,0,0.12)',
          flexShrink: 0,
        }}
      />
      {full ? party.name : party.shortName}
    </span>
  );
}
