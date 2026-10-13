import { INTERLUDES, InterludeId } from '../engine/scheduler';

// The interludes that take a career out of the chamber fire on a side stream,
// but a hazard that fires changes the card drawn that tick, which the seeded
// regression tests (the Commons pin, the election balance, every seeded
// career) cannot absorb. They run with the interludes off; each test file gets
// its own module graph, so mayor.test.ts turns its own back on.
for (const k of Object.keys(INTERLUDES) as InterludeId[]) INTERLUDES[k] = false;
