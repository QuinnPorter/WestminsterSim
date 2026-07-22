import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  openLeadershipVacancy, materializeForced, resolveForcedChoice,
} from '../career';
import { Rng } from '../rng';
import { GameState } from '../../types/game';

function makeGame(seed: number): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}
const MID = { profile: 60, partyStanding: 62, competence: 60, constituencyApproval: 55, integrity: 55 };

/** the shape the vacancy actually opens as, read off the queued opener card */
function openerShape(seed: number): string {
  const game = makeGame(seed);
  const rng = new Rng(seed * 3 + 1);
  game.player.officeId = 'sos_home';
  game.player.stats = { ...MID };
  openLeadershipVacancy(game, rng, 'con');
  const ev = game.forcedQueue.find((e) => e.kind === 'leadershipStand' || e.kind === 'leadershipNomination');
  if (!ev) return 'none';
  if (ev.kind === 'leadershipNomination') return 'coronation';
  return (ev.payload?.shape as string) ?? 'standard';
}

describe('contest shape frequencies', () => {
  const counts: Record<string, number> = {};
  const runs = 600;
  for (let i = 0; i < runs; i++) {
    const s = openerShape(9000 + i * 13);
    counts[s] = (counts[s] ?? 0) + 1;
  }
  const rate = (k: string) => (counts[k] ?? 0) / runs;

  it('coronations are uncommon but real (3–15%)', () => {
    expect(rate('coronation')).toBeGreaterThan(0.03);
    expect(rate('coronation')).toBeLessThan(0.15);
  });

  it('two-horse races are occasional (8–25%)', () => {
    expect(rate('twoHorse')).toBeGreaterThan(0.08);
    expect(rate('twoHorse')).toBeLessThan(0.25);
  });

  it('the standard multi-candidate field is the common case', () => {
    expect(rate('standard')).toBeGreaterThan(0.55);
  });
});

describe('nomination stage — squeeze and scramble', () => {
  /** find a seed that produces the given nomination mode, then drive its resolution */
  function findNomination(mode: 'squeeze' | 'scramble', strong: boolean): { game: GameState; rng: Rng } | null {
    for (let seed = 1; seed < 4000; seed++) {
      const game = makeGame(seed);
      const rng = new Rng(seed * 5 + 2);
      game.player.officeId = strong ? 'sos_treasury' : 'sos_culture';
      game.player.stats = strong
        ? { profile: 94, partyStanding: 95, competence: 94, constituencyApproval: 86, integrity: 78 }
        : { ...MID };
      openLeadershipVacancy(game, rng, 'con');
      const ev = game.forcedQueue.find((e) => e.kind === 'leadershipNomination');
      if (ev && ev.payload?.mode === mode) return { game, rng };
    }
    return null;
  }

  it('a dominant player is offered a squeeze (heir-apparent coronation)', () => {
    const found = findNomination('squeeze', true);
    expect(found).not.toBeNull();
    const { game, rng } = found!;
    const ev = game.forcedQueue.shift()!;
    const card = materializeForced(game, rng, ev);
    expect(card.title).toBe('The heir apparent');
    // "move fast — lock up the nominations" leads to a coronation with a soft mandate
    resolveForcedChoice(game, rng, card, 0);
    // either an immediate coronation (soft mandate) or a forced contest if the squeeze failed
    const crowned = game.player.officeId === 'leader';
    const contesting = game.forcedQueue.some((e) => e.kind === 'leadershipEpisode' || e.kind === 'leadershipBallot');
    expect(crowned || contesting).toBe(true);
    if (crowned) expect(game.player.flags._softMandate).toBeDefined();
  });

  it('a player facing a locked-up field is offered a scramble', () => {
    const found = findNomination('scramble', false);
    expect(found).not.toBeNull();
    const { game, rng } = found!;
    const ev = game.forcedQueue.shift()!;
    const card = materializeForced(game, rng, ev);
    expect(card.title).toBe('Locked out?');
    // endorsing the heir early (choice 1) crowns an NPC and warms the leader relationship
    resolveForcedChoice(game, rng, card, 1);
    expect(game.player.officeId).not.toBe('leader');
    expect(game.player.hasSeat).toBe(true);
  });
});
