import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput, SAVE_VERSION } from '../newGame';
import {
  buildDevolvedArena, canJump, catchUpArena, freezeArena, homeNation, incomingSeniorityBonus,
  jumpPartyOptions, jumpTargets, jumpToArena, thawArena, JUMP_MIN_PROFILE, ukEraFor,
} from '../arena';
import {
  eligibilityScore, giveOffice, nextOfficeFor, playerOfficeTitle, playerTier, buildLegacy,
} from '../career';
import { migrateGameState } from '../../store/gameStore';
import {
  cabinetOfficesFor, OFFICES, officeArena, officeTitleIn, translateOffice,
} from '../../data/offices';
import {
  CHAMBERS, DEVOLVED_ARENAS, chamberAt, ministerialTitlesAt, SENEDD_RENAME_DAY, WELSH_CABSEC_DAY,
} from '../../data/chambers';
import { DEVOLVED_LEGISLATURES, legislatureAt } from '../../data/devolved';
import { HOLYROOD_CONSTITUENCIES, SENEDD_CONSTITUENCIES, SENEDD_2026_CONSTITUENCIES } from '../../data/devolvedSeats';
import { counterpartParty, PARTIES, partyNameIn } from '../../data/parties';
import { chamberVoice } from '../chamberVoice';
import { cardEligible } from '../cardEngine';
import { nextStep } from '../scheduler';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from '../turn';
import { DEVOLVED_CARDS } from '../../content/cards/devolved';
import { SCOTLAND_CARDS } from '../../content/cards/nations/scotland';
import { WALES_CARDS } from '../../content/cards/nations/wales';
import { ALL_CARDS } from '../../content/cards';
import { DevolvedArenaId, GameState, PartyId } from '../../types/game';
import { Rng } from '../rng';
import { isoToDay } from '../clock';

const BASE: CreationInput = {
  name: 'Test Player', gender: 'f', age: 40, region: 'scotland',
  background: 'lawyer', partyId: 'lab', era: '2019', seed: 12345,
  avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
};

function game(over: Partial<CreationInput> = {}): GameState {
  return createNewGame({ ...BASE, ...over });
}

/** put the player in a position where a jump is on the table */
function readyToJump(g: GameState, tier = 4, officeId = 'sos_health'): void {
  g.player.stats.profile = 70;
  g.player.flags._peakTier = tier;
  g.player.officeId = officeId;
}

const sum = (seats: Partial<Record<PartyId, number>>) =>
  Object.values(seats).reduce((a, b) => a + (b ?? 0), 0);

