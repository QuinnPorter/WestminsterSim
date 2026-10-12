import { describe, expect, it } from 'vitest';
import { Era, GameState, PartyId } from '../../types/game';
import { PARTIES } from '../../data/parties';
import { createNewGame } from '../newGame';
import { initCalendar, nextStep } from '../scheduler';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from '../turn';
import { Rng } from '../rng';

/**
 * The Commons random stream is pinned.
 *
 * Every Westminster career is a deterministic function of its seed. The balance
 * suite (`electionBalance.test.ts`) was tuned against that stream on fixed seeds,
 * with thin margins, so an engine change that consumes one more or one fewer
 * random number on a Commons tick re-rolls thousands of career-years and can
 * trip those thresholds for reasons that have nothing to do with balance.
 *
 * This test hashes the generated GB seat map and the course of a twelve-year
 * career for a handful of seeds and eras. Northern Ireland seats and the parties
 * that only stand there are left out of the hash on purpose: the NI ballot moves
 * them on its own stream, and that is allowed to change. Everything else is not.
 *
 * If this test fails, the change moved the Commons stream. Either make the new
 * work draw from its own stream (see the NI ballot's `rngState`), or re-baseline
 * in a commit of its own whose message says what model change justified it, and
 * confirm `electionBalance.test.ts` is still green.
 */

const SEEDS = [11, 23, 37];
const ERAS: Era[] = ['2010', '2015', '2017', '2019', '2024'];

/** parties whose seats live only in Northern Ireland, plus independents (the
 *  only independents in any starting matrix sit in NI seats) */
const NI_ONLY = new Set<PartyId>(
  (Object.keys(PARTIES) as PartyId[]).filter((p) => {
    const regions = PARTIES[p].contestsRegions;
    return regions.length > 0 && regions.every((r) => r === 'ni');
  }).concat(['ind'])
);

function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function round(x: number | undefined): number {
  return Math.round((x ?? 0) * 1e6) / 1e6;
}

function gbShares(shares: Partial<Record<PartyId, number>>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of Object.keys(shares).sort() as PartyId[]) {
    if (NI_ONLY.has(p)) continue;
    out[p] = round(shares[p]);
  }
  return out;
}

function newGame(seed: number, era: Era): GameState {
  const partyId: PartyId = era === '2024' ? 'lab' : 'con';
  return createNewGame({
    name: 'Pin Subject', gender: 'f', age: 38, region: 'london', background: 'lawyer',
    partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era, seed,
  });
}

function seatMapHash(game: GameState): string {
  const rows = game.seatMap
    .filter((s) => s.region !== 'ni')
    .map((s) => ({ id: s.id, name: s.name, region: s.region, winner: s.winner, shares: gbShares(s.shares) }));
  return fnv1a(JSON.stringify(rows));
}

/** the same policy `simulateCareer` uses, kept local so the pin does not move
 *  when that helper's reporting changes */
function runCareer(game: GameState, years: number): void {
  initCalendar(game);
  const rng = new Rng(game.rngState);
  nextStep(game, rng);
  const endDay = game.startDay + years * 365;
  let steps = 0;
  while (!game.gameOver && game.day < endDay && steps < years * 40) {
    steps++;
    if (game.pendingElectionId) { acknowledgeElectionCore(game, rng); continue; }
    const card = game.currentCard;
    if (!card) {
      nextStep(game, rng);
      if (!game.currentCard && !game.pendingElectionId && !game.gameOver) {
        throw new Error(`engine stalled on day ${game.day}`);
      }
      continue;
    }
    const choice = rng.chance(0.65) ? 0 : rng.int(0, card.choices.length - 1);
    resolveChoiceCore(game, rng, choice);
    continueCore(game, rng);
  }
  game.rngState = rng.state;
}

function careerHash(game: GameState): string {
  const elections = Object.values(game.elections)
    .sort((a, b) => a.date - b.date)
    .map((e) => ({
      date: e.date,
      seats: gbShares(e.seats as Partial<Record<PartyId, number>>),
      voteShares: gbShares(e.voteShares),
      governingParty: e.governingParty,
      outcome: e.outcome,
      playerHeldSeat: e.playerHeldSeat,
      playerShare: round(e.playerResult?.candidates.find((c) => c.partyId === game.player.partyId)?.share),
    }));
  const tail = {
    day: game.day,
    rngState: game.rngState,
    officeId: game.player.officeId,
    stats: game.player.stats,
    governing: game.government.governingParty,
    opposition: game.government.oppositionParty,
    arrangement: game.government.arrangement,
    polling: gbShares(game.polling.shares),
  };
  return fnv1a(JSON.stringify({ elections, tail }));
}

/** captured at bcf4998, before the Northern Ireland work */
const PINNED: Record<string, { seatMap: string; career: string }> = {
  '2010/11': { seatMap: 'ba9b3149', career: '8df2b17f' },
  '2010/23': { seatMap: '872c3f52', career: '64f75603' },
  '2010/37': { seatMap: '251f55b5', career: '767ffb4c' },
  '2015/11': { seatMap: '83f74798', career: '21ce959d' },
  '2015/23': { seatMap: '1929c8c7', career: 'fc97059c' },
  '2015/37': { seatMap: '7450fc1b', career: '9bb6893a' },
  '2017/11': { seatMap: '943a3e13', career: 'd12ac933' },
  '2017/23': { seatMap: 'd67ee6b0', career: '0bdd3947' },
  '2017/37': { seatMap: '9654b4e8', career: '3a29889b' },
  '2019/11': { seatMap: '1117c0e3', career: 'ab4f91f2' },
  '2019/23': { seatMap: 'b39c1aa8', career: 'ba89cbcc' },
  '2019/37': { seatMap: 'e4e143dc', career: '0b0780a7' },
  '2024/11': { seatMap: 'fbb97dae', career: '8875ef0b' },
  '2024/23': { seatMap: '0f9dee39', career: '67fd20f0' },
  '2024/37': { seatMap: 'fee3bb1b', career: 'f1a82553' },
};

describe('the Commons random stream is pinned', () => {
  for (const era of ERAS) {
    for (const seed of SEEDS) {
      const key = `${era}/${seed}`;
      it(`seat map and a twelve-year career are unchanged for ${key}`, () => {
        const game = newGame(seed, era);
        const seatMap = seatMapHash(game);
        runCareer(game, 12);
        const career = careerHash(game);
        const pinned = PINNED[key];
        if (!pinned) {
          // first run: print the values to paste into PINNED
          console.log(`PIN ${key} ${seatMap} ${career}`);
        }
        expect(pinned, `no pin recorded for ${key}`).toBeDefined();
        expect(seatMap).toBe(pinned.seatMap);
        expect(career).toBe(pinned.career);
      });
    }
  }
});
