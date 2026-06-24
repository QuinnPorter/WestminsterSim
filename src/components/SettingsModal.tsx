import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';
import { APP_VERSION, PRIVACY_URL } from '../config';
import './ConfirmModal.css';

/** A small Settings panel: app version, privacy policy, and the fictional-content
 *  disclaimer. Opened from the discreet gear at the bottom of the Profile screen. */
export function SettingsModal() {
  const open = useUiStore((s) => s.settingsOpen);
  const close = () => useUiStore.getState().setSettingsOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="modal-title">Settings</h3>

        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 12,
          padding: '8px 0', borderBottom: '1px solid var(--line)',
        }}>
          <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>Version</span>
          <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>WestminsterSim v{APP_VERSION}</span>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 12,
          padding: '8px 0', borderBottom: '1px solid var(--line)',
        }}>
          <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>Privacy</span>
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--party)', textDecoration: 'underline' }}
          >
            Privacy Policy
          </a>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', lineHeight: 1.5, margin: '12px 0 0' }}>
          A political simulation game. All political figures and storylines are fictional; real party names
          are used for setting only. © Meridian Analytica LTD.
        </p>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn modal-confirm" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
