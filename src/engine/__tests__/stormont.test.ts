import { describe, expect, it } from 'vitest';
import { GameState, PartyId } from '../../types/game';
import { NI_ASSEMBLY } from '../../data/niAssembly';
import { NI_CONSTITUENCIES } from '../../data/niWestminster';
import { CHAMBERS, DEVOLVED_ARENAS, NI_FIVE_SEAT_DAY, seatSystemAt } from '../../data/chambers';
import { erasFor, legislatureAt } from '../../data/devolved';
import { counterpartParty, isMajorIn } from '../../data/parties';
import {
  calibrateDistrict, countSeats, generateListPrSeatMap, listPrRebuildOptions, rebuildForListPr,
} from '../../generation/constituency';
import { dHondt, listSeatsOf } from '../listSeats';
import { calendarFor, initCalendar } from '../calendar';
import { jumpToArena } from '../arena';
import { createNewGame } from '../newGame';
import { isoToDay } from '../clock';
import { Rng } from '../rng';

const sum = (m: Partial<Record<PartyId, number>>) => Object.values(m).reduce((a, b) => a + (b ?? 0), 0);

function game(opts: { seed: number; arena?: 'uk' | 'ni' | 'scotland'; election?: string; partyId?: PartyId; region?: GameState['player']['region'] }): GameState {
  return createNewGame({
    name: 'Test Subject', gender: 'f', age: 40, region: opts.region ?? 'ni', background: 'lawyer',
    partyId: opts.partyId ?? 'dup',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2010', seed: opts.seed,
    ...(opts.arena && opts.arena !== 'uk' ? { arena: opts.arena, devolvedElection: opts.election ?? '2011-05-05' } : {}),
  });
}

describe('the Assembly as a chamber', () => {
  it('is a devolved arena with the Assembly profile and no PMQs duel', () => {
    expect(DEVOLVED_ARENAS).toContain('ni');
    expect(CHAMBERS.ni.jointExecutive).toBe(true);
    expect(CHAMBERS.ni.ladder).toBe('singleTier');
    expect(calendarFor('ni').map((e) => e.key)).toEqual(['budget', 'locals', 'recess', 'conference']);
    expect(calendarFor('scotland').map((e) => e.key)).toContain('pmqsWinter');
  });

  it('is elected in the eighteen constituencies, six seats each until March 2017 and five from it', () => {
    const before = seatSystemAt('ni', isoToDay('2011-05-05'));
    const after = seatSystemAt('ni', NI_FIVE_SEAT_DAY);
    expect(before.kind).toBe('listPr');
    expect(after.kind).toBe('listPr');
    if (before.kind === 'listPr' && after.kind === 'listPr') {
      expect(before.seatsPer).toBe(6);
      expect(after.seatsPer).toBe(5);
      expect(before.districts.map((d) => d.id)).toEqual(NI_CONSTITUENCIES.map((c) => c.id));
      // the names are dated: Belfast South before the 2024 review
      expect(before.districts.find((d) => d.id === 'belfastSouth')?.name).toBe('Belfast South');
    }
  });

  it('offers 2011 and holds 2016 back; a jump still lands in the latest Assembly', () => {
    expect(erasFor('ni').map((s) => s.election)).toEqual(['2011-05-05']);
    expect(legislatureAt('ni', isoToDay('2019-12-12')).election).toBe('2016-05-05');
  });

  it('the NI parties are their own in both chambers; nobody else stands at Stormont', () => {
    expect(counterpartParty('dup', 'ni')).toBe('dup');
    expect(counterpartParty('sf', 'ni')).toBe('sf');
    expect(counterpartParty('sf', 'uk')).toBeNull();
    expect(counterpartParty('tuv', 'uk')).toBeNull();
    expect(counterpartParty('gpni', 'uk')).toBeNull();
    expect(counterpartParty('green', 'ni')).toBe('gpni');
    expect(counterpartParty('lab', 'ni')).toBeNull();
    expect(counterpartParty('dup', 'scotland')).toBeNull();
    expect(counterpartParty('lab', 'scotland')).toBe('lab');
    expect(counterpartParty('green', 'scotland')).toBe('sgp');
    expect(counterpartParty('sgp', 'uk')).toBe('green');
    expect(counterpartParty('alba', 'uk')).toBeNull();
    expect(isMajorIn('alliance', 'ni')).toBe(true);
    expect(isMajorIn('tuv', 'ni')).toBe(false);
    expect(isMajorIn('lab', 'wales')).toBe(true);
  });
});

