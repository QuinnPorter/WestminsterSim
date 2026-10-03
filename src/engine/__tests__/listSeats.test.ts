import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { dHondt } from '../listSeats';
import { runElection } from '../election';
import { Rng } from '../rng';
import { isoToDay } from '../clock';
import { DEVOLVED_LEGISLATURES } from '../../data/devolved';
import { HOLYROOD_REGIONS, SENEDD_REGIONS } from '../../data/devolvedSeats';
import { SENEDD_EXPANSION_DAY, seatSystemAt, firstThursdayInMay, nextFixedElectionDay } from '../../data/chambers';
import { generateDevolvedSeatMap, countSeats } from '../../generation/constituency';
import { DevolvedArenaId, GameState, PartyId } from '../../types/game';

const BASE: CreationInput = {
  name: 'Test Player', gender: 'f', age: 40, region: 'scotland',
  background: 'lawyer', partyId: 'snp', era: '2019', seed: 4242,
  avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
};

function holyrood(over: Partial<CreationInput> = {}): GameState {
  return createNewGame({ ...BASE, arena: 'scotland', devolvedElection: '2021-05-06', ...over });
}
function senedd(over: Partial<CreationInput> = {}): GameState {
  return createNewGame({
    ...BASE, region: 'wales', partyId: 'lab', arena: 'wales', devolvedElection: '2021-05-06', ...over,
  });
}

const sum = (seats: Partial<Record<PartyId, number>>) =>
  Object.values(seats).reduce((a, b) => a + (b ?? 0), 0);

describe("d'Hondt", () => {
  it('allocates highest averages, counting constituency seats in the divisor', () => {
    // Glasgow 2021: the SNP swept all nine constituencies, so its list divisor
    // starts at ten and it wins nothing from the seven list seats
    const order = dHondt(
      { snp: 0.40, lab: 0.24, con: 0.12, sgp: 0.13, ld: 0.03, alba: 0.03 }, 7, { snp: 9 }
    );
    expect(order).toHaveLength(7);
    expect(order.filter((p) => p === 'snp')).toHaveLength(0);
    expect(order.filter((p) => p === 'lab').length).toBeGreaterThanOrEqual(3);
    expect(order.filter((p) => p === 'sgp').length).toBeGreaterThanOrEqual(1);
  });

  it('from a standing start is proportional', () => {
    const order = dHondt({ lab: 0.40, con: 0.30, pc: 0.20, ld: 0.10 }, 6);
    expect(order.filter((p) => p === 'lab')).toHaveLength(3);
    expect(order.filter((p) => p === 'con')).toHaveLength(2);
    expect(order.filter((p) => p === 'pc')).toHaveLength(1);
  });

  it('is deterministic on ties', () => {
    const a = dHondt({ lab: 0.5, con: 0.5 }, 3);
    const b = dHondt({ lab: 0.5, con: 0.5 }, 3);
    expect(a).toEqual(b);
  });
});

describe('the fixed calendar', () => {
  it('finds the first Thursday in May', () => {
    expect(firstThursdayInMay(2021)).toBe(isoToDay('2021-05-06'));
    expect(firstThursdayInMay(2026)).toBe(isoToDay('2026-05-07'));
    expect(firstThursdayInMay(2016)).toBe(isoToDay('2016-05-05'));
  });
  it('schedules the next election five years on', () => {
    expect(nextFixedElectionDay(isoToDay('2021-05-06'))).toBe(isoToDay('2026-05-07'));
    expect(nextFixedElectionDay(isoToDay('2016-05-05'))).toBe(isoToDay('2021-05-06'));
  });
  it('the Senedd changes its voting system at the 2026 election', () => {
    expect(seatSystemAt('wales', SENEDD_EXPANSION_DAY - 1).kind).toBe('ams');
    expect(seatSystemAt('wales', SENEDD_EXPANSION_DAY).kind).toBe('listPr');
    expect(seatSystemAt('scotland', SENEDD_EXPANSION_DAY + 3650).kind).toBe('ams');
    expect(seatSystemAt('uk', 0).kind).toBe('fptp');
  });
});

describe('building a devolved map from a real result', () => {
  const cases: { arena: DevolvedArenaId; regions: typeof HOLYROOD_REGIONS }[] = [
    { arena: 'scotland', regions: HOLYROOD_REGIONS },
    { arena: 'wales', regions: SENEDD_REGIONS },
  ];
  for (const { arena, regions } of cases) {
    for (const snap of DEVOLVED_LEGISLATURES[arena]) {
      it(`${arena} ${snap.election}: constituency seats match region by region and the lists match nationally`, () => {
        const { seatMap } = generateDevolvedSeatMap(new Rng(7), arena, snap, regions, snap.governing, '2019');
        const house = regions.reduce((a, r) => a + r.constituencies + r.listSeats, 0);
        expect(seatMap).toHaveLength(house);
        // constituencies
        for (const lr of regions) {
          const won: Partial<Record<PartyId, number>> = {};
          for (const s of seatMap) {
            if (s.kind !== 'list' && s.listRegion === lr.id) won[s.winner] = (won[s.winner] ?? 0) + 1;
          }
          expect(won).toEqual(snap.constituencySeats[lr.id]);
        }
        // lists: the calibration must reproduce the real national list totals for
        // every party on the ballot (an independent's list seat goes to the biggest party)
        const listWon: Partial<Record<PartyId, number>> = {};
        for (const s of seatMap) if (s.kind === 'list') listWon[s.winner] = (listWon[s.winner] ?? 0) + 1;
        for (const p of snap.parties) {
          const want = (snap.listSeats[p] ?? 0) + (p === snap.governing && snap.listSeats.ind ? 0 : 0);
          if (snap.listSeats.ind && p === 'lab' && arena === 'scotland') {
            // 2011: Margo MacDonald's Lothian list seat is carried by Labour, the
            // biggest list party
            expect(listWon[p]).toBe(want + 1);
          } else {
            expect(listWon[p] ?? 0).toBe(want);
          }
        }
        // the whole House
        const total = countSeats(seatMap);
        expect(sum(total)).toBe(house);
      });
    }
  }
});

