import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { weightedExitRoles, ExitRole } from '../scheduler';
import { GameState, BackgroundId, OfficeId } from '../../types/game';

/** Fresh game with a chosen background; other fields tuned per-case below. */
function makeGame(background: BackgroundId = 'lawyer', seed = 1): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background, partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed, causes: [],
  };
  return createNewGame(input);
}

/** Fix `years` since entering parliament by back-dating enteredParliament. */
function setYears(g: GameState, years: number): void {
  g.player.enteredParliament = g.day - years * 365;
}

/** Record a department post ever held, via a roleChange history entry. */
function heldOffice(g: GameState, officeId: OfficeId): void {
  g.history.push({ kind: 'roleChange', date: g.day, officeId, how: 'appointed', roleSide: 'gov' });
}

/** Weight of a given role in the returned list (0 if the role was omitted). */
function weightOf(roles: { role: ExitRole; weight: number }[], role: ExitRole): number {
  return roles.find((r) => r.role === role)?.weight ?? 0;
}

/** The single highest-weight role, or null if the list is empty. */
function topRole(roles: { role: ExitRole; weight: number }[]): ExitRole | null {
  if (!roles.length) return null;
  return roles.reduce((a, b) => (b.weight > a.weight ? b : a)).role;
}

describe('weightedExitRoles', () => {
  it('an ex-Treasury career weights executive strictly above peerage', () => {
    const g = makeGame('lawyer');
    setYears(g, 25);
    g.player.stats.integrity = 80;
    g.player.stats.partyStanding = 80;
    heldOffice(g, 'sos_treasury');
    const roles = weightedExitRoles(g);
    expect(weightOf(roles, 'executive')).toBeGreaterThan(weightOf(roles, 'peerage'));
  });

  it('an ex-Foreign career weights international strictly above peerage', () => {
    const g = makeGame('foreignService');
    setYears(g, 25);
    g.player.stats.integrity = 80;
    g.player.stats.partyStanding = 80;
    heldOffice(g, 'sos_foreign');
    const roles = weightedExitRoles(g);
    expect(weightOf(roles, 'international')).toBeGreaterThan(weightOf(roles, 'peerage'));
  });

  it('an ex-Defence career weights international strictly above peerage', () => {
    const g = makeGame('military');
    setYears(g, 25);
    g.player.stats.integrity = 80;
    g.player.stats.partyStanding = 80;
    heldOffice(g, 'sos_defence');
    const roles = weightedExitRoles(g);
    expect(weightOf(roles, 'international')).toBeGreaterThan(weightOf(roles, 'peerage'));
  });

  it('a generic honourable long-server gets peerage as the single top role', () => {
    const g = makeGame('teacher');
    setYears(g, 25);
    g.player.stats.integrity = 70;
    g.player.stats.partyStanding = 70;
    g.player.flags._peakTier = 3;
    // a non-matching department ever held (no treasury/business/foreign/defence)
    heldOffice(g, 'sos_health');
    const roles = weightedExitRoles(g);
    expect(topRole(roles)).toBe('peerage');
  });

  it('is open to all: every 15-year career has non-zero executive AND international weight', () => {
    const g = makeGame('teacher');
    setYears(g, 15);
    g.player.stats.integrity = 40;
    g.player.stats.partyStanding = 40;
    g.player.flags._peakTier = 0;
    const roles = weightedExitRoles(g);
    expect(weightOf(roles, 'executive')).toBeGreaterThan(0);
    expect(weightOf(roles, 'international')).toBeGreaterThan(0);
  });

  describe('floors', () => {
    it('integrity <= 50 => no peerage entry', () => {
      const g = makeGame('teacher');
      setYears(g, 25);
      g.player.stats.integrity = 50;
      g.player.stats.partyStanding = 80;
      expect(weightOf(weightedExitRoles(g), 'peerage')).toBe(0);
    });

    it('standing <= 50 => no peerage entry', () => {
      const g = makeGame('teacher');
      setYears(g, 25);
      g.player.stats.integrity = 80;
      g.player.stats.partyStanding = 50;
      expect(weightOf(weightedExitRoles(g), 'peerage')).toBe(0);
    });

    it('years < 20 => no peerage entry', () => {
      const g = makeGame('teacher');
      setYears(g, 19);
      g.player.stats.integrity = 80;
      g.player.stats.partyStanding = 80;
      expect(weightOf(weightedExitRoles(g), 'peerage')).toBe(0);
    });

    it('integrity <= 65 => no university entry', () => {
      const g = makeGame('academic');
      setYears(g, 25);
      g.player.stats.integrity = 65;
      g.player.stats.partyStanding = 80;
      expect(weightOf(weightedExitRoles(g), 'university')).toBe(0);
    });

    it('years < 15 => weightedExitRoles returns an empty list', () => {
      const g = makeGame('lawyer');
      setYears(g, 14);
      g.player.stats.integrity = 80;
      g.player.stats.partyStanding = 80;
      expect(weightedExitRoles(g)).toEqual([]);
    });

    it('years >= 15 && integrity > 65 => a university entry exists', () => {
      const g = makeGame('teacher');
      setYears(g, 15);
      g.player.stats.integrity = 70;
      g.player.stats.partyStanding = 40;
      expect(weightOf(weightedExitRoles(g), 'university')).toBeGreaterThan(0);
    });
  });
});
