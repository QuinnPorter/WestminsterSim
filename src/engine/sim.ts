import { Era, GameState, PartyId } from '../types/game';
import { OFFICES } from '../data/offices';
import { createNewGame } from './newGame';
import { initCalendar, nextStep } from './scheduler';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from './turn';
import { Rng } from './rng';

export interface SimSummary {
  seed: number;
  yearsPlayed: number;
  steps: number;
  highestTier: number;
  becameLeader: boolean;
  becamePM: boolean;
  electionsContested: number;
  electionsWonSeat: number;
  lostSeatEver: boolean;
  gameOverReason: string | null;
  /** an NPC PM resigned (scandal or longevity) at some point */
  npcPmResigned: boolean;
  /** a PM (NPC or player) called an early/snap election at some point */
  earlyElectionCalled: boolean;
  /** cardId -> times seen, for repetition analysis */
  cardCounts: Record<string, number>;
  finalStats: GameState['player']['stats'];
  // ---- rebalance metrics ----
  electionMajority: number;
  electionHung: number;
  electionMinority: number;
  coalitionsFormed: number;
  /** a sub-majority government fell mid-term (collapse or lost confidence vote) */
  govFellEarly: number;
  /** the player was ousted from the leadership (coup / lost confidence / broken pledge) */
  forcedOutLeader: number;
  honouredPledge: number;
  brokenPledge: number;
  contestPledgeHonoured: number;
  contestPledgeBroken: number;
  finalistWithdrew: number;
  /** the player's (minor) party won a government office via a coalition */
  coalitionOfficeWon: boolean;
  /** mean length of the player's office spells, in years (cycling cadence) */
  avgPostTenureYears: number;
  /** the player was handed a ministry without first being a PPS/whip */
  directMinistry: boolean;
}

export interface SimOptions {
  seed: number;
  years: number;
  era?: Era;
  partyId?: PartyId;
  /** chance the policy picks the "first" (usually ambitious/loyal) choice */
  ambition?: number;
}

/** Drive a full career headlessly with a simple random policy.
 *  Used by balance tests and the repetition report. */
