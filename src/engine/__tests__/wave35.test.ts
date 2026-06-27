import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  materializeForced, resolveForcedChoice, giveOffice, reconcilePlayerDeputy, playerOfficeTitle,
  applyElectionAftermath,
} from '../career';
import { buildDeputySpans, buildOfficeSpans } from '../../screens/ProfileScreen';
import { DrawnCard, ElectionResult, GameState } from '../../types/game';
import { Rng } from '../rng';

function makeGame(seed = 7) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'yorkshire',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

function setLeaderRegard(game: GameState, value: number) {
  const rel = game.relationships.find((r) => r.kind === 'leader');
  if (rel) rel.value = value;
}

function offerCard(officeId: string, keepDeputy?: boolean): DrawnCard {
  return {
    cardId: 'x', kind: 'reshuffleOffer', title: 'The call', body: '',
    choices: [{ label: 'Accept' }, { label: 'Decline' }],
    payload: { officeId, ...(keepDeputy !== undefined ? { keepDeputy } : {}) },
  };
}

describe('wave 35A — the Deputy-PM / First Secretary overlay shows in the timeline', () => {
  it('opens an overlay span on appointment and closes it when the role is lost', () => {
    const game = makeGame();
    game.day += 100;
    giveOffice(game, new Rng(1), 'sos_health', 'appointed'); // a brief, on the office track
    // accept the Deputy-PM offer
    game.day += 200;
    const card = materializeForced(game, new Rng(2), { kind: 'deputyPmOffer' });
    resolveForcedChoice(game, new Rng(3), card, 0);
    expect(game.player.flags._isDeputyPM).toBe(true);
    let dep = buildDeputySpans(game.history);
    expect(dep).toHaveLength(1);
    expect(dep[0].end).toBeNull(); // ongoing

    // moved to a new brief WITHOUT keeping the deputy title → overlay closes
    game.day += 300;
    giveOffice(game, new Rng(4), 'sos_education', 'appointed'); // keepDeputy defaults false
    expect(game.player.flags._isDeputyPM).toBeFalsy();
    dep = buildDeputySpans(game.history);
    expect(dep).toHaveLength(1);
    expect(dep[0].end).not.toBeNull(); // ended when removed
    // the brief track is intact and unaffected (Health then Education)
    const office = buildOfficeSpans(game.history);
    expect(office.some((s) => s.officeId === 'sos_education')).toBe(true);
    expect(office.some((s) => s.officeId === 'sos_health')).toBe(true);
  });
});

describe('wave 35B — keeping the deputy title across a move is the PM\'s call, stated up front', () => {
  it('the move offer states whether the deputy post survives, and carries a keepDeputy flag', () => {
    const game = makeGame();
    giveOffice(game, new Rng(1), 'sos_health', 'appointed');
    game.player.flags._isDeputyPM = true;
    game.government.deputyPmId = 'player';
    game.government.deputyTitle = 'firstSec';
    const card = materializeForced(game, new Rng(5), { kind: 'reshuffleOffer', payload: { officeId: 'sos_home' } });
    expect(typeof card.payload?.keepDeputy).toBe('boolean');
    expect(card.body).toMatch(/First Secretary of State|Deputy Prime Minister/);
  });

  it('keepDeputy:true retains the title across the move; keepDeputy:false drops it', () => {
    for (const keep of [true, false]) {
      const game = makeGame();
      giveOffice(game, new Rng(1), 'sos_health', 'appointed');
      game.player.flags._isDeputyPM = true;
      game.government.deputyPmId = 'player';
      game.government.deputyTitle = 'firstSec';
      resolveForcedChoice(game, new Rng(2), offerCard('sos_home', keep), 0);
      expect(game.player.officeId).toBe('sos_home');
      expect(!!game.player.flags._isDeputyPM).toBe(keep);
    }
  });

  it('the PM\'s regard makes retention more likely', () => {
    const keepRate = (regard: number, standing: number) => {
      let kept = 0; const runs = 200;
      for (let i = 0; i < runs; i++) {
        const game = makeGame(100 + i);
        giveOffice(game, new Rng(i), 'sos_health', 'appointed');
        game.player.flags._isDeputyPM = true;
        game.government.deputyPmId = 'player';
        game.government.deputyTitle = 'firstSec';
        game.player.stats.partyStanding = standing;
        setLeaderRegard(game, regard);
        const card = materializeForced(game, new Rng(500 + i), { kind: 'reshuffleOffer', payload: { officeId: 'sos_home' } });
        if (card.payload?.keepDeputy === true) kept++;
      }
      return kept / runs;
    };
    expect(keepRate(80, 80)).toBeGreaterThan(keepRate(-40, 40));
  });
});

