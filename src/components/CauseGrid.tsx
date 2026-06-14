import { CauseId } from '../types/game';
import { CAUSES } from '../data/causes';

export const MAX_CAUSES = 3;

/** toggle helper used by both the new-career Agenda step and the in-game editor */
export function toggleCause(causes: CauseId[], id: CauseId, max = MAX_CAUSES): CauseId[] {
  return causes.includes(id) ? causes.filter((c) => c !== id)
    : causes.length < max ? [...causes, id]
    : causes;
}

/** the selectable grid of causes, shared by career creation and the agenda editor.
 *  Reuses the `.nc-bgs` / `.nc-bg` card styling from the new-career screen. */
export function CauseGrid({ selected, onToggle, max = MAX_CAUSES }: {
  selected: CauseId[]; onToggle: (id: CauseId) => void; max?: number;
}) {
  return (
    <div className="nc-bgs">
      {CAUSES.map((c) => {
        const isSel = selected.includes(c.id);
        const atLimit = !isSel && selected.length >= max;
        return (
          <button
            key={c.id}
            className={`card nc-bg${isSel ? ' selected' : ''}`}
            style={{ opacity: atLimit ? 0.45 : 1 }}
            onClick={() => onToggle(c.id)}
          >
            <strong>{c.label}</strong>
            <span>{c.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
