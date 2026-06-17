import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { applyElectionAftermath, compatibleCoalitionPartners, playerLeaderRole } from '../career';
import { Rng } from '../rng';
import { Era, ElectionResult, GameState, PartyId } from '../../types/game';

function lastLeaderRoleSide(g: GameState): string | undefined {
  for (let i = g.history.length - 1; i >= 0; i--) {
    const h = g.history[i];
    if (h.kind === 'roleChange' && h.officeId === 'leader') return h.roleSide;
  }
  return undefined;
}

function makeGame(partyId: PartyId = 'lab', era: Era = '2024', seed = 1234) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 40, region: 'yorkshire',
    background: 'teacher', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era, seed,
  };
  return createNewGame(input);
}

describe('wave 19 — PM who loses becomes LOO in the timeline', () => {
  it('records a Leader-of-the-Opposition span after a PM loses government', () => {
    const g = makeGame('lab', '2024', 7);
    // the player is the sitting Labour PM
    g.government.pmId = 'player';
    g.player.officeId = 'leader';
    g.history.push({
      kind: 'roleChange', date: g.day, officeId: 'leader', how: 'becamePM',
      roleSide: 'gov', partyId: 'lab',
    });

    // a result where the Conservatives win a majority and Labour is the runner-up
    const result: ElectionResult = {
      id: 'ge_test', date: g.day,
      seats: { con: 345, lab: 235, ld: 30, snp: 20, reform: 15, green: 5 } as GameState['seats'],
      voteShares: { con: 0.45, lab: 0.30, ld: 0.10, snp: 0.05, reform: 0.07, green: 0.03 },
      playerResult: null, outcome: 'majority', governingParty: 'con', playerHeldSeat: true,
    };
    g.seats = { ...result.seats };
    applyElectionAftermath(g, new Rng(5), result, true);

    expect(g.government.governingParty).toBe('con');
    expect(g.government.loId).toBe('player');           // the defeated PM now leads the opposition
    const leaderRC = g.history.filter((h) => h.kind === 'roleChange' && h.officeId === 'leader');
    expect(leaderRC.some((h) => h.kind === 'roleChange' && h.how === 'becamePM')).toBe(true);
    const last = leaderRC[leaderRC.length - 1];
    expect(last.kind === 'roleChange' && last.roleSide).toBe('opp'); // a fresh LOO span opened
  });
});

describe('wave 19 — leader demoted to a minor party is recorded in the timeline', () => {
  it('an LOO whose party falls to 3rd gets a minor-leader career span', () => {
    const g = makeGame('lab', '2024', 3);
    // the player is the Labour Leader of the Opposition; the Conservatives govern
    g.government.governingParty = 'con';
    g.government.oppositionParty = 'lab';
    g.government.loId = 'player';
    g.player.officeId = 'leader';
    g.history.push({
      kind: 'roleChange', date: g.day, officeId: 'leader', how: 'continued',
      roleSide: 'opp', partyId: 'lab',
    });

    // Labour collapses to third behind a surging Reform
    const result: ElectionResult = {
      id: 'ge', date: g.day,
      seats: { con: 330, reform: 200, lab: 90, ld: 20, snp: 8, green: 2 } as GameState['seats'],
      voteShares: { con: 0.42, reform: 0.28, lab: 0.18, ld: 0.08, snp: 0.03, green: 0.01 },
      playerResult: null, outcome: 'majority', governingParty: 'con', playerHeldSeat: true,
    };
    g.seats = { ...result.seats };
    applyElectionAftermath(g, new Rng(2), result, true);

    expect(playerLeaderRole(g)).toBe('minorLeader');     // live role: minor-party leader
    expect(g.government.oppositionParty).toBe('reform');  // opposition handed to Reform
    expect(g.government.loId).not.toBe('player');
    expect(lastLeaderRoleSide(g)).toBe('minor');          // timeline now matches the live role
  });
});

describe('wave 19 — coalition partner choice', () => {
  it('offers every compatible seated party, largest first, excluding opposed ones', () => {
    const partners = compatibleCoalitionPartners(
      { lab: 280, ld: 55, snp: 40, green: 12, con: 250 } as GameState['seats'], 'lab'
    );
    expect(partners).toEqual(['ld', 'snp', 'green']); // sorted by seats, Conservatives excluded
  });

  it('never offers an ideologically-banned partner', () => {
    const partners = compatibleCoalitionPartners(
      { lab: 280, reform: 120, ld: 20 } as GameState['seats'], 'lab'
    );
    expect(partners).not.toContain('reform'); // Labour + populist is banned
    expect(partners).toContain('ld');
  });
});
