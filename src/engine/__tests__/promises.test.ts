import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  materializeForced, resolveForcedChoice, leadershipRecordScore,
} from '../career';
import { migrateGameState } from '../../store/gameStore';
import { Rng } from '../rng';
import { Character, GameState } from '../../types/game';

function makeGame(seed = 1): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

/** an active NPC in the governing party we can pledge an office to */
function anNpc(game: GameState): Character {
  const c = Object.values(game.characters).find(
    (x) => x.active && x.partyId === game.government.governingParty && x.id !== 'player'
  );
  if (!c) throw new Error('no NPC found');
  return c;
}

describe('promise ledger migration', () => {
  it('backfills an empty promises array on an old save', () => {
    const game = makeGame();
    delete (game.player as { promises?: unknown }).promises;
    const migrated = migrateGameState(game);
    expect(migrated.player.promises).toEqual([]);
    expect(migrated.version).toBe(9);
  });
});

describe('honouring and breaking contest debts at the reshuffle', () => {
  function leaderWithDebt(seed: number): { game: GameState; debtor: Character } {
    const game = makeGame(seed);
    // make the player the sitting PM so the reshuffle is a government one
    game.player.officeId = 'leader';
    game.government.pmId = 'player';
    const debtor = anNpc(game);
    game.player.promises = [{
      characterId: debtor.id, officeId: 'sos_home', madeDay: game.day,
      context: 'endorsement', direction: 'made',
    }];
    return { game, debtor };
  }

  it('honouring appoints the pledged character to the promised office and clears the debt', () => {
    const { game, debtor } = leaderWithDebt(11);
    const rng = new Rng(3);
    // step one: debts only — the reshuffle tilt is a separate, later decision
    const card = materializeForced(game, rng, { kind: 'pmReshuffle' });
    expect(card.payload?.pledgeStep).toBe(true);
    expect(card.choices).toHaveLength(2);
    expect(card.choices[0].label).toContain('Honour');
    resolveForcedChoice(game, rng, card, 0); // honour
    expect(debtor.officeId).toBe('sos_home');
    const post = game.government.cabinet.find((p) => p.officeId === 'sos_home');
    expect(post?.characterId).toBe(debtor.id);
    expect(game.player.promises.some((p) => p.direction === 'made')).toBe(false);
    // step two is queued: the ordinary reshuffle card, with the tilt choices
    const next = game.forcedQueue.find((e) => e.kind === 'pmReshuffle');
    expect(next?.payload?.pledgesSettled).toBe(true);
    const second = materializeForced(game, rng, next!);
    expect(second.payload?.pledgeStep).toBeUndefined();
    expect(second.choices[0].label).toContain('Promote your loyalists');
  });

  // Regression: splitting the card into two steps made the decisions sequential rather
  // than exclusive, so the follow-up reshuffle could sack the very minister you just
  // paid. Every tilt on the second card must leave an honoured debtor in post.
  it('the reshuffle that follows cannot undo a debt you just honoured', () => {
    for (const pledged of ['sos_foreign', 'sos_home'] as const) {
      const game = makeGame(11);
      game.player.officeId = 'leader';
      game.government.pmId = 'player';
      const npcs = Object.values(game.characters).filter(
        (x) => x.active && x.partyId === game.government.governingParty && x.id !== 'player'
      );
      const debtor = npcs[0];
      // a beaten finalist is waiting for the unity olive branch — which targets sos_foreign
      game.player.flags._defeatedFinalistId = npcs[1].id;
      game.player.promises = [{
        characterId: debtor.id, officeId: pledged, madeDay: game.day,
        context: 'endorsement', direction: 'made',
      }];

      const rng = new Rng(3);
      const step1 = materializeForced(game, rng, { kind: 'pmReshuffle' });
      resolveForcedChoice(game, rng, step1, 0); // honour
      expect(debtor.officeId).toBe(pledged);

      const queued = game.forcedQueue.find((e) => e.kind === 'pmReshuffle')!;
      expect(queued.payload?.honouredOffices).toContain(pledged);
      const step2 = materializeForced(game, rng, queued);

      // Resolve EVERY tilt on the second card independently, across many seeds — the
      // churn picks posts at random, so a single seed can miss an eviction entirely
      // (that weakness let a broken build pass). None may ever evict the debtor.
      for (let i = 0; i < step2.choices.length; i++) {
        for (let seed = 1; seed <= 50; seed++) {
          const branch = structuredClone(game);
          resolveForcedChoice(branch, new Rng(seed * 7 + i), structuredClone(step2), i);
          const seat = branch.government.cabinet.find((p) => p.officeId === pledged);
          expect(seat?.characterId).toBe(debtor.id);
          expect(branch.characters[debtor.id].officeId).toBe(pledged);
        }
      }
    }
  });

  it('breaking sets the broken-promise flag and makes the jilted colleague a rival', () => {
    const { game, debtor } = leaderWithDebt(12);
    const rng = new Rng(4);
    const card = materializeForced(game, rng, { kind: 'pmReshuffle' });
    resolveForcedChoice(game, rng, card, 1); // break
    expect(game.player.flags._brokenPromises).toBe(1);
    const rival = game.relationships.find((r) => r.kind === 'rival');
    expect(rival?.characterId).toBe(debtor.id);
    expect((rival?.value ?? 0)).toBeLessThan(0);
    expect(game.player.promises.some((p) => p.direction === 'made')).toBe(false);
  });
});

describe('a promise-breaker\'s standing', () => {
  it('a broken promise lowers the leadership record score', () => {
    const clean = makeGame(20);
    clean.player.stats = { profile: 70, partyStanding: 70, competence: 70, constituencyApproval: 60, integrity: 60 };
    const scoreClean = leadershipRecordScore(clean);

    const broken = makeGame(20);
    broken.player.stats = { ...clean.player.stats };
    broken.player.flags._brokenPromises = 2;
    const scoreBroken = leadershipRecordScore(broken);

    expect(scoreBroken).toBeLessThan(scoreClean);
  });
});