describe('devolved data', () => {
  const every = DEVOLVED_ARENAS.flatMap(
    (arena) => DEVOLVED_LEGISLATURES[arena].map((snap) => ({ arena, snap }))
  );
  const HOUSE: Record<DevolvedArenaId, number> = { scotland: 129, wales: 60 };

  it('every legislature seats exactly the House it had', () => {
    for (const { arena, snap } of every) {
      expect(sum(snap.seats), `${arena} ${snap.election}`).toBe(HOUSE[arena]);
      const constituencies = Object.values(snap.constituencySeats).reduce((a, r) => a + sum(r), 0);
      expect(constituencies, `${arena} ${snap.election} constituencies`).toBe(arena === 'scotland' ? 73 : 40);
      expect(sum(snap.listSeats), `${arena} ${snap.election} lists`).toBe(arena === 'scotland' ? 56 : 20);
      // constituencies + lists = the House, party by party
      for (const p of Object.keys(snap.seats) as PartyId[]) {
        const c = Object.values(snap.constituencySeats).reduce((a, r) => a + (r[p] ?? 0), 0);
        expect(c + (snap.listSeats[p] ?? 0), `${arena} ${snap.election} ${p}`).toBe(snap.seats[p]);
      }
    }
  });

  it('vote shares sum to about one, on both ballots', () => {
    for (const { arena, snap } of every) {
      const list = sum(snap.shares);
      const cons = sum(snap.constituencyShares);
      expect(list, `${arena} ${snap.election} list`).toBeGreaterThan(0.85);
      expect(list).toBeLessThanOrEqual(1.001);
      expect(cons, `${arena} ${snap.election} constituency`).toBeGreaterThan(0.85);
      expect(cons).toBeLessThanOrEqual(1.001);
    }
  });

  it('every party that won a seat was on the ballot, and the government won the most seats', () => {
    for (const { arena, snap } of every) {
      for (const p of Object.keys(snap.seats) as PartyId[]) {
        if (p === 'ind') continue;
        expect(snap.parties, `${arena} ${snap.election} ${p}`).toContain(p);
      }
      const ranked = (Object.entries(snap.seats) as [PartyId, number][]).sort((a, b) => b[1] - a[1]);
      expect(ranked[0][0]).toBe(snap.governing);
      expect(snap.opposition).not.toBe(snap.governing);
      expect(snap.seats[snap.opposition] ?? 0).toBeGreaterThan(0);
      expect(snap.arrangement === 'majority').toBe((snap.seats[snap.governing] ?? 0) * 2 > HOUSE[arena]);
    }
  });

  it('every party on a ballot has a share, and every share is on the ballot', () => {
    for (const { arena, snap } of every) {
      for (const p of snap.parties) {
        expect(snap.shares[p], `${arena} ${snap.election} ${p} list share`).toBeGreaterThan(0);
        expect(snap.constituencyShares[p], `${arena} ${snap.election} ${p} constituency share`).toBeGreaterThan(0);
      }
      for (const p of Object.keys(snap.shares) as PartyId[]) expect(snap.parties).toContain(p);
    }
  });

  it('devolved-only parties never stand for Westminster, and the UK parties keep one id', () => {
    expect(PARTIES.sgp.devolvedOnly).toBe('scotland');
    expect(PARTIES.alba.devolvedOnly).toBe('scotland');
    expect(counterpartParty('lab', 'scotland')).toBe('lab');
    expect(counterpartParty('con', 'wales')).toBe('con');
    expect(counterpartParty('green', 'scotland')).toBe('sgp');
    expect(counterpartParty('sgp', 'uk')).toBe('green');
    expect(counterpartParty('snp', 'wales')).toBeNull();
    expect(partyNameIn('lab', 'scotland')).toBe('Scottish Labour');
    expect(partyNameIn('con', 'wales')).toBe('Welsh Conservatives');
    expect(partyNameIn('snp', 'scotland')).toBe('Scottish National Party');
  });

  it('every region has a name for every constituency', () => {
    for (const [id, names] of Object.entries(HOLYROOD_CONSTITUENCIES)) {
      const region = CHAMBERS.scotland.regions; void region;
      expect(names.length, id).toBeGreaterThanOrEqual(8);
    }
    expect(Object.values(HOLYROOD_CONSTITUENCIES).flat()).toHaveLength(73);
    expect(Object.values(SENEDD_CONSTITUENCIES).flat()).toHaveLength(40);
    expect(SENEDD_2026_CONSTITUENCIES).toHaveLength(16);
  });

  it('legislatureAt picks the most recent result before the day, and never nothing', () => {
    expect(legislatureAt('scotland', isoToDay('2010-01-01')).election).toBe('2011-05-05');
    expect(legislatureAt('scotland', isoToDay('2019-12-17')).election).toBe('2016-05-05');
    expect(legislatureAt('wales', isoToDay('2024-07-09')).election).toBe('2021-05-06');
  });

  it('the Westminster parliament behind a devolved start is the one actually sitting', () => {
    expect(ukEraFor(isoToDay('2011-05-05'))).toBe('2010');
    expect(ukEraFor(isoToDay('2016-05-05'))).toBe('2015');
    expect(ukEraFor(isoToDay('2021-05-06'))).toBe('2019');
  });
});

