import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { applyElectionAftermath, compatibleCoalitionPartners } from '../career';
import { Rng } from '../rng';
import { Era, ElectionResult, GameState, PartyId } from '../../types/game';

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
