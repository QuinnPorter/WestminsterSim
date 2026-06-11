import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { gainStat, applyEffects } from '../effects';
import { nextOfficeFor, recordPeakTier, applyElectionAftermath, governingPartyAt } from '../career';
import { officeTitle } from '../../data/offices';
import { ElectionResult } from '../../types/game';
import { makeDrawnCard } from '../cardEngine';
import { OFFICES } from '../../data/offices';
import { Rng } from '../rng';
import { GameState } from '../../types/game';

function makeGame(seed = 1): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'm', age: 44, region: 'eastMidlands',
    background: 'teacher', partyId: 'lab',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2024', seed,
  };
  return createNewGame(input);
}

describe('stat economy — diminishing returns', () => {
  it('repeated gains plateau and never reach 100', () => {
    const game = makeGame();
    game.player.stats.profile = 0;
    for (let i = 0; i < 200; i++) gainStat(game, 'profile', 5);
    expect(game.player.stats.profile).toBeGreaterThan(70);
    expect(game.player.stats.profile).toBeLessThan(98);
  });

  it('a single +5 near the ceiling barely moves the stat', () => {
    const game = makeGame();
    game.player.stats.competence = 90;
    const applied = gainStat(game, 'competence', 5);
    expect(applied).toBeLessThan(1);
  });

  it('negative deltas apply in full', () => {
    const game = makeGame();
    game.player.stats.integrity = 80;
    const applied = gainStat(game, 'integrity', -10);
    expect(applied).toBe(-10);
    expect(game.player.stats.integrity).toBe(70);
  });

  it('a trade-off effect lowers its secondary stat', () => {
    const game = makeGame();
    game.player.stats.profile = 50;
    game.player.stats.partyStanding = 50;
    applyEffects(game, { stats: { profile: 6, partyStanding: -3 } });
    expect(game.player.stats.partyStanding).toBe(47);
    expect(game.player.stats.profile).toBeGreaterThan(50);
  });
});

describe('career memory — comeback level', () => {
  it('a former cabinet minister is not offered PPS on return', () => {
    const game = makeGame();
    // simulate having peaked as a Secretary of State, now back on the benches
    game.player.officeId = 'sos_health';
    recordPeakTier(game);
    game.player.officeId = null;
    const rng = new Rng(3);
    // sample several offers; none should be the bottom rung
    for (let i = 0; i < 10; i++) {
      const target = nextOfficeFor(game, new Rng(i + 10));
      expect(target).toBeTruthy();
      expect(OFFICES[target!].tier).toBeGreaterThanOrEqual(3);
    }
    void rng;
  });

  it('a never-promoted backbencher still starts at the bottom', () => {
    const game = makeGame();
    const target = nextOfficeFor(game, new Rng(1));
    expect(['pps', 'whip']).toContain(target);
  });
});

describe('clock pacing', () => {
  it('ordinary decisions advance one or two months', () => {
    const game = makeGame();
    const rng = new Rng(7);
    const card = {
      id: 'x', title: 't', body: 'b', tags: ['personal' as const],
      weight: 1, cooldownDays: 0,
      choices: [{ label: 'a', effects: {}, outcomeText: 'o' }, { label: 'b', effects: {}, outcomeText: 'o' }],
    };
    for (let i = 0; i < 30; i++) {
      const drawn = makeDrawnCard(game, rng, card);
      expect([30, 60]).toContain(drawn.payload?.advance);
    }
  });
});

describe('poll history', () => {
  it('a fresh game seeds one polling snapshot', () => {
    const game = makeGame();
    expect(game.pollHistory.length).toBe(1);
    expect(game.pollHistory[0].day).toBe(game.startDay);
  });
});

describe('portfolio title follows gov/shadow on a change of government', () => {
  // 2024 start: player is Labour (governing), holds Health Secretary.
  // The Conservatives win the next election → player keeps the brief as Shadow.
  it('records a continued role and history shows the new side', () => {
    const game = makeGame(11);
    game.player.officeId = 'sos_health';
    game.day = game.startDay + 1500;
    const result: ElectionResult = {
      id: `ge_${game.day}`, date: game.day,
      seats: { con: 360, lab: 230, ld: 40, snp: 10, spk: 1 },
      voteShares: { con: 0.44, lab: 0.34 },
      playerResult: null, outcome: 'majority',
      governingParty: 'con', playerHeldSeat: true,
    };
    game.elections[result.id] = result;
    applyElectionAftermath(game, new Rng(5), result, true);

    // the player kept the brief but is now in opposition
    expect(game.player.officeId).toBe('sos_health');
    expect(game.government.governingParty).toBe('con');
    // a 'continued' role change was recorded at the election
    const cont = game.history.find(
      (h) => h.kind === 'roleChange' && h.how === 'continued'
    );
    expect(cont).toBeDefined();
    // and at that date the player is now in opposition → Shadow title
    const inGov = governingPartyAt(game, game.day) === game.player.partyId;
    expect(inGov).toBe(false);
    expect(officeTitle('sos_health', inGov)).toMatch(/^Shadow/);
  });
});
