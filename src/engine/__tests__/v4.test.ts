import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  playerCanStandForLeader, openLeadershipVacancy, materializeForced,
  resolveForcedChoice, nextOfficeFor, onMinorPartyTrack, giveOffice,
} from '../career';
import { officeTitleFor } from '../../data/offices';
import { BACKGROUNDS, BACKGROUND_IDS } from '../../data/backgrounds';
import { Rng } from '../rng';
import { GameState } from '../../types/game';

function makeGame(opts: Partial<CreationInput> = {}): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'm', age: 44, region: 'eastMidlands',
    background: 'teacher', partyId: 'lab',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2024', seed: 1, ...opts,
  };
  return createNewGame(input);
}

/** drive a whole leadership contest — declaration, launch/debate/scrutiny episodes,
 *  every ballot, and the backing flow if eliminated — picking choice 0 each time */
const CONTEST_KINDS = new Set(['leadershipStand', 'leadershipBallot', 'leadershipEpisode', 'leadershipBacking']);
function runContest(game: GameState, rng: Rng): void {
  openLeadershipVacancy(game, rng, game.player.partyId);
  let guard = 0;
  while (game.forcedQueue.length > 0 && guard < 30) {
    const ev = game.forcedQueue.shift()!;
    if (!CONTEST_KINDS.has(ev.kind)) break;
    const card = materializeForced(game, rng, ev);
    resolveForcedChoice(game, rng, card, 0);
    guard++;
  }
}

describe('open leadership standing', () => {
  it('any sitting MP — even a backbencher — may stand', () => {
    const game = makeGame();
    expect(game.player.officeId).toBeNull();
    expect(playerCanStandForLeader(game)).toBe(true);
  });

  it('a current leader cannot stand again', () => {
    const game = makeGame();
    game.player.officeId = 'leader';
    expect(playerCanStandForLeader(game)).toBe(false);
  });

  it('a seatless ex-MP cannot stand', () => {
    const game = makeGame();
    game.player.hasSeat = false;
    expect(playerCanStandForLeader(game)).toBe(false);
  });

  it('a low-stat backbencher who stands is usually eliminated, not crowned', () => {
    let won = 0;
    const runs = 30;
    for (let i = 0; i < runs; i++) {
      const game = makeGame({ seed: 500 + i });
      game.player.stats = { profile: 25, partyStanding: 30, competence: 35, constituencyApproval: 40, integrity: 45 };
      runContest(game, new Rng(900 + i));
      if (game.player.officeId === 'leader') won++;
      // contest always fully resolves (queue drained of ballot events)
      expect(game.forcedQueue.some((e) => e.kind === 'leadershipBallot')).toBe(false);
    }
    expect(won / runs).toBeLessThan(0.25); // long-shots rarely win
  });

  it('a strong frontbencher is a serious contender — reliably reaching the final', () => {
    // With the two-currency campaign, MP support carries a strong candidate TO the
    // members' final; WINNING it then depends on having courted the membership (a
    // separate strategic axis). So the robust "strong candidates are serious" claim is
    // that they reliably reach the final (or win outright via a coronation/two-horse).
    let seriousRun = 0;
    const runs = 30;
    for (let i = 0; i < runs; i++) {
      const game = makeGame({ seed: 700 + i });
      const rng = new Rng(1300 + i);
      game.player.officeId = 'sos_treasury';
      game.player.stats = { profile: 85, partyStanding: 85, competence: 85, constituencyApproval: 70, integrity: 65 };
      openLeadershipVacancy(game, rng, game.player.partyId);
      let reachedFinal = false;
      let guard = 0;
      while (game.forcedQueue.length > 0 && guard < 30) {
        const ev = game.forcedQueue.shift()!;
        if (!CONTEST_KINDS.has(ev.kind)) break;
        if (ev.kind === 'leadershipBallot' && ev.payload?.finalRound) reachedFinal = true;
        const card = materializeForced(game, rng, ev);
        resolveForcedChoice(game, rng, card, 0);
        guard++;
      }
      if (reachedFinal || game.player.officeId === 'leader') seriousRun++;
    }
    expect(seriousRun / runs).toBeGreaterThan(0.6);
  });
});