describe('offices in a devolved chamber', () => {
  it('a devolved cabinet is Cabinet Secretaries plus the business manager, and smaller than Westminster', () => {
    for (const arena of DEVOLVED_ARENAS) {
      const roster = cabinetOfficesFor(arena);
      expect(roster.length).toBeLessThan(cabinetOfficesFor('uk').length);
      for (const id of roster) {
        expect(OFFICES[id], id).toBeDefined();
        expect(officeArena(id) === arena || id === 'chiefWhip', id).toBe(true);
      }
      expect(roster).toContain('chiefWhip');
    }
    // justice is devolved to Scotland and not to Wales
    expect(OFFICES.scotland_cabsec_justice).toBeDefined();
    expect(OFFICES.wales_cabsec_justice).toBeUndefined();
  });

  it('the ladder keeps its two ministerial tiers: a Minister under a Cabinet Secretary', () => {
    const pick = <T>(xs: T[]) => xs[0];
    expect(translateOffice('min_health', 'scotland', pick)).toBe('scotland_min_health');
    expect(translateOffice('sos_health', 'scotland', pick)).toBe('scotland_cabsec_health');
    expect(translateOffice('sos_treasury', 'wales', pick)).toBe('wales_cabsec_finance');
    expect(translateOffice('min_treasury', 'scotland', pick)).toBe('scotland_min_finance');
    expect(OFFICES.scotland_min_health.tier).toBe(3);
    expect(OFFICES.scotland_cabsec_health.tier).toBe(4);
  });

  it('Wales has no PLO rung; Scotland does', () => {
    const pick = <T>(xs: T[]) => xs[0];
    expect(translateOffice('pps', 'wales', pick)).toBeNull();
    expect(translateOffice('pps', 'scotland', pick)).toBe('pps');
    expect(officeTitleIn('pps', true, 'scotland')).toBe('Parliamentary Liaison Officer');
  });

  it('shared rungs keep their id and change their title', () => {
    const pick = <T>(xs: T[]) => xs[0];
    for (const id of ['leader', 'speaker', 'whip', 'chiefWhip']) {
      expect(translateOffice(id, 'scotland', pick)).toBe(id);
      expect(translateOffice(id, 'wales', pick)).toBe(id);
    }
    expect(officeTitleIn('leader', true, 'scotland')).toBe('First Minister');
    expect(officeTitleIn('speaker', true, 'scotland')).toBe('Presiding Officer');
    expect(officeTitleIn('speaker', true, 'wales')).toBe('Llywydd');
    expect(officeTitleIn('chiefWhip', true, 'scotland')).toBe('Minister for Parliamentary Business');
    expect(officeTitleIn('chiefWhip', true, 'wales')).toBe('Trefnydd and Chief Whip');
  });

  it('brings a devolved office back to Westminster at the same rank', () => {
    const pick = <T>(xs: T[]) => xs[0];
    expect(translateOffice('scotland_cabsec_finance', 'uk', pick)).toBe('sos_treasury');
    expect(translateOffice('scotland_min_health', 'uk', pick)).toBe('min_health');
    expect(translateOffice('wales_cabsec_socialJustice', 'uk', pick)).toBe('sos_dwp');
    // and a round trip keeps the rung
    const there = translateOffice('sos_education', 'wales', pick)!;
    expect(OFFICES[translateOffice(there, 'uk', pick)!].tier).toBe(4);
  });

  it('Welsh titles move with the calendar: Ministers became Cabinet Secretaries in March 2024', () => {
    expect(officeTitleIn('wales_cabsec_health', true, 'wales', WELSH_CABSEC_DAY - 1))
      .toBe('Minister for Health and Social Care');
    expect(officeTitleIn('wales_cabsec_health', true, 'wales', WELSH_CABSEC_DAY))
      .toBe('Cabinet Secretary for Health and Social Care');
    expect(officeTitleIn('wales_min_health', true, 'wales', WELSH_CABSEC_DAY - 1))
      .toBe('Deputy Minister for Health and Social Care');
    expect(officeTitleIn('wales_min_health', true, 'wales', WELSH_CABSEC_DAY))
      .toBe('Minister for Health and Social Care');
    expect(ministerialTitlesAt('scotland', 0).senior).toBe('Cabinet Secretary for');
  });

  it('Welsh members were AMs in the National Assembly until May 2020, and MSs in the Senedd after', () => {
    const before = chamberAt('wales', SENEDD_RENAME_DAY - 1);
    const after = chamberAt('wales', SENEDD_RENAME_DAY);
    expect(before.member).toBe('AM');
    expect(before.house).toBe('the National Assembly for Wales');
    expect(after.member).toBe('MS');
    expect(after.house).toBe('the Senedd');
    expect(chamberAt('scotland', 0).member).toBe('MSP');
  });

  it('never says Prime Minister in a devolved chamber, or First Minister in the Commons', () => {
    for (const arena of DEVOLVED_ARENAS) {
      for (const id of cabinetOfficesFor(arena)) {
        for (const inGov of [true, false]) {
          expect(officeTitleIn(id, inGov, arena)).not.toMatch(/Prime Minister|Secretary of State/);
        }
      }
    }
    expect(officeTitleIn('leader', true, 'uk')).toBe('Prime Minister');
    expect(officeTitleIn('sos_health', true, 'uk')).toBe('Health Secretary');
  });
});

