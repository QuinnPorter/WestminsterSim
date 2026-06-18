import { useEffect } from 'react';
import { GameState } from '../types/game';
import { useUiStore } from '../store/uiStore';
import { SeatHistoryGraph } from './SeatHistoryGraph';
import './PmHistoryModal.css';

/** Break-out from the Parliament screen: a line graph of party seat counts across
 *  the whole career, with the background tinted by who was governing. */
export function SeatHistoryModal({ game }: { game: GameState }) {
  const open = useUiStore((s) => s.seatHistoryOpen);
  const close = () => useUiStore.getState().setSeatHistoryOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="modal-title">Seats over time</h3>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', margin: '0 0 10px', lineHeight: 1.4 }}>
          Party seat counts since the start of your career, with a dot at each election. The shaded
          background shows who was governing.
        </p>
        <SeatHistoryGraph game={game} />
        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button className="btn modal-confirm" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
