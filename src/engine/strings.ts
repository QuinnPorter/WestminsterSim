/** small words kept lowercase in Title Case (unless they lead the phrase) */
const SMALL_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'nor', 'but', 'of', 'to', 'for', 'in', 'on',
  'at', 'by', 'with', 'vs', 'as', 'per',
]);

/** Title Case a label or short phrase: capitalise major words, keep small words
 *  (a/of/the/and…) lowercase unless they lead. Leaves prose/sentences alone — use
 *  only on labels, headers and generated descriptors. */
export function titleCase(s: string): string {
  const words = s.split(/\s+/);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i !== 0 && SMALL_WORDS.has(lower)) return lower;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}