describe("the chamber's voice", () => {
  it('rewrites Commons nouns and leaves the Scottish National Party alone', () => {
    const out = chamberVoice('scotland', 'The Prime Minister tells MPs in the Commons that the Scottish National Party has a nationwide problem. PMQs was brutal.');
    expect(out).toContain('First Minister');
    expect(out).toContain('MSPs');
    expect(out).toContain('Scottish National Party');
    expect(out).not.toMatch(/\bMPs\b|the Commons|Prime Minister|PMQs/);
    expect(out).toContain('FMQs');
    expect(out).not.toContain('Provincial');
  });
  it('uses the Welsh nouns in the Senedd', () => {
    const out = chamberVoice('wales', 'The Speaker calls the Chief Whip to Number 10.', isoToDay('2024-06-01'));
    expect(out).toContain('Llywydd');
    expect(out).toContain('Trefnydd');
    expect(out).toContain('Cathays Park');
  });
  it('uses the Welsh two-tier rank nouns as they stood on the day', () => {
    const before = chamberVoice('wales', 'A Secretary of State and a Minister of State met the Chancellor.', WELSH_CABSEC_DAY - 1);
    expect(before).toContain('A Minister and a Deputy Minister');
    expect(before).toContain('Finance Minister');
    const after = chamberVoice('wales', 'A Secretary of State and a Minister of State met the Chancellor.', WELSH_CABSEC_DAY);
    expect(after).toContain('A Cabinet Secretary and a Minister');
    expect(after).toContain('Finance Secretary');
    expect(chamberVoice('scotland', 'A Secretary of State and a Minister of State.', 0)).toContain('A Cabinet Secretary and a Minister');
  });
  it('is a no-op in the Commons', () => {
    expect(chamberVoice('uk', 'The Prime Minister tells MPs.')).toBe('The Prime Minister tells MPs.');
  });
});

describe('freeze / thaw', () => {
  it('round-trips the live chamber unchanged', () => {
    const g = game();
    const snap = freezeArena(g);
    const seats = g.seats;
    g.seats = {};
    thawArena(g, snap);
    expect(g.seats).toBe(seats);
    expect(g.arena).toBe('uk');
  });
});

