/** The interludes that take a career out of the chamber: the mayoral draft and
 *  the party drafting a sitting mayor to lead it. Each is a rare hazard rolled
 *  on a side stream, but a hazard that fires changes the card drawn that tick,
 *  which no side stream can hide. Exported so the seeded regression tests can
 *  turn them off (src/test/setup.ts does, for every test file). */
export type InterludeId = 'mayorDraft' | 'outsideDraft';
export const INTERLUDES: Record<InterludeId, boolean> = { mayorDraft: true, outsideDraft: true };