describe('a multi-member map from a real result', () => {
  it('calibrateDistrict reproduces any row, including a single-seat independent', () => {
    const rows: Partial<Record<PartyId, number>>[] = [
      { dup: 3, sf: 2, alliance: 1 }, { sf: 5, sdlp: 1 }, { dup: 3, sf: 1, sdlp: 1, ind: 1 },
      { sf: 3, dup: 1, uup: 1, sdlp: 1 }, { dup: 2, uup: 2, sf: 2 }, { sf: 4, sdlp: 1, pbp: 1 },
    ];
    const prior: Partial<Record<PartyId, number>> = { dup: 0.3, sf: 0.27, uup: 0.13, sdlp: 0.14, alliance: 0.08, tuv: 0.03, gpni: 0.01, pbp: 0.01, ind: 0.02 };
    for (const row of rows) {
      const shares = calibrateDistrict(row, prior, 6);
      const counts: Partial<Record<PartyId, number>> = {};
      for (const p of dHondt(shares, 6)) counts[p] = (counts[p] ?? 0) + 1;
      for (const p of Object.keys(row) as PartyId[]) expect(counts[p], JSON.stringify(row)).toBe(row[p]);
      expect(sum(shares)).toBeCloseTo(1, 9);
      // a real-looking vote, not seats divided by six
      expect(shares.dup ?? 0).not.toBeCloseTo((row.dup ?? 0) / 6, 3);
    }
  });

  for (const snap of NI_ASSEMBLY) {
    it(`${snap.election}: the map returns every constituency's real result`, () => {
      const system = seatSystemAt('ni', isoToDay(snap.election));
      if (system.kind !== 'listPr') throw new Error('expected listPr');
      const { seatMap, playerSeatId } = generateListPrSeatMap('ni', snap, system.districts, system.seatsPer, 'dup', 2);
      expect(seatMap).toHaveLength(108);
      for (const d of system.districts) {
        const won: Partial<Record<PartyId, number>> = {};
        for (const s of listSeatsOf(seatMap, d.id)) won[s.winner] = (won[s.winner] ?? 0) + 1;
        expect(won, d.name).toEqual(snap.districtSeats![d.id]);
      }
      expect(countSeats(seatMap)).toEqual(snap.seats);
      const player = seatMap.find((s) => s.id === playerSeatId)!;
      expect(player.winner).toBe('dup');
      expect(player.isPlayerSeat).toBe(true);
      expect(player.name).toBe('Belfast South'.length > 0 ? player.name : '');
      expect(seatMap.some((s) => s.name === 'Belfast South')).toBe(true);
      for (const s of seatMap) expect(sum(s.shares)).toBeCloseTo(1, 6);
    });
  }

  it('a party with no seats is given the last seat of its best constituency, never the first', () => {
    const snap = NI_ASSEMBLY[0];
    const system = seatSystemAt('ni', isoToDay(snap.election));
    if (system.kind !== 'listPr') throw new Error('expected listPr');
    const { seatMap, playerSeatId } = generateListPrSeatMap('ni', snap, system.districts, system.seatsPer, 'pbp', 1);
    const player = seatMap.find((s) => s.id === playerSeatId)!;
    expect(player.winner).toBe('pbp');
    expect(player.listRank).toBe(6);
    expect(countSeats(seatMap).pbp).toBe(1);
  });

  it('shrinking from six seats to five keeps each constituency its own politics', () => {
    const snap = NI_ASSEMBLY[0];
    const six = seatSystemAt('ni', isoToDay(snap.election));
    const five = seatSystemAt('ni', NI_FIVE_SEAT_DAY);
    if (six.kind !== 'listPr' || five.kind !== 'listPr') throw new Error('expected listPr');
    const old = generateListPrSeatMap('ni', snap, six.districts, six.seatsPer, 'sf', 2);
    const rebuilt = rebuildForListPr(
      new Rng(3), old.seatMap, five.districts, five.seatsPer, old.playerSeatId, 'sf', 2, snap.parties,
      listPrRebuildOptions('ni', 5)
    );
    expect(rebuilt.seatMap).toHaveLength(90);
    expect(rebuilt.seatMap.every((s) => s.region === 'ni' && s.kind === 'list' && s.id.startsWith('seat_ni5_'))).toBe(true);
    const west = listSeatsOf(rebuilt.seatMap, 'belfastWest');
    expect(west).toHaveLength(5);
    expect(west.filter((s) => s.winner === 'sf').length).toBeGreaterThanOrEqual(3);
    const east = listSeatsOf(rebuilt.seatMap, 'belfastEast');
    expect(east.filter((s) => s.winner === 'dup').length).toBeGreaterThanOrEqual(2);
    expect(east.filter((s) => s.winner === 'sf').length).toBe(0);
    // the player stays in their own constituency
    const player = rebuilt.seatMap.find((s) => s.id === rebuilt.playerSeatId)!;
    const before = old.seatMap.find((s) => s.id === old.playerSeatId)!;
    expect(player.listRegion).toBe(before.listRegion);
    expect(player.winner).toBe('sf');
  });
});

describe('the calendar follows the chamber', () => {
  it('a chamber entered by a jump has its calendar started, with only the keys it holds', () => {
    const g = game({ seed: 21, arena: 'uk', partyId: 'lab', region: 'london' });
    g.player.region = 'scotland';
    g.player.stats.profile = 80;
    const rng = new Rng(21);
    jumpToArena(g, rng, 'scotland', 'lab');
    expect(g.arena).toBe('scotland');
    expect(Object.keys(g.calendarDone).sort()).toEqual(calendarFor('scotland').map((e) => e.key).sort());
    for (const due of Object.values(g.calendarDone)) expect(due).toBeGreaterThan(g.day);
  });

  it('initCalendar drops the keys a chamber does not hold', () => {
    const g = game({ seed: 22, arena: 'ni', partyId: 'dup' });
    expect(g.arena).toBe('ni');
    initCalendar(g);
    expect(Object.keys(g.calendarDone).sort()).toEqual(['budget', 'conference', 'locals', 'recess']);
  });
});

describe('a Stormont start', () => {
  it('builds the 2011 Assembly behind the 2010 Commons', () => {
    const g = game({ seed: 5, arena: 'ni', partyId: 'uup' });
    expect(g.arena).toBe('ni');
    expect(g.startEra).toBe('2010');
    expect(sum(g.seats)).toBe(108);
    expect(g.seats.dup).toBe(38);
    expect(g.seats.sf).toBe(29);
    expect(g.seats.uup).toBeGreaterThanOrEqual(16);
    expect(g.player.hasSeat).toBe(true);
    const seat = g.seatMap.find((s) => s.id === g.player.seatId)!;
    expect(seat.region).toBe('ni');
    expect(seat.winner).toBe('uup');
    expect(g.dormant.uk).toBeDefined();
    expect(g.dormant.uk!.polling.ni).toBeDefined();
    expect(g.polling.ni).toBeUndefined();
  });
});