describe('catching a dormant chamber up', () => {
  it('runs the elections that fell during the absence and leaves a coherent House', () => {
    const g = game();
    const start = g.day;
    const n = Object.keys(g.elections).length;
    catchUpArena(g, new Rng(1), g.day + 365 * 12);
    expect(Object.keys(g.elections).length).toBeGreaterThan(n);
    expect(sum(g.seats)).toBe(g.seatMap.length);
    expect(g.seats[g.government.governingParty] ?? 0).toBeGreaterThan(0);
    expect(g.characters[g.government.pmId]).toBeDefined();
    expect(g.history.some((h) => h.kind === 'event' && h.date > start)).toBe(true);
    expect(g.day).toBe(start);
  });
  it('does not disturb the player: no ghost result is recorded', () => {
    const g = game();
    catchUpArena(g, new Rng(7), g.day + 365 * 9);
    for (const r of Object.values(g.elections)) {
      expect(r.playerResult).toBeNull();
      expect(r.playerHeldSeat).toBe(false);
    }
  });
  it('a dormant Holyrood keeps its fixed five-year calendar', () => {
    const g = game({ arena: 'scotland', devolvedElection: '2016-05-05', partyId: 'snp' });
    const before = g.nextElectionBy;
    expect(before).toBe(isoToDay('2021-05-06'));
    catchUpArena(g, new Rng(2), isoToDay('2027-01-01'));
    expect(g.nextElectionBy).toBe(isoToDay('2031-05-01'));
    expect(Object.values(g.elections).filter((e) => e.arena === 'scotland')).toHaveLength(2);
  });
});

describe('a devolved start', () => {
  it('seats the player at Holyrood with the Commons frozen behind them', () => {
    const g = game({ arena: 'scotland', devolvedElection: '2021-05-06', partyId: 'snp' });
    expect(g.arena).toBe('scotland');
    expect(g.startEra).toBe('2019');
    expect(g.day).toBe(isoToDay('2021-05-06'));
    expect(g.player.partyId).toBe('snp');
    expect(g.player.hasSeat).toBe(true);
    expect(sum(g.seats)).toBe(129);
    expect(g.seats.snp).toBe(64);
    expect(g.government.governingParty).toBe('snp');
    expect(g.government.oppositionParty).toBe('con');
    expect(g.government.arrangement).toBe('minority');
    expect(g.dormant.uk).toBeDefined();
    expect(sum(g.dormant.uk!.seats)).toBe(650);
    expect(g.nextElectionBy).toBe(isoToDay('2026-05-07'));
    expect(playerOfficeTitle(g)).toBe('Backbench MSP');
    expect(homeNation(g)).toBe('scotland');
  });
  it('seats a Welsh Labour member in the 2016 Assembly as an AM', () => {
    const g = game({ arena: 'wales', region: 'wales', devolvedElection: '2016-05-05', partyId: 'lab' });
    expect(sum(g.seats)).toBe(60);
    expect(g.seats.lab).toBe(29);
    expect(g.seats.ukip).toBe(7);
    expect(playerOfficeTitle(g)).toBe('Backbench AM');
    expect(g.startEra).toBe('2015');
  });
  it('a Westminster-only career is unchanged', () => {
    const g = game();
    expect(g.arena).toBe('uk');
    expect(g.dormant).toEqual({});
    expect(sum(g.seats)).toBe(650);
    expect(playerOfficeTitle(g)).toBe('Backbench MP');
  });
});

