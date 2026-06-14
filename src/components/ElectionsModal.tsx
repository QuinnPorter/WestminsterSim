import { useEffect } from 'react';
import { GameState, PartyId } from '../types/game';
import { useUiStore } from '../store/uiStore';
import { PARTIES } from '../data/parties';
import { PartyBadge } from './PartyBadge';
import { formatMonthYear } from '../engine/clock';
import './PmHistoryModal.css';

const OUTCOME_LABEL: Record<string, string> = {
  majority: 'majority', minority: 'minority', hung: 'hung parliament',
};

/** A roll-call of every general election held, newest first — winner, outcome and
 *  the leading parties' seat counts. Opened from the Parliament screen. */
export function ElectionsModal({ game }: { game: GameState }) {
  const open = useUiStore((s) => s.electionsOpen);
  const close = () => useUiStore.getState().setElectionsOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const elections = Object.values(game.elections).sort((a, b) => b.date - a.date);

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="modal-title">General Elections</h3>
        <div className="pmh-list">
          {elections.map((e) => {
            const top = (Object.entries(e.seats) as [PartyId, number][])
              .filter(([p, n]) => (n ?? 0) > 0 && !!PARTIES[p])
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .slice(0, 5);
            return (
              <div key={e.id} className="pmh-row">
                <div className="pmh-main">
                  <span className="pmh-name">
                    {formatMonthYear(e.date)}
                    <PartyBadge partyId={e.governingParty} />
                  </span>
                  <span className="pmh-range">{OUTCOME_LABEL[e.outcome] ?? e.outcome}</span>
                </div>
                <span className="pmh-range" style={{ marginTop: 2 }}>
                  {top.map(([p, n]) => `${PARTIES[p].shortName} ${n}`).join(' · ')}
                </span>
              </div>
            );
          })}
          {elections.length === 0 && <p className="pmh-empty">No elections yet.</p>}
        </div>
        <div className="modal-actions">
          <button className="btn modal-confirm" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
