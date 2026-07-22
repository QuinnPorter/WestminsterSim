/* Headless QA play-harness — drives the pure engine to "play" full careers and emit
 * a compact transcript + summary + auto-flagged anomalies. NOT game code; a test tool.
 * Usage:  npx tsx qa-harness.mts <strategy> <startSeed> <count>
 *   strategy: backbench | frontbench | free
 * Prints one block per game to stdout. */
import { createNewGame, CreationInput } from './src/engine/newGame';
import { resolveChoiceCore, continueCore, acknowledgeElectionCore } from './src/engine/turn';
import { nextStep, initCalendar } from './src/engine/scheduler';
import { buildLegacy } from './src/engine/career';
import { Rng } from './src/engine/rng';
import { GameState } from './src/types/game';
import { formatMonthYear } from './src/engine/clock';

const PARTIES_BY_STRATEGY: Record<string, string[]> = {
  frontbench: ['con', 'lab', 'con', 'lab', 'ld'],
  backbench: ['con', 'lab', 'ld', 'snp', 'green'],
  free: ['con', 'lab', 'ld', 'snp', 'green', 'reform', 'con', 'lab'],
};
const REGIONS = ['london', 'southEast', 'northWest', 'yorkshire', 'scotland', 'wales', 'westMidlands', 'eastMidlands'];
const BGS = ['lawyer', 'teacher', 'business', 'journalist', 'doctor', 'councillor', 'advisor', 'tradeUnionist'];
const ERAS = ['2010', '2015', '2017', '2019', '2024'];
const NAMES = ['Alex Mercer', 'Sam Okonkwo', 'Priya Nair', 'Tom Fielding', 'Grace Bellamy', 'Jon Hale', 'Mara Voss', 'Dev Rana', 'Cora Whitman', 'Eli Brandt'];

function withRng(game: GameState, fn: (rng: Rng) => void): void {
  const rng = new Rng(game.rngState);
  fn(rng);
  game.rngState = rng.state;
}

/** kind-aware choice selection so each strategy actually steers the career */
function pickChoice(card: any, strategy: string, rng: Rng): number {
  const n = card.choices.length;
  const forced: Record<string, Record<string, number>> = {
    backbench: { reshuffleOffer: 1, deputyPmOffer: 1, leadershipStand: 1, committeeChairContest: 0, speakerContest: 0 },
    frontbench: { reshuffleOffer: 0, deputyPmOffer: 0, leadershipStand: 0, committeeChairContest: 1, speakerContest: 1, leadershipBallot: 0 },
    free: {},
  };
  const map = forced[strategy] || {};
  if (card.kind in map) return Math.min(map[card.kind], n - 1);
  return rng.int(0, n - 1);
}

function detok(s: string): string { return (s || '').replace(/\s+/g, ' ').trim(); }

