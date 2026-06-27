import { useEffect } from 'react';
import { GameState } from '../types/game';
import { useUiStore } from '../store/uiStore';
import { PARTIES } from '../data/parties';
import { PartyBadge } from './PartyBadge';
import { timelineRowsFromHistory } from '../screens/ProfileScreen';
import { formatMonthYear } from '../engine/clock';
import './PmHistoryModal.css';

/** The careers of past players whose worlds were carried on as a protégé — each
 *  mentor's record of office, newest mentor first. Opened from the Profile. */
export function MentorHistoryModal({ game }: { game: GameState }) {
  const open = useUiStore((s) => s.mentorHistoryOpen);
  const close = () => useUiStore.getState().setMentorHistoryOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const mentors = [...(game.mentors ?? [])].reverse();

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="modal-title">Your Mentors</h3>
        <div className="pmh-list">
          {mentors.map((m) => {
            const rows = timelineRowsFromHistory(game, m.career, m.retiredDay);
            return (
              <div key={m.id} className="pmh-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                <div className="pmh-main">
                  <span className="pmh-name">{m.name}<PartyBadge partyId={m.partyId} /></span>
                </div>
                <span className="pmh-range">
                  {PARTIES[m.partyId].shortName} · {m.legacy.highestOfficeTitle}
                </span>
                {rows.length > 0 && (
                  <div style={{ marginTop: 2 }}>
                    {rows.map((row, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', justifyContent: 'space-between', gap: 10,
                          padding: '3px 0', fontSize: 'var(--fs-xs)',
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{row.title}</span>
                        <span style={{ color: 'var(--muted)', flexShrink: 0 }}>
                          {formatMonthYear(row.start)} – {row.end ? formatMonthYear(row.end) : 'retirement'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {mentors.length === 0 && <p className="pmh-empty">No mentors yet.</p>}
        </div>
        <div className="modal-actions">
          <button className="btn modal-confirm" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