describe('a Holyrood election', () => {
  it('returns 129 members and a list stage', () => {
    for (let i = 0; i < 6; i++) {
      const g = holyrood({ seed: 100 + i });
      const { result } = runElection(g, new Rng(900 + i));
      expect(sum(result.seats)).toBe(129);
      expect(result.listSeats).toBeDefined();
      expect(sum(result.listSeats!)).toBe(56);
      expect(result.arena).toBe('scotland');
      // the SNP wins most constituencies and few list seats; the Greens win on the list only
      expect((result.seats.snp ?? 0)).toBeGreaterThan(50);
      expect(result.listSeats!.sgp ?? 0).toBe(result.seats.sgp ?? 0);
    }
  });

  it('a party on 37% of the list vote never wins a majority, however many constituencies it holds', () => {
    for (let i = 0; i < 8; i++) {
      const g = holyrood({ seed: 400 + i });
      g.polling.shares = { snp: 0.37, con: 0.25, lab: 0.21, sgp: 0.08, ld: 0.06, alba: 0.02, reform: 0.01 };
      const { result } = runElection(g, new Rng(500 + i));
      expect(result.outcome).not.toBe('majority');
      expect(result.seats.snp ?? 0).toBeLessThan(65);
      expect(result.seats.snp ?? 0).toBeGreaterThan(40);
    }
  });

  it('reproduces the 2021 result within a few seats from its own anchor', () => {
    let snp = 0, con = 0, lab = 0, sgp = 0;
    const runs = 8;
    for (let i = 0; i < runs; i++) {
      const g = holyrood({ seed: 200 + i });
      const { result } = runElection(g, new Rng(300 + i));
      snp += result.seats.snp ?? 0; con += result.seats.con ?? 0;
      lab += result.seats.lab ?? 0; sgp += result.seats.sgp ?? 0;
    }
    expect(snp / runs).toBeGreaterThan(58); expect(snp / runs).toBeLessThan(69);
    expect(con / runs).toBeGreaterThan(24); expect(con / runs).toBeLessThan(36);
    expect(lab / runs).toBeGreaterThan(16); expect(lab / runs).toBeLessThan(28);
    expect(sgp / runs).toBeGreaterThan(4); expect(sgp / runs).toBeLessThan(12);
  });

  it('a Scottish Green player is a list member and is returned from the list', () => {
    const g = holyrood({ partyId: 'sgp' });
    const seat = g.seatMap.find((s) => s.id === g.player.seatId)!;
    expect(seat.kind).toBe('list');
    expect(seat.winner).toBe('sgp');
    const { result, playerWonSeat } = runElection(g, new Rng(11));
    expect(result.playerResult?.listRank).toBeDefined();
    if (playerWonSeat) {
      const now = g.seatMap.find((s) => s.id === g.player.seatId)!;
      expect(now.kind).toBe('list');
      expect(now.winner).toBe('sgp');
    }
  });

  it('the list saves a constituency member whose seat falls, when the party ranks them high enough', () => {
    let saved = 0;
    for (let i = 0; i < 24; i++) {
      const g = holyrood({ partyId: 'con', seed: 700 + i });
      // a Cabinet-rank Conservative with a collapsing constituency vote
      g.player.officeId = 'scotland_cabsec_finance';
      g.player.stats.constituencyApproval = 5;
      const seat = g.seatMap.find((s) => s.id === g.player.seatId)!;
      seat.shares.con = 0.2; seat.shares.snp = 0.6; seat.base = { ...seat.shares };
      const { result, playerWonSeat } = runElection(g, new Rng(i));
      if (result.playerResult?.savedByList) {
        saved++;
        expect(playerWonSeat).toBe(true);
        const now = g.seatMap.find((s) => s.id === g.player.seatId)!;
        expect(now.kind).toBe('list');
        expect(now.winner).toBe('con');
      }
    }
    expect(saved).toBeGreaterThan(0);
  });
});

describe('a Senedd election', () => {
  it('on the 2021 map returns 60 members, 20 of them from the lists', () => {
    const g = senedd();
    const { result } = runElection(g, new Rng(5));
    expect(sum(result.seats)).toBe(60);
    expect(sum(result.listSeats!)).toBe(20);
  });

  it('switches to ninety-six members by closed-list PR at the 2026 election', () => {
    const g = senedd();
    g.day = SENEDD_EXPANSION_DAY;
    const { result, playerWonSeat } = runElection(g, new Rng(5));
    expect(sum(result.seats)).toBe(96);
    expect(g.seatMap).toHaveLength(96);
    expect(g.seatMap.every((s) => s.kind === 'list')).toBe(true);
    expect(result.playerResult?.listRank).toBeDefined();
    // the player stands on a list in a six-member constituency
    const seat = g.seatMap.find((s) => s.id === g.player.seatId)!;
    expect(seat.listRegion).toBeTruthy();
    if (playerWonSeat) expect(seat.winner).toBe('lab');
    // no party can sweep a six-seat district on a plurality
    for (const d of new Set(g.seatMap.map((s) => s.listRegion))) {
      const inD = g.seatMap.filter((s) => s.listRegion === d);
      const labHere = inD.filter((s) => s.winner === 'lab').length;
      expect(labHere).toBeLessThanOrEqual(5);
    }
  });
});