export function simulateCareer(opts: SimOptions): SimSummary {
  const rng = new Rng(opts.seed ^ 0x5eed);
  const era: Era = opts.era ?? rng.pick(['2010', '2015', '2017', '2019', '2024'] as const);
  // 2010/2015/2017/2019 had the Conservatives (a Con–LD coalition in 2010) governing; 2024 had Labour
  const partyId: PartyId =
    opts.partyId ?? (era === '2024'
      ? rng.chance(0.5) ? 'lab' : 'con'
      : rng.chance(0.5) ? 'con' : 'lab');

  const game = createNewGame({
    name: 'Sim Subject',
    gender: 'f',
    age: 38,
    region: rng.pick(['london', 'northWest', 'southEast', 'scotland', 'wales'] as const),
    background: rng.pick(['lawyer', 'teacher', 'advisor', 'business', 'doctor'] as const),
    partyId,
    avatar: {
      skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0,
      outfit: 0, outfitColour: 0, accessory: 0, bg: 0,
    },
    era,
    seed: opts.seed,
  });
  initCalendar(game);
  const gameRng = new Rng(game.rngState);
  nextStep(game, gameRng);

  const ambition = opts.ambition ?? 0.65;
  const endDay = game.startDay + opts.years * 365;
  const cardCounts: Record<string, number> = {};
  let steps = 0;
  let highestTier = 0;
  let becameLeader = false;
  let becamePM = false;
  let lostSeatEver = false;

  while (!game.gameOver && game.day < endDay && steps < opts.years * 40) {
    steps++;
    if (game.pendingElectionId) {
      acknowledgeElectionCore(game, gameRng);
      continue;
    }
    const card = game.currentCard;
    if (!card) {
      // should not happen — guard against stalls
      nextStep(game, gameRng);
      if (!game.currentCard && !game.pendingElectionId && !game.gameOver) {
        throw new Error(`engine stalled on day ${game.day}`);
      }
      continue;
    }
    if (card.kind === 'normal') {
      cardCounts[card.cardId] = (cardCounts[card.cardId] ?? 0) + 1;
    }
    // policy: ambitious players take the first option (accept jobs, stand, fight)
    const choiceIndex = gameRng.chance(ambition) ? 0 : gameRng.int(0, card.choices.length - 1);
    resolveChoiceCore(game, gameRng, choiceIndex);
    continueCore(game, gameRng);

    const tier = game.player.officeId ? OFFICES[game.player.officeId].tier : 0;
    if (tier > highestTier) highestTier = tier;
    if (game.player.officeId === 'leader') {
      becameLeader = true;
      if (game.government.pmId === 'player') becamePM = true;
    }
    if (!game.player.hasSeat) lostSeatEver = true;
  }
  game.rngState = gameRng.state;

  const electionsContested = Object.keys(game.elections).length;
  const electionsWonSeat = Object.values(game.elections).filter((e) => e.playerHeldSeat).length;
  const headlines = game.history
    .filter((h) => h.kind === 'event')
    .map((h) => (h as { headline: string }).headline);

  const outcomes = Object.values(game.elections);
  const countH = (re: RegExp) => headlines.filter((h) => re.test(h)).length;

  // average office-spell length (cycling cadence)
  const roleChanges = game.history.filter((h) => h.kind === 'roleChange') as
    { date: number; officeId: string | null }[];
  let spellSum = 0;
  let spellCount = 0;
  for (let i = 0; i < roleChanges.length; i++) {
    if (roleChanges[i].officeId !== null) {
      const end = i + 1 < roleChanges.length ? roleChanges[i + 1].date : game.day;
      spellSum += end - roleChanges[i].date;
      spellCount++;
    }
  }

  // did the player ever reach a ministry without a prior PPS/whip apprenticeship?
  let directMinistry = false;
  let hadJunior = false;
  for (const h of game.history) {
    if (h.kind !== 'roleChange' || !h.officeId) continue;
    if (h.officeId === 'pps' || h.officeId === 'whip') hadJunior = true;
    else if ((h.officeId.startsWith('min_') || h.officeId.startsWith('sos_')) && !hadJunior) {
      directMinistry = true;
      break;
    }
  }

  return {
    directMinistry,
    electionMajority: outcomes.filter((e) => e.outcome === 'majority').length,
    electionHung: outcomes.filter((e) => e.outcome === 'hung').length,
    electionMinority: outcomes.filter((e) => e.outcome === 'minority').length,
    coalitionsFormed: countH(/forms a coalition|enters coalition|joins a coalition government/),
    govFellEarly: countH(/government falls|loses a confidence vote/),
    forcedOutLeader: countH(/is ousted as leader|is forced out as Prime Minister|breaks pledge to stand down/),
    honouredPledge: countH(/stands down as promised/),
    brokenPledge: countH(/breaks pledge to stand down/),
    // leadership-contest ledger: job promises honoured/broken, and finalist withdrawals
    contestPledgeHonoured: countH(/honours the deals struck during the leadership/),
    contestPledgeBroken: countH(/breaks the promises made to win the leadership/),
    finalistWithdrew: countH(/withdraws from the leadership race/),
    coalitionOfficeWon: headlines.some((h) => /takes a senior government role|joins a coalition government/.test(h)),
    avgPostTenureYears: spellCount > 0 ? (spellSum / spellCount) / 365 : 0,
    npcPmResigned: headlines.some((h) =>
      /resigns as Prime Minister|announces resignation after/.test(h)
    ),
    earlyElectionCalled: headlines.some((h) =>
      /calls a general election|snap general election/.test(h)
    ),
    seed: opts.seed,
    yearsPlayed: (game.day - game.startDay) / 365,
    steps,
    highestTier,
    becameLeader,
    becamePM,
    electionsContested,
    electionsWonSeat,
    lostSeatEver,
    gameOverReason: game.gameOver?.reason ?? null,
    cardCounts,
    finalStats: game.player.stats,
  };
}
