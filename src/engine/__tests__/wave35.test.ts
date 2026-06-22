import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  materializeForced, resolveForcedChoice, giveOffice, reconcilePlayerDeputy, playerOfficeTitle,
} from '../career';
import { buildDeputySpans, buildOfficeSpans } from '../../screens/ProfileScreen';
import { DrawnCard, GameState } from '../../types/game';
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
  });
});
