import { INTERLUDES } from '../engine/scheduler';

// The interludes that take a career out of the chamber fire on a side stream,
// but a hazard that fires changes the card drawn that tick, which the seeded
// regression tests (the Commons pin, the election balance, every seeded
// career) cannot absorb. They run with the interludes off; mayor.test.ts turns
// its own module instance back on.
INTERLUDES.mayorDraft = false;
