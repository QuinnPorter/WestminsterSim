// The out-of-Parliament "wilderness" decision is now a ONE-TIME choice: picking it
// jumps the clock to the next general-election window instead of re-prompting every
// few months. This verifies exactly one wilderness card, a large time jump, and that
// the next thing the player faces is the election (a campaign), not another wilderness.
import { describe, it, expect } from 'vitest';
import { DrawnCard } from '../../types/game';
import { createNewGame } from '../newGame';
import { initCalendar, nextStep } from '../scheduler';
import { continueCore, resolveChoiceCore } from '../turn';
import { Rng } from '../rng';

describe('wilderness (lost-seat) flow', () => {
  it('is a single decision that fast-forwards to the next election', () => {
    const game = createNewGame({
      name: 'Out', gender: 'f', age: 40, region: 'northWest',
      background: 'teacher', partyId: 'lab', era: '2019',
      avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
      seed: 7,
    });
    initCalendar(game);
    const rng = new Rng(game.rngState);
    // typed accessor so flow-narrowing on the reset below doesn't collapse to `never`
    const cur = (): DrawnCard | null => game.currentCard;

    // put the player out of Parliament, well before the next election
    game.player.hasSeat = false;
    game.player.officeId = null;
    game.parliamentStart = game.day;          // yearsIn ~0 → no snap-election temptation
    game.nextElectionBy = game.day + 1200;    // ~3.3 years out
    game.currentCard = null;
    game.forcedQueue = [];

    // reach the wilderness card (tolerate an incidental calendar card)
    nextStep(game, rng);
    let guard = 0;
    let c = cur();
    while (c && c.kind !== 'wilderness' && guard++ < 20) {
      resolveChoiceCore(game, rng, 0);
      continueCore(game, rng);
      c = cur();
    }
    expect(cur()?.kind).toBe('wilderness');

    // make the one-time choice and dismiss it
    const dayAtChoice = game.day;
    resolveChoiceCore(game, rng, 0);
    expect(cur()?.outcome).toBeTruthy();
    continueCore(game, rng);

    // the clock should have jumped most of the parliament (far more than the old
    // 150–200 day step), and we should NOT be looking at another wilderness card
    expect(game.day - dayAtChoice).toBeGreaterThan(300);
    expect(cur()?.kind).not.toBe('wilderness');

    // the player is now contesting the general election (campaign queued/showing)
    const cc = cur();
    const inElection =
      cc?.kind === 'campaign' ||
      cc?.kind === 'electionNight' ||
      game.pendingElectionId !== null;
    expect(inElection).toBe(true);
  });
});
