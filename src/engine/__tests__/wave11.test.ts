import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  playerOfficeTitle, giveOffice, buildLegacy, materializeForced, resolveForcedChoice, pickCommittee,
} from '../career';
import { cardEligible } from '../cardEngine';
import { COMMITTEE_CARDS } from '../../content/cards/committee';
import { validateCards, ALL_CARDS } from '../../content/cards';
import { GameState } from '../../types/game';
import { Rng } from '../rng';

function makeGame(seed = 42, partyId: CreationInput['partyId'] = 'con') {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'yorkshire',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

function runContest(game: GameState, rng: Rng, incumbent = false): GameState {
  const dept = pickCommittee(game, rng);
  const card = materializeForced(game, rng, { kind: 'committeeChairContest', payload: { dept, incumbent } });
  resolveForcedChoice(game, rng, card, 0); // stand
  return game;
}

describe('wave 11 — winning & holding a committee chair', () => {
  it('a strong backbencher can win the chair; the title and flags update', () => {
    let won = 0;
    for (let i = 0; i < 30; i++) {
      const game = makeGame(100 + i);
      game.player.stats = { ...game.player.stats, competence: 80, profile: 75, partyStanding: 70, integrity: 65, constituencyApproval: 60 };
      runContest(game, new Rng(900 + i));
      if (game.player.committeeChair) {
        won++;
        expect(game.player.flags._committeeChair).toBe(true);
        expect(game.player.flags._wasCommitteeChair).toBe(true);
        expect(playerOfficeTitle(game)).toContain('Select Committee');
      }
    }
    expect(won).toBeGreaterThan(20); // a strong candidate wins most of the time
  });

  it('a weak backbencher almost never wins', () => {
    let won = 0;
    for (let i = 0; i < 30; i++) {
      const game = makeGame(200 + i);
      game.player.stats = { ...game.player.stats, competence: 35, profile: 30, partyStanding: 35, integrity: 35, constituencyApproval: 40 };
      runContest(game, new Rng(1300 + i));
      if (game.player.committeeChair) won++;
    }
    expect(won).toBeLessThan(8);
  });

  it('an incumbent re-wins more easily than a fresh candidate', () => {
    const rate = (incumbent: boolean) => {
      let won = 0;
      for (let i = 0; i < 40; i++) {
        const game = makeGame(300 + i);
        game.player.stats = { ...game.player.stats, competence: 58, profile: 55, partyStanding: 55, integrity: 50, constituencyApproval: 50 };
        if (incumbent) { game.player.committeeChair = 'treasury'; game.player.flags._committeeChair = true; }
        const card = materializeForced(game, new Rng(2000 + i), { kind: 'committeeChairContest', payload: { dept: 'treasury', incumbent } });
        resolveForcedChoice(game, new Rng(2000 + i), card, 0);
        if (game.player.committeeChair) won++;
      }
      return won / 40;
    };
    expect(rate(true)).toBeGreaterThan(rate(false));
  });

  it('a non-backbencher (minister) gets a no-op — the queued contest passes them by', () => {
    const game = makeGame();
    game.player.officeId = 'sos_health'; // now a minister, ineligible to chair
    const card = materializeForced(game, new Rng(7), { kind: 'committeeChairContest', payload: { dept: 'health' } });
    resolveForcedChoice(game, new Rng(7), card, 0);
    expect(game.player.committeeChair == null).toBe(true);
  });
});

describe('wave 11 — losing the chair', () => {
  it('taking a frontbench office gives up the chair', () => {
    const game = makeGame();
    game.player.committeeChair = 'treasury';
    game.player.flags._committeeChair = true;
    giveOffice(game, new Rng(1), 'min_health', 'appointed');
    expect(game.player.committeeChair == null).toBe(true);
    expect(game.player.flags._committeeChair).toBeFalsy();
  });
});

describe('wave 11 — committee chair shows in the career timeline', () => {
  it('records a committeeTenure span (start on win, end on giving it up)', () => {
    const game = makeGame();
    game.player.stats = { ...game.player.stats, competence: 85, profile: 80, partyStanding: 75, integrity: 70, constituencyApproval: 60 };
    // stand and win
    let won = false;
    for (let i = 0; i < 20 && !won; i++) {
      const g = makeGame(500 + i);
      g.player.stats = { ...game.player.stats };
      runContest(g, new Rng(4000 + i));
      if (g.player.committeeChair) {
        const starts = g.history.filter((h) => h.kind === 'committeeTenure' && h.action === 'start');
        expect(starts.length).toBe(1);
        // give it up by taking office → an end span is recorded
        giveOffice(g, new Rng(1), 'min_health', 'appointed');
        const ends = g.history.filter((h) => h.kind === 'committeeTenure' && h.action === 'end');
        expect(ends.length).toBe(1);
        won = true;
      }
    }
    expect(won).toBe(true);
  });
});

describe('wave 11 — committee cards & token', () => {
  it('all committee cards validate within the full pool', () => {
    expect(validateCards(ALL_CARDS)).toEqual([]);
    expect(COMMITTEE_CARDS.length).toBeGreaterThanOrEqual(5);
  });

  it('committee cards are eligible only while chairing', () => {
    const game = makeGame();
    const card = COMMITTEE_CARDS.find((c) => c.id === 'cmt_launch_inquiry')!;
    expect(cardEligible(game, card)).toBe(false);
    game.player.committeeChair = 'treasury';
    game.player.flags._committeeChair = true;
    expect(cardEligible(game, card)).toBe(true);
  });
});

describe('wave 11 — legacy', () => {
  it('an ever-chair who never reached cabinet is recognised', () => {
    const game = makeGame();
    game.player.flags._wasCommitteeChair = true;
    const legacy = buildLegacy(game);
    expect(legacy.highestOfficeTitle).toBe('Select Committee Chair');
  });
});
