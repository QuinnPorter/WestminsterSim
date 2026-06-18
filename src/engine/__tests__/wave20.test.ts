import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { applyElectionAftermath, nextOfficeFor } from '../career';
import { runElection } from '../election';
import { officeTitleFor, officeTitle } from '../../data/offices';
import { buildOfficeSpans } from '../../screens/ProfileScreen';
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

describe('wave 20 — minor-party government title', () => {
  it('reads as a full Secretary of State in government, a spokesperson in opposition', () => {
    // in government a minor party runs the real department
    expect(officeTitleFor('min_health', { inGovernment: true, minorPartyName: 'Green Party' }))
      .toBe(officeTitle('sos_health', true)); // 'Health Secretary'
    // in opposition it is the spokesperson rung
    expect(officeTitleFor('min_health', { inGovernment: false, minorPartyName: 'Green Party' }))
      .toBe('Green Party Spokesperson for Health');
  });
});

describe('wave 20 — never offered a job you already hold', () => {
  it('nextOfficeFor never returns the player current office', () => {
    const g = makeGame('lab', '2024', 11);
    for (const office of ['min_health', 'min_education', 'pps', 'whip'] as const) {
      g.player.officeId = office;
      for (let i = 0; i < 300; i++) {
        expect(nextOfficeFor(g, new Rng(i))).not.toBe(office);
      }
    }
  });
});

describe('wave 20 — display vote shares (regional parties scaled)', () => {
  it('scales a region-strength SNP share down to a realistic national figure', () => {
    const g = makeGame('lab', '2024', 5);
    // SNP polled at Scottish strength would over-read as a national 30%
    g.polling.shares = { lab: 0.30, con: 0.27, snp: 0.30, ld: 0.07, green: 0.04, reform: 0.02 } as Record<PartyId, number>;
    const { result } = runElection(g, new Rng(5));
    const v = result.voteShares;
    expect((v.snp ?? 0)).toBeLessThan(0.08);      // no longer an impossible ~30% national
    expect((v.lab ?? 0)).toBeGreaterThan(0.25);   // GB parties are no longer compressed
    const total = Object.values(v).reduce((s, x) => s + (x ?? 0), 0);
    expect(total).toBeGreaterThan(0.98);
    expect(total).toBeLessThan(1.02);
  });
});

describe('wave 20 — losing your seat as PM closes the career span', () => {
  it('records a closing roleChange so the PM span does not run to "now"', () => {
    const g = makeGame('lab', '2024', 9);
    g.government.pmId = 'player';
    g.player.officeId = 'leader';
    g.history.push({
      kind: 'roleChange', date: g.day, officeId: 'leader', how: 'becamePM',
      roleSide: 'gov', partyId: 'lab',
    });

    const result: ElectionResult = {
      id: 'ge', date: g.day + 1000,
      seats: { con: 350, lab: 230, ld: 30, snp: 20, reform: 15, green: 5 } as GameState['seats'],
      voteShares: { con: 0.45, lab: 0.30, ld: 0.10, snp: 0.05, reform: 0.07, green: 0.03 },
      playerResult: null, outcome: 'majority', governingParty: 'con', playerHeldSeat: false,
    };
    g.day += 1000;
    g.seats = { ...result.seats };
    applyElectionAftermath(g, new Rng(3), result, false); // player LOST their seat

    expect(g.player.officeId).toBeNull();
    const spans = buildOfficeSpans(g.history);
    const pmSpan = spans.find((s) => s.becamePM);
    expect(pmSpan).toBeTruthy();
    expect(pmSpan!.end).not.toBeNull(); // the PM span is closed, not still running
  });
});

describe('wave 20 — the Emily Thornberry effect', () => {
  it('occasionally a shadow minister is passed over when their party forms government', () => {
    let snubbed = 0; const runs = 300;
    for (let i = 0; i < runs; i++) {
      const g = makeGame('lab', '2024', 1000 + i);
      // player is Shadow Health Secretary; the Conservatives govern, Labour opposes
      g.government.governingParty = 'con';
      g.government.oppositionParty = 'lab';
      g.player.officeId = 'sos_health';
      const shadowPost = g.government.shadowCabinet.find((p) => p.officeId === 'sos_health');
      if (shadowPost) shadowPost.characterId = 'player';

      const result: ElectionResult = {
        id: 'ge', date: g.day,
        seats: { lab: 350, con: 240, ld: 30, snp: 20, reform: 8, green: 2 } as GameState['seats'],
        voteShares: { lab: 0.44, con: 0.32, ld: 0.10, snp: 0.05, reform: 0.07, green: 0.02 },
        playerResult: null, outcome: 'majority', governingParty: 'lab', playerHeldSeat: true,
      };
      g.seats = { ...result.seats };
      applyElectionAftermath(g, new Rng(2000 + i), result, true);

      // snubbed = not carried into the matching Health brief (backbench or a junior post)
      if (g.player.officeId !== 'sos_health') snubbed++;
    }
    // it fires sometimes (not always) — a low, stat-dependent rate
    expect(snubbed).toBeGreaterThan(0);
    expect(snubbed).toBeLessThan(runs * 0.3);
  });
});
