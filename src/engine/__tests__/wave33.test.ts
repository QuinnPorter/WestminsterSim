import { describe, expect, it } from 'vitest';
import { buildOfficeSpans } from '../../screens/ProfileScreen';
import { GameState } from '../../types/game';

const ev = (date: number, headline: string) => ({ kind: 'event' as const, date, headline });
const rc = (date: number, officeId: string, how: string, extra: object = {}) =>
  ({ kind: 'roleChange' as const, date, officeId, how, ...extra });

describe('wave 33 — a re-elected Speaker is one continuous profile entry', () => {
  it('merges consecutive same-role "continued" Speaker terms into a single span', () => {
    const history = [
      rc(100, 'speaker', 'appointed'),
      ev(200, 'parliament dissolved'),
      rc(300, 'speaker', 'continued'), // re-elected
      ev(400, 'parliament dissolved'),
      rc(500, 'speaker', 'continued'), // re-elected again
    ] as unknown as GameState['history'];
    const speaker = buildOfficeSpans(history).filter((s) => s.officeId === 'speaker');
    expect(speaker).toHaveLength(1);
    expect(speaker[0].start).toBe(100);
    expect(speaker[0].end).toBeNull(); // still in the Chair, one unbroken span
  });

  it('does NOT merge a same-office continuation whose label changed (coalition leader)', () => {
    const history = [
      rc(100, 'leader', 'electedLeader', { roleSide: 'opp', partyId: 'ld' }),
      rc(200, 'leader', 'continued', { roleSide: 'gov', partyId: 'ld', label: 'Deputy Prime Minister' }),
    ] as unknown as GameState['history'];
    // two distinct roles: Leader of the Opposition, then the coalition Deputy PM job
    expect(buildOfficeSpans(history)).toHaveLength(2);
  });
});