describe('the jump', () => {
  it('is gated on profile and on a cooldown', () => {
    const g = game();
    g.player.stats.profile = JUMP_MIN_PROFILE - 1;
    expect(canJump(g)).toBe(false);
    g.player.stats.profile = JUMP_MIN_PROFILE;
    expect(canJump(g)).toBe(true);
    g.player.flags._lastJumpDay = g.day;
    expect(canJump(g)).toBe(false);
  });

  it('offers only the home nation, and only its parties', () => {
    expect(jumpTargets(game({ region: 'scotland' }))).toEqual(['scotland']);
    expect(jumpTargets(game({ region: 'wales' }))).toEqual(['wales']);
    expect(jumpTargets(game({ region: 'yorkshire' }))).toEqual([]);
    expect(canJump(game({ region: 'yorkshire' }))).toBe(false);
    const g = game({ region: 'scotland' });
    const options = jumpPartyOptions(g, 'scotland');
    expect(options[0]).toBe('lab');
    expect(options).toContain('snp');
    expect(options).toContain('sgp');
    expect(options).not.toContain('pc');
  });

  it('carries everything whole except standing with a group that has never met you', () => {
    const g = game();
    readyToJump(g);
    g.player.stats = {
      profile: 80, competence: 80, integrity: 70, partyStanding: 90, constituencyApproval: 90,
    };
    jumpToArena(g, new Rng(5), 'scotland', 'lab');
    expect(g.arena).toBe('scotland');
    expect(g.player.stats.integrity).toBe(70);
    expect(g.player.stats.profile).toBe(80);
    expect(g.player.stats.competence).toBe(80);
    expect(g.player.stats.constituencyApproval).toBe(90);
    expect(g.player.stats.partyStanding).toBeGreaterThanOrEqual(49);
    expect(g.player.stats.partyStanding).toBeLessThanOrEqual(56);
    expect(g.player.partyId).toBe('lab');
    expect(g.player.hasSeat).toBe(true);
    expect(g.player.officeId).toBeNull();
    expect(sum(g.seats)).toBe(129);
    expect(g.dormant.uk).toBeDefined();
    expect(sum(g.dormant.uk!.seats)).toBe(650);
    expect(g.player.flags._homeNation).toBe('scotland');
    expect(g.player.flags._incomingTier).toBe(4);
  });

  it('a Scottish Labour MP who moves to Holyrood is still Labour, and gets a seat Labour can hold', () => {
    const g = game();
    readyToJump(g);
    jumpToArena(g, new Rng(5), 'scotland', 'lab');
    const seat = g.seatMap.find((s) => s.id === g.player.seatId)!;
    expect(seat.isPlayerSeat).toBe(true);
    expect(seat.winner).toBe('lab');
    expect(g.player.region).toBe('scotland');
  });

  it('promotes onto the new ladder, never the old one', () => {
    const g = game();
    readyToJump(g);
    jumpToArena(g, new Rng(5), 'scotland', 'lab');
    g.player.stats = { profile: 90, competence: 90, integrity: 70, partyStanding: 90, constituencyApproval: 80 };
    for (let i = 0; i < 20; i++) {
      const next = nextOfficeFor(g, new Rng(i));
      if (next) expect(officeArena(next) === 'scotland' || ['pps', 'whip', 'chiefWhip', 'leader'].includes(next), next).toBe(true);
    }
    giveOffice(g, new Rng(1), 'sos_health', 'appointed');
    expect(g.player.officeId).toBe('scotland_cabsec_health');
    expect(playerTier(g)).toBe(4);
  });

  it('banks incoming seniority taken from the peak, decaying over six years', () => {
    const g = game();
    readyToJump(g, 5, 'sos_health');
    jumpToArena(g, new Rng(5), 'scotland', 'lab');
    const fresh = incomingSeniorityBonus(g);
    expect(fresh).toBe(17);
    expect(eligibilityScore(g, 'scotland_cabsec_health')).toBeGreaterThan(fresh);
    g.day += 365 * 7;
    expect(incomingSeniorityBonus(g)).toBe(0);
  });

  it('comes home: a return thaws the Commons and catches it up', () => {
    const g = game();
    readyToJump(g);
    jumpToArena(g, new Rng(5), 'scotland', 'lab');
    g.day += 365 * 6;
    g.player.flags._lastJumpDay = 0;
    g.player.stats.profile = 70;
    expect(jumpTargets(g)).toEqual(['uk']);
    jumpToArena(g, new Rng(6), 'uk', 'lab');
    expect(g.arena).toBe('uk');
    expect(sum(g.seats)).toBe(650);
    expect(g.dormant.scotland).toBeDefined();
    expect(Object.values(g.elections).some((e) => e.arena === 'uk')).toBe(true);
    const seat = g.seatMap.find((s) => s.id === g.player.seatId)!;
    expect(seat.region).toBe('scotland');
  });

  it('keeps every chamber’s election results distinct, and the dormant chamber’s people apart', () => {
    const g = game();
    readyToJump(g);
    const ukChars = Object.keys(g.characters);
    jumpToArena(g, new Rng(5), 'scotland', 'lab');
    for (const id of Object.keys(g.characters)) {
      // only the portable contacts come across
      if (ukChars.includes(id)) {
        const rel = g.relationships.find((r) => r.characterId === id);
        expect(rel && ['mentor', 'journalist'].includes(rel.kind)).toBe(true);
      }
    }
    expect(g.relationships.some((r) => r.kind === 'leader')).toBe(true);
    expect(g.relationships.some((r) => r.kind === 'rival')).toBe(true);
  });

  it('builds a chamber whose first election day is already past by fighting the elections since', () => {
    const g = game({ era: '2024', region: 'wales' });
    g.day = isoToDay('2027-03-01');
    readyToJump(g);
    jumpToArena(g, new Rng(9), 'wales', 'lab');
    expect(g.arena).toBe('wales');
    // the 2026 election was fought on the way in, under the new system
    expect(sum(g.seats)).toBe(96);
    expect(g.nextElectionBy).toBe(isoToDay('2031-05-01'));
    expect(g.player.hasSeat).toBe(true);
  });
});

