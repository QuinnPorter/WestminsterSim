import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { runElection } from '../election';
import { continueAsProtegeCore, recordLoChange, buildLegacy } from '../career';
import { Rng } from '../rng';
import { Era, PartyId } from '../../types/game';

function makeGame(partyId: PartyId = 'lab', era: Era = '2024', seed = 1234) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 40, region: 'yorkshire',
    background: 'teacher', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era, seed,
  };
  return createNewGame(input);
}

describe('wave 17 — winner\'s bonus / more decisive elections', () => {
  it('a clear national lead converts into a single-party majority a healthy share of the time', () => {
    let maj = 0, leaderWon = 0, total = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      const g = makeGame('lab', '2024', 1000 + i);
      // a competitive but clearly-led field that often lands near the majority line
      g.polling.shares = { lab: 0.34, con: 0.27, reform: 0.16, ld: 0.12, green: 0.07, snp: 0.025, pc: 0.005 };
      const { result } = runElection(g, new Rng(5000 + i));
      total++;
      if (result.outcome === 'majority') maj++;
      // the bonus backs the national vote leader, never overturning who leads
      if (result.governingParty === 'lab') leaderWon++;
    }
    expect(maj / total).toBeGreaterThan(0.4); // decisive results are common
    expect(leaderWon).toBe(total);            // the vote leader still forms the government
  });
});

describe('wave 17 — populist seat responsiveness', () => {
  it('a Reform surge now converts to far more than the ~22 seats it used to win', () => {
    let ref = 0;
    const runs = 16;
    for (let i = 0; i < runs; i++) {
      const g = makeGame('reform', '2024', 100 + i);
      // Reform leads a fragmented field (the reported scenario)
      g.polling.shares = { reform: 0.29, lab: 0.19, ld: 0.18, con: 0.15, green: 0.09, snp: 0.03, pc: 0.01 };
      const { result } = runElection(g, new Rng(700 + i));
      ref += result.seats.reform ?? 0;
    }
    const avg = ref / runs;
    // clearly more responsive than the old ~22, but not a runaway landslide
    expect(avg).toBeGreaterThan(45);
    expect(avg).toBeLessThan(260);
  });

  it('a flat 2024 baseline still keeps Labour comfortably in government', () => {
    const g = makeGame('lab', '2024', 77);
    const { result } = runElection(g, new Rng(42));
    expect(result.governingParty).toBe('lab');
    expect(result.seats.lab ?? 0).toBeGreaterThan(300);
  });
});

describe('wave 17 — Leader-of-the-Opposition history', () => {
  it('records a change, is a no-op for the same incumbent, and closes the prior spell', () => {
    const g = makeGame('lab');
    const before = g.loHistory!.length;
    g.day += 100;
    recordLoChange(g, 'npc_test_lo');
    expect(g.loHistory!.length).toBe(before + 1);
    expect(g.loHistory![g.loHistory!.length - 2].endDay).toBe(g.day); // prior spell closed
    const len = g.loHistory!.length;
    recordLoChange(g, 'npc_test_lo'); // same incumbent → no-op
    expect(g.loHistory!.length).toBe(len);
    expect(recordLoChange(g, '')).toBeUndefined(); // empty id ignored
    expect(g.loHistory!.length).toBe(len);
  });
});

describe('wave 17 — continue as protégé', () => {
  it('archives the retiree and installs a fresh same-party player in the same world', () => {
    const g = makeGame('lab', '2024', 999);
    // advance the world a little and retire
    g.day += 500;
    const charCountBefore = Object.keys(g.characters).length;
    const dayAtRetire = g.day;
    const pmHistoryLen = g.pmHistory.length;
    g.gameOver = { reason: 'retired', legacy: buildLegacy(g) };

    const input: CreationInput = {
      name: 'The Heir', gender: 'm', age: 33, region: 'yorkshire',
      background: 'teacher', partyId: 'lab',
      avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
      era: '2024',
    };
    continueAsProtegeCore(g, new Rng(5), input);

    // a mentor was archived
    expect(g.mentors!.length).toBe(1);
    expect(g.mentors![0].name).toBe('Test MP');
    // the fresh player took over
    expect(g.player.name).toBe('The Heir');
    expect(g.player.partyId).toBe('lab');
    expect(g.player.officeId).toBeNull();
    expect(g.player.hasSeat).toBe(true);
    expect(g.player.favours).toEqual([]);
    // the world is preserved
    expect(g.day).toBe(dayAtRetire);
    expect(g.gameOver).toBeNull();
    expect(Object.keys(g.characters).length).toBeGreaterThanOrEqual(charCountBefore);
    expect(g.pmHistory.length).toBe(pmHistoryLen); // world PM record intact
    // no dangling 'player' office references
    expect(g.government.pmId).not.toBe('player');
    expect(g.government.loId).not.toBe('player');
    expect(g.government.cabinet.every((p) => p.characterId !== 'player')).toBe(true);
    expect(g.government.shadowCabinet.every((p) => p.characterId !== 'player')).toBe(true);
  });
});