describe('minor-party career track', () => {
  const greenGame = () => makeGame({ partyId: 'green', region: 'london' });

  it('a minor-party MP is on the minor track, not the front-bench track', () => {
    const game = greenGame();
    expect(onMinorPartyTrack(game)).toBe(true);
  });

  it('is offered spokesperson (min_*/sos_*) roles, never PPS/whip', () => {
    const game = greenGame();
    for (let i = 0; i < 12; i++) {
      const target = nextOfficeFor(game, new Rng(i + 1));
      expect(target).toBeTruthy();
      expect(target!.startsWith('min_') || target!.startsWith('sos_')).toBe(true);
    }
  });

  it('titles read as party spokesperson roles', () => {
    const name = 'Green Party';
    expect(officeTitleFor('min_health', { inGovernment: false, minorPartyName: name }))
      .toBe('Green Party Spokesperson for Health');
    expect(officeTitleFor('leader', { inGovernment: false, minorPartyName: name }))
      .toBe('Leader of the Green Party');
  });

  it('taking a spokesperson role never inserts the player into a major cabinet', () => {
    const game = greenGame();
    giveOffice(game, new Rng(2), 'sos_health', 'appointed');
    expect(game.player.officeId).toBe('sos_health');
    const inAnyCabinet = [...game.government.cabinet, ...game.government.shadowCabinet]
      .some((p) => p.characterId === 'player');
    expect(inAnyCabinet).toBe(false);
  });

  it('can win its leadership — becoming party leader, not PM or LO', () => {
    let becameLeader = false;
    for (let i = 0; i < 20 && !becameLeader; i++) {
      const game = greenGame();
      game.player.officeId = 'sos_environment';
      game.player.stats = { profile: 88, partyStanding: 88, competence: 85, constituencyApproval: 75, integrity: 70 };
      runContest(game, new Rng(2200 + i));
      if (game.player.officeId === 'leader') {
        becameLeader = true;
        expect(game.government.pmId).not.toBe('player');
        expect(game.government.loId).not.toBe('player');
      }
    }
    expect(becameLeader).toBe(true);
  });
});

describe('ladder mix — ministerial churn over SoS jumps', () => {
  it('a serving minister is offered a fresh ministry more often than a promotion to SoS', () => {
    const game = makeGame();
    game.player.officeId = 'min_health';
    let min = 0; let sos = 0;
    for (let i = 0; i < 200; i++) {
      const t = nextOfficeFor(game, new Rng(i + 1));
      if (t?.startsWith('min_')) min++;
      else if (t?.startsWith('sos_')) sos++;
    }
    expect(min).toBeGreaterThan(sos);
  });
});

describe('new backgrounds', () => {
  it('Local Councillor and Big City Mayor exist', () => {
    expect(BACKGROUND_IDS).toContain('councillor');
    expect(BACKGROUND_IDS).toContain('mayor');
  });

  it('Big City Mayor has a bigger total stat boost than most backgrounds', () => {
    const total = (id: keyof typeof BACKGROUNDS) =>
      Object.values(BACKGROUNDS[id].statMods).reduce((a, b) => a + (b ?? 0), 0);
    const mayorTotal = total('mayor');
    const others = BACKGROUND_IDS.filter((b) => b !== 'mayor').map(total);
    expect(mayorTotal).toBeGreaterThan(Math.max(...others));
  });
});

describe('PM pressure mechanic', () => {
  function pmGame(seed: number): GameState {
    const game = makeGame({ partyId: 'lab', era: '2024', seed });
    game.player.officeId = 'leader';
    game.government.pmId = 'player';
    game.government.governingParty = 'lab';
    return game;
  }

  it('a capable PM usually rides out an ordinary authority crisis', () => {
    let survived = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      const game = pmGame(3000 + i);
      game.player.stats = { profile: 72, partyStanding: 72, competence: 70, constituencyApproval: 60, integrity: 65 };
      const card = materializeForced(game, new Rng(i + 1), { kind: 'pmPressure', payload: { severe: false } });
      resolveForcedChoice(game, new Rng(i + 7), card, 2); // concessions: the safest play
      if (game.player.officeId === 'leader') survived++;
    }
    expect(survived).toBeGreaterThan(runs * 0.6);
  });

  it('a weak PM facing a brutal no-confidence vote is often toppled', () => {
    let toppled = 0;
    const runs = 40;
    for (let i = 0; i < runs; i++) {
      const game = pmGame(3500 + i);
      game.player.stats = { profile: 40, partyStanding: 38, competence: 42, constituencyApproval: 35, integrity: 40 };
      const card = materializeForced(game, new Rng(i + 1), { kind: 'pmPressure', payload: { severe: true } });
      resolveForcedChoice(game, new Rng(i + 7), card, i % 3);
      if (game.player.officeId === null) toppled++;
    }
    expect(toppled).toBeGreaterThan(runs * 0.4);
  });

  it('being toppled hands the premiership to a successor', () => {
    let sawSuccession = false;
    for (let i = 0; i < 40 && !sawSuccession; i++) {
      const game = pmGame(4000 + i);
      game.player.stats = { profile: 20, partyStanding: 20, competence: 25, constituencyApproval: 20, integrity: 25 };
      const card = materializeForced(game, new Rng(i + 1), { kind: 'pmPressure', payload: { severe: true } });
      resolveForcedChoice(game, new Rng(i + 3), card, 1);
      if (game.player.officeId === null) {
        sawSuccession = true;
        expect(game.government.pmId).not.toBe('player');
        expect(game.characters[game.government.pmId]).toBeDefined();
      }
    }
    expect(sawSuccession).toBe(true);
  });
});
