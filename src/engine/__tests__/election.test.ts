import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { runElection } from '../election';
import { Rng } from '../rng';
import { Era, PartyId } from '../../types/game';

function makeGame(era: Era, partyId: PartyId = era === '2019' ? 'con' : 'lab', seed = 1234) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 40, region: 'yorkshire',
    background: 'teacher', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era, seed,
  };
  return createNewGame(input);
}

describe('election calibration', () => {
  it('2019 baseline polling roughly reproduces the 2019 result', () => {
    let conTotal = 0, labTotal = 0, snpTotal = 0;
    const runs = 12;
    for (let i = 0; i < runs; i++) {
      const game = makeGame('2019', 'con', 100 + i);
      // polling unchanged from baseline → re-running should give a similar parliament
      const { result } = runElection(game, new Rng(500 + i));
      conTotal += result.seats.con ?? 0;
      labTotal += result.seats.lab ?? 0;
      snpTotal += result.seats.snp ?? 0;
      const total = Object.values(result.seats).reduce((a, b) => a + (b ?? 0), 0);
      expect(total).toBe(650);
    }
    expect(conTotal / runs).toBeGreaterThan(330);
    expect(conTotal / runs).toBeLessThan(400);
    expect(labTotal / runs).toBeGreaterThan(170);
    expect(labTotal / runs).toBeLessThan(240);
    expect(snpTotal / runs).toBeGreaterThan(35);
  });

  it('a 2024-style swing from the 2019 map produces a Labour landslide', () => {
    let labTotal = 0;
    const runs = 12;
    for (let i = 0; i < runs; i++) {
      const game = makeGame('2019', 'con', 200 + i);
      game.polling.shares = {
        lab: 0.337, con: 0.237, reform: 0.143, ld: 0.122,
        green: 0.067, snp: 0.025, pc: 0.007,
      };
      const { result } = runElection(game, new Rng(900 + i));
      labTotal += result.seats.lab ?? 0;
      expect(result.governingParty).toBe('lab');
    }
    const avgLab = labTotal / runs;
    expect(avgLab).toBeGreaterThan(330);
    expect(avgLab).toBeLessThan(480);
  });

  it('2024 baseline polling keeps Labour in government', () => {
    const game = makeGame('2024', 'lab', 77);
    const { result } = runElection(game, new Rng(42));
    expect(result.governingParty).toBe('lab');
    expect(result.seats.lab ?? 0).toBeGreaterThan(300);
  });

  it('a popular incumbent player usually holds a safe seat', () => {
    let held = 0;
    const runs = 20;
    for (let i = 0; i < runs; i++) {
      const game = makeGame('2019', 'con', 300 + i);
      game.player.stats.constituencyApproval = 70;
      const { playerWonSeat } = runElection(game, new Rng(1300 + i));
      if (playerWonSeat) held++;
    }
    expect(held / runs).toBeGreaterThanOrEqual(0.75);
  });

  it('a collapse can cost the player their seat', () => {
    let lost = 0;
    const runs = 20;
    for (let i = 0; i < runs; i++) {
      const game = makeGame('2019', 'con', 400 + i);
      game.player.stats.constituencyApproval = 15;
      game.polling.shares = {
        lab: 0.46, con: 0.24, ld: 0.12, snp: 0.04,
        green: 0.05, reform: 0.08, pc: 0.01,
      };
      const { playerWonSeat } = runElection(game, new Rng(1700 + i));
      if (!playerWonSeat) lost++;
    }
    expect(lost).toBeGreaterThan(2);
  });

  it('election result writes back into the seat map for the next cycle', () => {
    const game = makeGame('2019', 'con', 55);
    const before = game.seatMap.map((s) => s.winner).join(',');
    runElection(game, new Rng(11));
    const after = game.seatMap.map((s) => s.winner).join(',');
    expect(after).not.toBe(before); // at least some seats changed hands
    const counted = Object.values(game.seats).reduce((a, b) => a + (b ?? 0), 0);
    expect(counted).toBe(650);
  });
});
