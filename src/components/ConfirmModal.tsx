import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';
import './ConfirmModal.css';

/** A single in-app confirmation dialog, driven by the UI store's `confirm`
 *  request. Rendered once at the App root; replaces native window.confirm. */
export function ConfirmModal() {
  const confirm = useUiStore((s) => s.confirm);
  const close = useUiStore((s) => s.closeConfirm);

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm, close]);

  if (!confirm) return null;

  const accept = () => {
    confirm.onConfirm();
    close();
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {confirm.title && <h3 className="modal-title">{confirm.title}</h3>}
        <p className="modal-message">{confirm.message}</p>
        <div className="modal-actions">
          <button className="btn modal-cancel" onClick={close}>Cancel</button>
          <button
            className={`btn modal-confirm${confirm.danger ? ' danger' : ''}`}
            onClick={accept}
          >
            {confirm.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
