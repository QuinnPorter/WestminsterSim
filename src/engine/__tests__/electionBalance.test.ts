// Regression guard for the softened seat model (mainstream swing amplifier 1.6→1.5,
// WINNER_BONUS 0.008→0.007). Drives many deterministically-seeded careers and checks
// that blowout 400+ majorities are a touch rarer and that a party trailing in the
// popular vote rarely holds a 400+ landslide — without suppressing majorities overall.
// Reverting the constants pushes these numbers back over the thresholds (the pre-tune
// model gave ~30% 400+ and ~2x the sub-plurality landslides on the same seeds).
import { describe, it, expect } from 'vitest';
import { Era, GameState, PartyId } from '../../types/game';
import { createNewGame } from '../newGame';
import { initCalendar, nextStep } from '../scheduler';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from '../turn';
import { Rng } from '../rng';

function runCareer(seed: number, years: number, era: Era): GameState {
  const rng = new Rng(seed ^ 0x5eed);
  const partyId: PartyId = era === '2024'
    ? (rng.chance(0.5) ? 'lab' : 'con')
    : (rng.chance(0.5) ? 'con' : 'lab');
  const game = createNewGame({
    name: 'Sim', gender: 'f', age: 38,
    region: rng.pick(['london', 'northWest', 'southEast', 'scotland', 'wales'] as const),
    background: rng.pick(['lawyer', 'teacher', 'advisor', 'business', 'doctor'] as const),
    partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era, seed,
  });
  initCalendar(game);
  const g = new Rng(game.rngState);
  nextStep(game, g);
  const endDay = game.startDay + years * 365;
  let steps = 0;
  while (!game.gameOver && game.day < endDay && steps < years * 40) {
    steps++;
    if (game.pendingElectionId) { acknowledgeElectionCore(game, g); continue; }
    const card = game.currentCard;
    if (!card) { nextStep(game, g); continue; }
    const choiceIndex = g.chance(0.65) ? 0 : g.int(0, card.choices.length - 1);
    resolveChoiceCore(game, g, choiceIndex);
    continueCore(game, g);
  }
  return game;
}

describe('election balance (softened amplifier + winner bonus)', () => {
  it('keeps majorities common but makes 400+ landslides a touch rarer', () => {
    const eras: Era[] = ['2015', '2017', '2019', '2024'];
    let nElections = 0, nMajority = 0, n400 = 0, nSubPlurality = 0;
    const CAREERS = 240, YEARS = 30;
    for (let i = 0; i < CAREERS; i++) {
      const game = runCareer(50000 + i, YEARS, eras[i % eras.length]);
      for (const e of Object.values(game.elections)) {
        nElections++;
        const topSeat = (Object.entries(e.seats) as [PartyId, number][])
          .sort((a, b) => b[1] - a[1])[0];
        const maxSeats = topSeat?.[1] ?? 0;
        if (e.outcome === 'majority') nMajority++;
        if (maxSeats >= 400) {
          n400++;
          const topVote = (Object.entries(e.voteShares) as [PartyId, number][])
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0];
          if (topVote !== topSeat?.[0]) nSubPlurality++; // seat-winner trailed in votes
        }
      }
    }

    // sanity
    expect(nElections).toBeGreaterThan(1000);
    // majorities stay common (the softening must not gut decisive results)
    expect(nMajority / nElections).toBeGreaterThan(0.50);
    expect(nMajority / nElections).toBeLessThan(0.82);
    // 400+ landslides: a touch rarer than the old model (~30% on these seeds)
    expect(n400 / nElections).toBeLessThan(0.30);
    // a party trailing in the popular vote rarely keeps a 400+ landslide
    // (old model produced ~2x as many of these on the same seeds)
    expect(nSubPlurality).toBeLessThan(12);
  });
});