describe('wave 35C — the PM can remove you as deputy', () => {
  function removalCard(sacked: boolean): DrawnCard {
    return {
      cardId: 'x', kind: 'deputyRemoval', title: 'Reshuffle', body: '',
      choices: [{ label: 'Accept' }, { label: 'Protest' }],
      payload: { sacked },
    };
  }

  it('demotion keeps the department; a sacking leaves the cabinet', () => {
    // demotion
    const a = makeGame();
    giveOffice(a, new Rng(1), 'sos_health', 'appointed');
    a.player.flags._isDeputyPM = true;
    a.government.deputyPmId = 'player'; a.government.deputyTitle = 'firstSec';
    resolveForcedChoice(a, new Rng(2), removalCard(false), 0);
    expect(a.player.flags._isDeputyPM).toBeFalsy();
    expect(a.player.officeId).toBe('sos_health'); // kept the brief

    // sacking
    const b = makeGame();
    giveOffice(b, new Rng(1), 'sos_health', 'appointed');
    b.player.flags._isDeputyPM = true;
    b.government.deputyPmId = 'player'; b.government.deputyTitle = 'firstSec';
    resolveForcedChoice(b, new Rng(2), removalCard(true), 0);
    expect(b.player.flags._isDeputyPM).toBeFalsy();
    expect(b.player.officeId).toBeNull(); // out of the cabinet
  });
});

describe('wave 35D — no shadow Deputy PM', () => {
  it('drops the deputy overlay when the player falls into opposition', () => {
    const game = makeGame(); // 2019: con governs, player is con (in government)
    giveOffice(game, new Rng(1), 'sos_health', 'appointed');
    game.player.flags._isDeputyPM = true;
    game.government.deputyPmId = 'player';
    game.government.deputyTitle = 'firstSec';
    reconcilePlayerDeputy(game);
    expect(game.player.flags._isDeputyPM).toBe(true); // still in government → kept

    // a change of government drops the player's party into opposition
    game.government.governingParty = 'lab';
    game.government.oppositionParty = 'con';
    delete game.government.coalitionPartner;
    reconcilePlayerDeputy(game);
    expect(game.player.flags._isDeputyPM).toBeFalsy();
    expect(game.government.deputyPmId).not.toBe('player');
    expect(playerOfficeTitle(game)).not.toMatch(/Deputy Prime Minister|First Secretary/);
    // ...and the player is told via a news headline
    const news = game.history.filter((h) => h.kind === 'event') as { headline: string }[];
    expect(news.some((h) => /First Secretary|Deputy Prime Minister/.test(h.headline))).toBe(true);
  });
});

function deputyGame(seed: number, regard: number, standing = 70) {
  const game = makeGame(seed);
  giveOffice(game, new Rng(seed), 'sos_health', 'appointed');
  game.player.flags._isDeputyPM = true;
  game.government.deputyPmId = 'player';
  game.government.deputyTitle = 'firstSec';
  game.player.stats.partyStanding = standing;
  setLeaderRegard(game, regard);
  return game;
}

function conMajority(game: GameState, governingParty: 'con' | 'lab'): ElectionResult {
  return {
    id: 'ge', date: game.day + 100,
    seats: { con: 360, lab: 230, ld: 30, snp: 20, reform: 8, green: 2 } as GameState['seats'],
    voteShares: { con: 0.44, lab: 0.30, ld: 0.10, snp: 0.05, reform: 0.07, green: 0.04 },
    playerResult: null, outcome: 'majority', governingParty, playerHeldSeat: true,
  };
}

