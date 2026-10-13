import { GameDay, HistoryEntry } from '../types/game';

/** the history kinds recorded as paired start/end entries: the concurrent
 *  tracks of the career timeline */
type PairedKind = 'deputyOverlay' | 'committeeTenure' | 'mayoralty';
type PairedEntry = Extract<HistoryEntry, { action: 'start' | 'end' }>;
type EntryOf<K extends PairedKind> = Extract<PairedEntry, { kind: K }>;

/** Pair a track's start and end entries into spans, in order. A start with the
 *  previous span still open closes nothing (the open span is kept as it was);
 *  an open span at the end of the history runs to "now" (`end: null`). `open`
 *  copies what the span should carry from its start entry; `close` may add what
 *  the end entry carries. */
export function pairSpans<K extends PairedKind, S extends object>(
  history: HistoryEntry[], kind: K,
  open: (entry: EntryOf<K>) => S,
  close?: (span: S, entry: EntryOf<K>) => void
): (S & { start: GameDay; end: GameDay | null })[] {
  const spans: (S & { start: GameDay; end: GameDay | null })[] = [];
  let current: (S & { start: GameDay; end: GameDay | null }) | null = null;
  for (const raw of history) {
    if (raw.kind !== kind) continue;
    const entry = raw as PairedEntry;
    if (entry.action === 'start') {
      if (current) spans.push(current);
      current = { ...open(entry as EntryOf<K>), start: entry.date, end: null };
    } else if (current) {
      current.end = entry.date;
      close?.(current, entry as EntryOf<K>);
      spans.push(current);
      current = null;
    }
  }
  if (current) spans.push(current);
  return spans;
}
