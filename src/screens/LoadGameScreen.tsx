import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { PARTIES } from '../data/parties';
import { playerOfficeTitle } from '../engine/career';
import './LoadGameScreen.css';

export function LoadGameScreen({ onBack }: { onBack: () => void }) {
  const game = useGameStore((s) => s.game);
  const slots = useGameStore((s) => s.slots);
  const loadSlot = useGameStore((s) => s.loadSlot);
  const deleteSlot = useGameStore((s) => s.deleteSlot);
  const setStarted = useUiStore((s) => s.setStarted);
  const requestConfirm = useUiStore((s) => s.requestConfirm);

  const continueGame = () => setStarted(true);
  const openSlot = (id: string) => {
    loadSlot(id);
    setStarted(true);
  };

  return (
    <div className="screen lg">
      <h2 className="lg-h">Load a game</h2>

      {game && (
        <button className="card lg-item lg-continue" onClick={continueGame}>
          <div className="lg-item-main">
            <strong>Continue</strong>
            <span>{game.player.name} — {playerOfficeTitle(game)}</span>
          </div>
          <span className="lg-go">›</span>
        </button>
      )}

      {slots.length > 0 && <p className="lg-subhead">Saved games</p>}
      {slots.map((s) => (
        <div key={s.id} className="card lg-item">
          <button className="lg-item-main lg-load" onClick={() => openSlot(s.id)}>
            <strong>{s.name}</strong>
            <span>
              {s.legacyLabel} · {PARTIES[s.game.player.partyId].shortName} ·{' '}
              {new Date(s.savedAt).toLocaleDateString()}
            </span>
          </button>
          <button
            className="lg-delete"
            aria-label={`Delete ${s.name}`}
            onClick={() =>
              requestConfirm({
                title: 'Delete this save?',
                message: `"${s.name}" will be permanently deleted.`,
                confirmLabel: 'Delete',
                danger: true,
                onConfirm: () => deleteSlot(s.id),
              })
            }
          >
            ✕
          </button>
        </div>
      ))}

      {!game && slots.length === 0 && (
        <p className="lg-empty">No saved games yet.</p>
      )}

      <button className="btn lg-back" onClick={onBack}>Back</button>
    </div>
  );
}