describe('chamber card gating', () => {
  it('an unmarked card is Westminster-only, and the devolved decks are not', () => {
    const g = game();
    const unmarked = ALL_CARDS.filter((c) => !c.requires?.arena);
    expect(unmarked.length).toBeGreaterThan(300);
    expect(DEVOLVED_CARDS.length).toBeGreaterThanOrEqual(20);
    expect(SCOTLAND_CARDS.length).toBeGreaterThanOrEqual(8);
    expect(WALES_CARDS.length).toBeGreaterThanOrEqual(8);
    expect(DEVOLVED_CARDS.some((c) => cardEligible(g, c))).toBe(false);
    readyToJump(g);
    jumpToArena(g, new Rng(5), 'scotland', 'lab');
    expect(unmarked.some((c) => cardEligible(g, c))).toBe(false);
    expect(DEVOLVED_CARDS.filter((c) => cardEligible(g, c)).length).toBeGreaterThan(3);
    expect(SCOTLAND_CARDS.some((c) => cardEligible(g, c))).toBe(true);
    expect(WALES_CARDS.some((c) => cardEligible(g, c))).toBe(false);
  });
  it('every devolved card declares its chambers and uses the token nouns rather than Commons ones', () => {
    for (const c of [...DEVOLVED_CARDS, ...SCOTLAND_CARDS, ...WALES_CARDS]) {
      expect(c.requires?.arena?.length, c.id).toBeGreaterThan(0);
      expect(c.requires?.arena, c.id).not.toContain('uk');
    }
    for (const c of DEVOLVED_CARDS) {
      const text = [c.title, c.body, ...c.choices.flatMap((ch) => [ch.label, typeof ch.outcomeText === 'string' ? ch.outcomeText : ''])].join(' ');
      expect(text, c.id).not.toMatch(/\bMSPs?\b|\bMSs?\b|Holyrood|Senedd|Bute House/);
    }
  });
  it('a long devolved career never shows a generated card with a Commons-only noun', () => {
    const g = game({ arena: 'scotland', devolvedElection: '2016-05-05', partyId: 'snp', seed: 77 });
    const rng = new Rng(77);
    let shown = 0;
    for (let turn = 0; turn < 250 && !g.gameOver; turn++) {
      if (!g.currentCard) nextStep(g, rng);
      const card = g.currentCard;
      if (!card) break;
      // the recruitment cards are ABOUT Westminster and keep its vocabulary on purpose
      if (card.kind !== 'normal' && card.kind !== 'electionNight' && card.kind !== 'ukRecruit' && card.kind !== 'devolvedDraft') {
        const text = `${card.title} ${card.body} ${card.choices.map((c) => c.label).join(' ')}`;
        expect(text, `${card.kind} turn ${turn}`).not.toMatch(/\bMPs\b|House of Commons|\bthe Commons\b|Prime Minister’s Questions|\bPMQs\b/);
        shown++;
      }
      // answer and move on — declining Westminster's offer, so the career stays put
      if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
      resolveChoiceCore(g, rng, card.kind === 'ukRecruit' ? 1 : 0);
      expect(g.arena).toBe('scotland');
      if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
      continueCore(g, rng);
    }
    expect(shown).toBeGreaterThan(5);
  });
});

