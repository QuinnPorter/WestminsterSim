import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  playerOfficeTitle, canHoldOffice, playerCanStandForLeader, leadershipBaseSupport,
  materializeForced, resolveForcedChoice, buildLegacy, npcReshuffle,
} from '../career';
import { validateCards, ALL_CARDS } from '../../content/cards';
import { Rng } from '../rng';

function makeGame(seed = 42, partyId: CreationInput['partyId'] = 'con') {
  const input: CreationInput = {
    name: 'Test MP', gender: 'm', age: 45, region: 'northWest',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

describe('wave 7: cards', () => {
  it('all cards (including the new role cards) validate', () => {
    expect(validateCards(ALL_CARDS)).toEqual([]);
  });
});

describe('wave 7: Deputy PM / First Secretary', () => {
  it('overlays the deputy title on a sitting Secretary of State', () => {
    const game = makeGame(); // con governs in 2019
    game.player.officeId = 'sos_health';
    game.player.flags._isDeputyPM = true;
    game.government.deputyTitle = 'dpm';
    const title = playerOfficeTitle(game);
    expect(title.startsWith('Deputy Prime Minister and ')).toBe(true);

    game.government.deputyTitle = 'firstSec';
    expect(playerOfficeTitle(game).startsWith('First Secretary of State and ')).toBe(true);
  });

  it('does not overlay the title on a non-cabinet office', () => {
    const game = makeGame();
    game.player.officeId = 'min_health'; // tier 3, not a Secretary of State
    game.player.flags._isDeputyPM = true;
    game.government.deputyTitle = 'dpm';
    expect(playerOfficeTitle(game).startsWith('Deputy Prime Minister')).toBe(false);
  });

  it('the deputy enjoys a leadership springboard', () => {
    const base = makeGame();
    base.player.officeId = 'sos_treasury';
    base.player.stats = { profile: 60, partyStanding: 60, competence: 60, constituencyApproval: 60, integrity: 60 };
    const without = leadershipBaseSupport(base);
    base.player.flags._isDeputyPM = true;
    const withDpm = leadershipBaseSupport(base);
    expect(withDpm).toBeGreaterThan(without);
  });

  it('accepting the deputy offer sets the flags and records the office', () => {
    const game = makeGame();
    game.player.officeId = 'sos_treasury';
    const rng = new Rng(7);
    const card = materializeForced(game, rng, { kind: 'deputyPmOffer' });
    resolveForcedChoice(game, rng, card, 0);
    expect(game.player.flags._isDeputyPM).toBe(true);
    expect(game.player.flags._everDeputyPM).toBe(true);
    expect(game.government.deputyPmId).toBe('player');
  });
});

describe('wave 7: deputy PM at reshuffles', () => {
  it('a governing-cabinet reshuffle can add a deputy where there was none', () => {
    let appointed = 0;
    for (let i = 0; i < 20; i++) {
      const game = makeGame(2000 + i); // con governs, NPC PM
      game.government.deputyPmId = undefined;
      game.government.deputyTitle = undefined;
      const rng = new Rng(4000 + i);
      npcReshuffle(game, rng, game.government.governingParty);
      if (game.government.deputyPmId && game.government.deputyPmId !== 'player') appointed++;
    }
    expect(appointed).toBeGreaterThan(0);
  });

  it('a governing-cabinet reshuffle can drop a sitting NPC deputy', () => {
    let dropped = 0;
    for (let i = 0; i < 30; i++) {
      const game = makeGame(2500 + i);
      // seat a strong NPC deputy
      const sos = game.government.cabinet.find((p) => p.characterId !== 'player');
      game.government.deputyPmId = sos!.characterId;
      game.government.deputyTitle = 'dpm';
      const rng = new Rng(5000 + i);
      npcReshuffle(game, rng, game.government.governingParty);
      if (!game.government.deputyPmId) dropped++;
    }
    expect(dropped).toBeGreaterThan(0);
  });

  it('a reshuffle never disturbs a sitting PLAYER deputy', () => {
    const game = makeGame();
    game.player.officeId = 'sos_health';
    game.player.flags._isDeputyPM = true;
    game.government.deputyPmId = 'player';
    game.government.deputyTitle = 'dpm';
    for (let i = 0; i < 10; i++) {
      npcReshuffle(game, new Rng(6000 + i), game.government.governingParty);
    }
    expect(game.government.deputyPmId).toBe('player');
    expect(game.player.flags._isDeputyPM).toBe(true);
  });
});

describe('wave 7: Speaker eligibility', () => {
  it('a Speaker cannot hold party office and cannot stand for leader', () => {
    const game = makeGame();
    game.player.officeId = 'speaker';
    game.player.flags._isSpeaker = true;
    expect(canHoldOffice(game)).toBe(false);
    expect(playerCanStandForLeader(game)).toBe(false);
  });

  it('an Independent cannot stand for leader', () => {
    const game = makeGame(42, 'ind');
    expect(canHoldOffice(game)).toBe(false);
    expect(playerCanStandForLeader(game)).toBe(false);
  });
});

describe('wave 7: the Speaker contest', () => {
  function standRate(
    stats: { integrity: number; profile: number; competence: number },
    incumbent = false, runs = 60
  ): number {
    let wins = 0;
    for (let i = 0; i < runs; i++) {
      const game = makeGame(1000 + i);
      game.player.stats = { ...game.player.stats, ...stats };
      if (incumbent) game.player.flags._isSpeaker = true;
      const rng = new Rng(3000 + i);
      const card = materializeForced(game, rng, { kind: 'speakerContest' });
      resolveForcedChoice(game, rng, card, 0); // stand
      if (game.player.officeId === 'speaker' && game.player.flags._isSpeaker) wins++;
    }
    return wins / runs;
  }

  it('a low-calibre backbencher almost never wins the Chair', () => {
    const rate = standRate({ integrity: 40, profile: 40, competence: 40 });
    expect(rate).toBeLessThan(0.1);
  });

  it('a high-integrity, high-profile member wins it some of the time', () => {
    const rate = standRate({ integrity: 85, profile: 80, competence: 75 });
    expect(rate).toBeGreaterThan(0.2);
  });

  it('incumbency makes re-election markedly easier', () => {
    const fresh = standRate({ integrity: 70, profile: 65, competence: 65 }, false);
    const sitting = standRate({ integrity: 70, profile: 65, competence: 65 }, true);
    expect(sitting).toBeGreaterThan(fresh);
  });
});

describe('wave 7: legacy honours', () => {
  it('reports the Speaker of the House as a top-tier honour', () => {
    const game = makeGame();
    game.player.flags._wasSpeaker = true;
    expect(buildLegacy(game).highestOfficeTitle).toBe('Speaker of the House of Commons');
  });

  it('reports Deputy Prime Minister above a plain cabinet seat', () => {
    const game = makeGame();
    game.player.flags._everDeputyPM = true;
    // a former cabinet minister who was also deputy
    game.history.push({
      kind: 'roleChange', date: game.day, officeId: 'sos_health', how: 'appointed',
      roleSide: 'gov', partyId: 'con',
    });
    expect(buildLegacy(game).highestOfficeTitle).toBe('Deputy Prime Minister');
  });
});
