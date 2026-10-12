import { describe, expect, it } from 'vitest';
import { Era, GameState, PartyId } from '../../types/game';
import { PARTIES } from '../../data/parties';
import { createNewGame } from '../newGame';
import { runElection } from '../election';
import { updatePolling } from '../polling';
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
 * Two pins never move:
 *   - creation: the generated GB seat map and the PRNG state after `createNewGame`;
 *   - the first count: the GB seats, the GB vote and the PRNG state after the
 *     first general election is run straight from a fresh game. Northern Ireland
 *     is the last region in every matrix, so the state after the count asserts
 *     the exact number of draws made for NI seats too.
 * Both were captured on the tree before the Northern Ireland work (`314f7df`).
 *
 * The third pin, a twelve-year career, follows the whole simulation and so moves
 * whenever the world's results change (the first time: NI seats began to swing
 * and NI leader churn began to follow real gradients). It may be re-baselined,
 * in a commit of its own whose message says what model change justified it, with
 * `electionBalance.test.ts` green as the gate. The first two may not.
 *
 * NI seats and the parties that stand only in NI are left out of every hash on
 * purpose: their ballot moves them on its own stream, and that is allowed.
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

function gbSeatRows(game: GameState) {
  return game.seatMap
    .filter((s) => s.region !== 'ni')
    .map((s) => ({ id: s.id, name: s.name, region: s.region, winner: s.winner, shares: gbShares(s.shares) }));
}

function creationHash(game: GameState): string {
  return fnv1a(JSON.stringify({ seats: gbSeatRows(game), rngState: game.rngState }));
}

/** run the first general election straight from a fresh game */
function firstCountHash(game: GameState): string {
  const rng = new Rng(game.rngState);
  game.day = game.nextElectionBy;
  updatePolling(game, rng, game.day);
  const { result } = runElection(game, rng);
  return fnv1a(JSON.stringify({
    seats: gbSeatRows(game),
    standings: gbShares(result.seats as Partial<Record<PartyId, number>>),
    voteShares: gbShares(result.voteShares),
    polling: gbShares(game.polling.shares),
    rngState: rng.state,
  }));
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

/** captured at 314f7df, before the Northern Ireland work. Never re-baselined. */
const PINNED_CREATION: Record<string, string> = {
  '2010/11': '3a9d7e3c', '2010/23': 'b62a2fc5', '2010/37': 'd1e91eb3',
  '2015/11': '29ffc967', '2015/23': 'ed306f14', '2015/37': '6d9188c3',
  '2017/11': 'f7d0afde', '2017/23': '4e46eb47', '2017/37': '65c13748',
  '2019/11': '8f2134ea', '2019/23': '7ced6df9', '2019/37': 'fd12b823',
  '2024/11': 'c0dff8e4', '2024/23': '2ad465dc', '2024/37': '195619eb',
};
const PINNED_FIRST_COUNT: Record<string, string> = {
  '2010/11': '98178368', '2010/23': 'fd81c852', '2010/37': '1beff5c5',
  '2015/11': 'aacf5528', '2015/23': 'b8954df7', '2015/37': '2b7a18ff',
  '2017/11': 'a5d89dfd', '2017/23': '396af2cf', '2017/37': '856dc871',
  '2019/11': 'eb574503', '2019/23': '15ecf0d5', '2019/37': '6d7c8a0b',
  '2024/11': 'ccb18890', '2024/23': '748786b6', '2024/37': '60b76d41',
};

/** the twelve-year career. Re-baselined: see the file comment. */
const PINNED_CAREER: Record<string, string> = {
  '2010/11': 'f66babb9', '2010/23': '346677e0', '2010/37': '767ffb4c',
  '2015/11': '8f5fa8ba', '2015/23': '27a34691', '2015/37': 'dd92aaeb',
  '2017/11': 'f8b1b1a4', '2017/23': '7224eea4', '2017/37': '3a29889b',
  '2019/11': '4a7f94ad', '2019/23': '564f2328', '2019/37': '59476e91',
  '2024/11': '1c4b2ffe', '2024/23': '8915a3cd', '2024/37': '74aeeed0',
};

describe('the Commons random stream is pinned', () => {
  for (const era of ERAS) {
    for (const seed of SEEDS) {
      const key = `${era}/${seed}`;
      it(`creation is unchanged for ${key}`, () => {
        const h = creationHash(newGame(seed, era));
        if (!PINNED_CREATION[key]) console.log(`PIN creation ${key} ${h}`);
        expect(PINNED_CREATION[key], `no creation pin for ${key}`).toBeDefined();
        expect(h).toBe(PINNED_CREATION[key]);
      });
      it(`the first count is unchanged for ${key}`, () => {
        const h = firstCountHash(newGame(seed, era));
        if (!PINNED_FIRST_COUNT[key]) console.log(`PIN firstCount ${key} ${h}`);
        expect(PINNED_FIRST_COUNT[key], `no first-count pin for ${key}`).toBeDefined();
        expect(h).toBe(PINNED_FIRST_COUNT[key]);
      });
      it(`a twelve-year career is unchanged for ${key}`, () => {
        const game = newGame(seed, era);
        runCareer(game, 12);
        const h = careerHash(game);
        if (!PINNED_CAREER[key]) console.log(`PIN career ${key} ${h}`);
        expect(PINNED_CAREER[key], `no career pin for ${key}`).toBeDefined();
        expect(h).toBe(PINNED_CAREER[key]);
      });
    }
  }
});
