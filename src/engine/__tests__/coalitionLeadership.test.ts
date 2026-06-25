import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  seatPlayerJuniorPartner, withdrawFromCoalitionCore, dissolveCoalition,
  resolveNpcLeadership, buildLegacy, playerIsLeader, materializeForced, resolveForcedChoice,
} from '../career';
import { timelineRows } from '../../screens/ProfileScreen';
import { Rng } from '../rng';
import { GameState, ElectionResult } from '../../types/game';

function makeGame(seed: number, partyId: CreationInput['partyId'] = 'con'): GameState {
  return createNewGame({
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  });
}

describe('scandal resignation has its own follow-up', () => {
  it('offers Resign / Cling on, and clinging on is severe + exposed', () => {
    const g = makeGame(1);
    const rng = new Rng(11);
    g.player.officeId = 'sos_health';
    const card = materializeForced(g, rng, { kind: 'resignPrompt', payload: { reason: 'scandal' } });
    expect(card.choices.map((c) => c.label)).toEqual(['Resign your office', 'Cling on anyway']);
    expect(card.title).toBe('The reckoning');

    // cling on (index 1): keep the office but take a severe hit and become "exposed"
    const standingBefore = g.player.stats.partyStanding;
    resolveForcedChoice(g, rng, card, 1);
    expect(g.player.officeId).toBe('sos_health');
    expect(g.player.stats.partyStanding).toBeLessThan(standingBefore - 10);
    expect(typeof g.player.flags._scandalExposed).toBe('number');
  });

  it('resigning (index 0) strips the office', () => {
    const g = makeGame(2);
    const rng = new Rng(22);
    g.player.officeId = 'sos_health';
    const card = materializeForced(g, rng, { kind: 'resignPrompt', payload: { reason: 'scandal' } });
    resolveForcedChoice(g, rng, card, 0);
    expect(g.player.officeId).toBeNull();
  });
});

/** put the player in a Con-led coalition as the LD junior-partner leader */
function makeJuniorPartner(seed: number): { g: GameState; rng: Rng } {
  const g = makeGame(seed);
  const rng = new Rng(seed * 5 + 3);
  g.player.partyId = 'ld';
  g.player.officeId = 'leader';
  g.player.hasSeat = true;
  g.government.governingParty = 'con';
  g.government.arrangement = 'coalition';
  g.government.coalitionPartner = 'ld';
  g.seats = { con: 306, ld: 57, lab: 258, snp: 6, sf: 5 };
  return { g, rng };
}

describe('junior-coalition leader shows Leader of [Party] + government role', () => {
  it('records both a "Leader of the Liberal Democrats" span and a concurrent gov-role overlay', () => {
    const { g, rng } = makeJuniorPartner(3);
    seatPlayerJuniorPartner(g, rng);
    expect(playerIsLeader(g)).toBe(true);
    const titles = timelineRows(g).map((r) => r.title);
    expect(titles).toContain('Leader of the Liberal Democrats');
    // the government role is on the concurrent overlay track (DPM here, ≥15 seats)
    expect(titles).toContain('Deputy Prime Minister');
  });
});

describe('withdraw from coalition', () => {
  it('junior partner: drops to minority, player keeps the leadership but loses the gov role', () => {
    const { g, rng } = makeJuniorPartner(4);
    seatPlayerJuniorPartner(g, rng);
    expect(g.government.arrangement).toBe('coalition');

    withdrawFromCoalitionCore(g, rng);
    expect(g.government.arrangement).toBe('minority');
    expect(g.government.coalitionPartner).toBeUndefined();
    expect(playerIsLeader(g)).toBe(true);          // still party leader
    expect(g.player.flags._isDeputyPM).toBeFalsy(); // gov role gone
    expect(g.player.flags._govOverlayOpen).toBeFalsy();
  });

  it('senior PM (dissolveCoalition) keeps the player as PM and ends the coalition', () => {
    const g = makeGame(5);
    const rng = new Rng(55);
    g.player.officeId = 'leader';
    g.government.governingParty = g.player.partyId; // con
    g.government.pmId = 'player';
    g.government.arrangement = 'coalition';
    g.government.coalitionPartner = 'ld';
    g.seats = { con: 300, ld: 50, lab: 250, sf: 5 };
    dissolveCoalition(g, rng);
    expect(g.government.arrangement).toBe('minority');
    expect(g.government.coalitionPartner).toBeUndefined();
    expect(g.government.pmId).toBe('player'); // player stays PM
  });
});

describe('no silent leader switches', () => {
  it('an NPC taking a minor party leadership is recorded in the news feed', () => {
    const g = makeGame(6);
    const rng = new Rng(66);
    // green is neither the government, the official opposition, nor a coalition partner
    const before = g.history.filter((h) => h.kind === 'event').length;
    resolveNpcLeadership(g, rng, 'green');
    const events = g.history.filter((h) => h.kind === 'event') as { headline: string }[];
    expect(events.length).toBeGreaterThan(before);
    expect(events.some((e) => /leader of the Green/i.test(e.headline))).toBe(true);
  });
});

describe('legacy elections count only the current character', () => {
  it('excludes elections held before the character entered Parliament', () => {
    const g = makeGame(7);
    g.player.enteredParliament = 1000;
    const mk = (id: string, date: number, held: boolean, contested = true): ElectionResult => ({
      id, date, seats: {}, voteShares: {}, playerResult: contested ? ({} as never) : null,
      outcome: 'majority', governingParty: 'con', playerHeldSeat: held,
    });
    g.elections = {
      a: mk('a', 400, true),         // a mentor's win — must NOT count
      b: mk('b', 1500, true),        // this character's win
      c: mk('c', 1800, false, true), // this character contested but lost the seat
    };
    const legacy = buildLegacy(g);
    expect(legacy.electionsWon).toBe(1);
    expect(legacy.electionsContested).toBe(2);
  });
});
