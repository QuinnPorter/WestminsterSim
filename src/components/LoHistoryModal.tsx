import { useEffect } from 'react';
import { GameState } from '../types/game';
import { useUiStore } from '../store/uiStore';
import { PartyBadge } from './PartyBadge';
import { formatMonthYear } from '../engine/clock';
import './PmHistoryModal.css';

/** A roll-call of every Leader of the Opposition this parliament has seen, newest
 *  first. Opened from the Parliament screen, mirroring the Prime Ministers modal. */
export function LoHistoryModal({ game }: { game: GameState }) {
  const open = useUiStore((s) => s.loHistoryOpen);
  const close = () => useUiStore.getState().setLoHistoryOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const tenures = [...(game.loHistory ?? [])].reverse();

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="modal-title">Leaders of the Opposition</h3>
        <div className="pmh-list">
          {tenures.map((t, i) => {
            const isPlayer = t.characterId === 'player';
            const range = t.endDay === null
              ? `${formatMonthYear(t.startDay)} – present`
              : `${formatMonthYear(t.startDay)} – ${formatMonthYear(t.endDay)}`;
            return (
              <div key={i} className={`pmh-row${isPlayer ? ' pmh-you' : ''}`}>
                <div className="pmh-main">
                  <span className="pmh-name">
                    {t.name}
                    {isPlayer && <span className="pmh-tag">YOU</span>}
                  </span>
                  <PartyBadge partyId={t.partyId} />
                </div>
                <span className="pmh-range">{range}</span>
              </div>
            );
          })}
          {tenures.length === 0 && (
            <p className="pmh-empty">No record of office.</p>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn modal-confirm" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