function playOne(strategy: string, seed: number): { lines: string[]; flags: string[]; summary: any } {
  const flags: string[] = [];
  const lines: string[] = [];
  const choiceRng = new Rng(seed * 7919 + 13);
  const party = PARTIES_BY_STRATEGY[strategy][seed % PARTIES_BY_STRATEGY[strategy].length];
  const input: CreationInput = {
    name: NAMES[seed % NAMES.length], gender: (seed % 3 === 0 ? 'm' : seed % 3 === 1 ? 'f' : 'nb') as any,
    age: 32 + (seed % 30), region: REGIONS[seed % REGIONS.length] as any,
    background: BGS[seed % BGS.length] as any, partyId: party as any,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: ERAS[seed % ERAS.length] as any, seed,
  };

  let game: GameState;
  try {
    game = createNewGame(input);
    initCalendar(game);
    withRng(game, (r) => nextStep(game, r));
  } catch (e: any) { return { lines, flags: [`FATAL createNewGame: ${e?.message || e}`], summary: { seed, crashed: true } }; }

  let steps = 0;
  const MAX = 4000;
  const seenCards = new Set<string>();
  let decisions = 0;
  while (!game.gameOver && steps < MAX) {
    steps++;
    try {
      if (game.pendingElectionId) { withRng(game, (r) => acknowledgeElectionCore(game, r)); continue; }
      const card = game.currentCard;
      if (!card) { withRng(game, (r) => nextStep(game, r)); continue; }
      if (!card.outcome) {
        // anomaly checks on the presented card
        if (!card.title || !card.body) flags.push(`blank title/body on ${card.kind} (${card.cardId})`);
        if (card.choices.length < 2) flags.push(`<2 choices on ${card.kind} "${detok(card.title)}"`);
        const bodyTok = (card.body || '').match(/\{[a-zA-Z]+\}/);
        if (bodyTok) flags.push(`unresolved token ${bodyTok[0]} in "${detok(card.title)}"`);
        const idx = pickChoice(card, strategy, choiceRng);
        withRng(game, (r) => resolveChoiceCore(game, r, idx));
        decisions++;
        const outTok = (game.currentCard?.outcome?.text || '').match(/\{[a-zA-Z]+\}/);
        if (outTok) flags.push(`unresolved token ${outTok[0]} in outcome of "${detok(card.title)}"`);
        // record a compact transcript line (cap volume: keep forced events + a sample of normals)
        const off = game.player.officeId || (game.player.committeeChair ? `chair:${game.player.committeeChair}` : 'backbench');
        const keep = card.kind !== 'normal' || decisions % 6 === 0;
        if (keep && lines.length < 120) {
          lines.push(`${formatMonthYear(game.day)} [${off}] ${card.kind} "${detok(card.title)}" → "${detok(card.choices[idx]?.label)}" :: ${detok(game.currentCard?.outcome?.text).slice(0, 110)}`);
        }
        seenCards.add(card.cardId.replace(/_\d+$/, ''));
      } else {
        withRng(game, (r) => continueCore(game, r));
      }
    } catch (e: any) {
      flags.push(`EXCEPTION step ${steps} (${game.currentCard?.kind} "${detok(game.currentCard?.title)}"): ${e?.message || e}`);
      break;
    }
    // stat sanity
    for (const [k, v] of Object.entries(game.player.stats)) {
      if (typeof v !== 'number' || Number.isNaN(v)) flags.push(`bad stat ${k}=${v}`);
    }
    // a real player retires eventually — end the career around a plausible age so
    // games terminate naturally instead of marathoning for centuries
    if (!game.gameOver && game.player.hasSeat && game.player.age >= 66 + (seed % 14)) {
      try { game.gameOver = { reason: 'retired', legacy: buildLegacy(game) }; } catch (e: any) { flags.push(`retire buildLegacy threw: ${e?.message}`); break; }
    }
  }
  if (steps >= MAX) flags.push(`STEP CAP hit (${MAX}) without game over — possible soft-lock / no terminal state`);

  const legacy = game.gameOver?.legacy ?? (() => { try { return buildLegacy(game); } catch (e: any) { flags.push(`buildLegacy threw: ${e?.message}`); return null; } })();
  const summary = {
    seed, party, era: input.era, strategy,
    decisions, steps, years: legacy?.yearsServed, highestOffice: legacy?.highestOfficeTitle,
    becamePM: legacy?.becamePM, becameLeader: legacy?.becameLeader, wasSpeaker: legacy?.wasSpeaker,
    committeeChair: game.player.committeeChair, wasCommitteeChair: !!game.player.flags?._wasCommitteeChair,
    electionsWon: legacy?.electionsWon, electionsContested: legacy?.electionsContested,
    leadershipContestsFought: legacy?.leadershipContestsFought, leadershipContestsWon: legacy?.leadershipContestsWon,
    rebellions: legacy?.rebellions, rating: legacy?.rating, verdict: legacy?.verdict,
    over: game.gameOver?.reason ?? '(none-stepcap)', distinctCards: seenCards.size,
  };
  return { lines, flags: [...new Set(flags)], summary };
}

const strategy = process.argv[2] || 'free';
const start = parseInt(process.argv[3] || '1', 10);
const count = parseInt(process.argv[4] || '10', 10);
for (let i = 0; i < count; i++) {
  const seed = start + i;
  const { lines, flags, summary } = playOne(strategy, seed);
  console.log(`\n===== GAME seed=${seed} strategy=${strategy} =====`);
  console.log('SUMMARY ' + JSON.stringify(summary));
  if (flags.length) console.log('FLAGS:\n  - ' + flags.join('\n  - '));
  console.log('TRANSCRIPT (compact):');
  for (const l of lines) console.log('  ' + l);
}
