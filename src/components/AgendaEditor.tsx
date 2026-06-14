import { useEffect, useState } from 'react';
import { GameState, CauseId } from '../types/game';
import { useUiStore } from '../store/uiStore';
import { useGameStore } from '../store/gameStore';
import { CauseGrid, toggleCause, MAX_CAUSES } from './CauseGrid';

/** In-game agenda editor: reopens the cause picker so the player can re-prioritise
 *  their causes (free, up to 3). Driven by the uiStore `agendaEditorOpen` flag. */
export function AgendaEditor({ game }: { game: GameState }) {
  const open = useUiStore((s) => s.agendaEditorOpen);
  const close = () => useUiStore.getState().setAgendaEditorOpen(false);
  const setCauses = useGameStore((s) => s.setCauses);

  const [draft, setDraft] = useState<CauseId[]>(game.player.causes ?? []);

  // re-seed the draft from the live causes whenever the modal opens
  useEffect(() => {
    if (open) setDraft(game.player.causes ?? []);
  }, [open, game.player.causes]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const save = () => { setCauses(draft); close(); };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="modal-title">Your agenda</h3>
        <p className="modal-message" style={{ marginBottom: 12 }}>
          Choose up to three causes to champion. {draft.length}/{MAX_CAUSES} chosen.
        </p>
        <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          <CauseGrid selected={draft} onToggle={(id) => setDraft((cs) => toggleCause(cs, id))} />
        </div>
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn modal-cancel" onClick={close}>Cancel</button>
          <button className="btn modal-confirm" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