describe('save migration', () => {
  it('treats a pre-v10 save as a career lived entirely in the Commons', () => {
    const g = game();
    const old = JSON.parse(JSON.stringify(g)) as GameState & Record<string, unknown>;
    delete (old as Record<string, unknown>).arena;
    delete (old as Record<string, unknown>).dormant;
    delete (old as Record<string, unknown>).anchorShares;
    delete (old as Record<string, unknown>).polledParties;
    old.version = 9;
    const migrated = migrateGameState(old as GameState);
    expect(migrated.arena).toBe('uk');
    expect(migrated.dormant).toEqual({});
    expect(migrated.polledParties).toBeDefined();
    expect(migrated.anchorShares).toBeDefined();
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(10);
  });
});

describe('the legacy remembers a nation', () => {
  it('a First Minister is a First Minister on the end screen, not a Prime Minister', () => {
    const g = game({ arena: 'scotland', devolvedElection: '2021-05-06', partyId: 'snp' });
    g.history.push({
      kind: 'roleChange', arena: 'scotland', date: g.day, officeId: 'leader', how: 'becamePM',
      roleSide: 'gov', partyId: 'snp',
    });
    g.pmHistory.push({ characterId: 'player', name: g.player.name, partyId: 'snp', startDay: g.day, endDay: null });
    g.day += 365 * 3;
    const legacy = buildLegacy(g);
    expect(legacy.highestOfficeTitle).toBe('First Minister of Scotland');
    expect(legacy.headOfGovernmentTitle).toBe('First Minister');
    expect(legacy.wasFirstMinister).toBe(true);
    expect(legacy.rating).toBe('First Minister');
    expect(legacy.arenasServed).toEqual(['scotland']);
    expect(legacy.verdict).not.toContain('Prime Minister');
  });
  it('a purely Westminster career is not retroactively devolved', () => {
    const g = game();
    const legacy = buildLegacy(g);
    expect(legacy.wasFirstMinister).toBe(false);
    expect(legacy.arenasServed).toEqual(['uk']);
    expect(legacy.highestOfficeTitle).toBe('Backbench MP');
  });
});

describe('building a devolved legislature', () => {
  it('matches the real composition the player walks into', () => {
    const g = game({ region: 'wales' });
    g.day = isoToDay('2017-01-01');
    const { snapshot } = buildDevolvedArena(g, new Rng(3), 'wales', 'lab');
    expect(sum(snapshot.seats)).toBe(60);
    expect(snapshot.seats.lab).toBe(29);
    expect(snapshot.seats.pc).toBe(12);
    expect(snapshot.seats.ukip).toBe(7);
    expect(snapshot.government.governingParty).toBe('lab');
    expect(snapshot.nextElectionBy).toBe(isoToDay('2021-05-06'));
    expect(snapshot.government.cabinet.length).toBe(cabinetOfficesFor('wales').length);
    expect(snapshot.polledParties).toEqual(legislatureAt('wales', g.day).parties);
  });
});