describe('wave 36 — the Deputy PM is not auto-dropped at every election', () => {
  function keptRate(regard: number, runs = 120): number {
    let kept = 0;
    for (let i = 0; i < runs; i++) {
      const game = deputyGame(700 + i, regard);
      const result = conMajority(game, 'con'); // player's party stays in government
      game.day += 100; game.seats = { ...result.seats };
      applyElectionAftermath(game, new Rng(1500 + i), result, true);
      if (game.player.flags._isDeputyPM) kept++;
    }
    return kept / runs;
  }

  it('retention varies with the PM\'s regard — never automatic either way', () => {
    const high = keptRate(80);
    const low = keptRate(-40);
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThan(1);  // not kept every time
    expect(low).toBeGreaterThan(0); // not dropped every time
  });

  it('losing government always drops the role, and tells the player', () => {
    const game = deputyGame(50, 90);
    const result = conMajority(game, 'lab'); // Labour now governs → player (con) in opposition
    game.day += 100; game.seats = { ...result.seats };
    applyElectionAftermath(game, new Rng(9), result, true);
    expect(game.player.flags._isDeputyPM).toBeFalsy();
    const news = game.history.filter((h) => h.kind === 'event') as { headline: string }[];
    expect(news.some((h) => /First Secretary|Deputy Prime Minister/.test(h.headline))).toBe(true);
  });
});

describe('reshuffle offer — half forced "accept or resign", half a gentle suggestion', () => {
  function forcedCard(officeId: string): DrawnCard {
    return {
      cardId: 'x', kind: 'reshuffleOffer', title: 'Reshuffled', body: '',
      choices: [{ label: 'Accept the move' }, { label: 'Resign instead' }],
      payload: { officeId, forced: true },
    };
  }

  it('forced + resign drops the player to the backbenches (integrity up)', () => {
    const game = makeGame();
    giveOffice(game, new Rng(1), 'sos_health', 'appointed');
    expect(game.player.officeId).toBe('sos_health');
    const integrityBefore = game.player.stats.integrity;
    resolveForcedChoice(game, new Rng(2), forcedCard('sos_defence'), 1);
    expect(game.player.officeId).toBeNull();
    expect(game.player.stats.integrity).toBeGreaterThan(integrityBefore);
  });

  it('the gentle suggestion decline still keeps the post (no forced flag)', () => {
    const game = makeGame();
    giveOffice(game, new Rng(1), 'sos_health', 'appointed');
    resolveForcedChoice(game, new Rng(2), offerCard('sos_defence'), 1);
    expect(game.player.officeId).toBe('sos_health');
  });

  it('forced + accept still moves the player into the new brief', () => {
    const game = makeGame();
    giveOffice(game, new Rng(1), 'sos_health', 'appointed');
    resolveForcedChoice(game, new Rng(2), forcedCard('sos_defence'), 0);
    expect(game.player.officeId).toBe('sos_defence');
  });

  it('a sideways move to an office-holder is forced ~half the time; a promotion never is', () => {
    let forced = 0;
    for (let i = 0; i < 200; i++) {
      const game = makeGame(i + 1);
      giveOffice(game, new Rng(i), 'sos_health', 'appointed');
      const card = materializeForced(game, new Rng(i * 13 + 1), {
        kind: 'reshuffleOffer', payload: { officeId: 'sos_defence', sideways: true },
      });
      if (card.choices[1].label === 'Resign instead') forced++;
    }
    expect(forced).toBeGreaterThan(60);
    expect(forced).toBeLessThan(140);
    // a promotion (sideways:false) is never forced — keeps the free decline
    const game = makeGame();
    giveOffice(game, new Rng(1), 'min_health', 'appointed');
    const promo = materializeForced(game, new Rng(5), {
      kind: 'reshuffleOffer', payload: { officeId: 'sos_defence', sideways: false },
    });
    expect(promo.choices[1].label).toBe('Politely decline');
  });
});
