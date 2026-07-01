import { DrawnCard, GameState, PartyId, StatDelta } from '../types/game';
import { ALL_CARDS, FALLBACK_POOL } from '../content/cards';
import { SCANDAL_ARC_BEATS } from '../content/cards/crisis';
import { PARTIES } from '../data/parties';
import { cardEligible, drawCard, makeDrawnCard, resolveTokens } from './cardEngine';
import {
  applyElectionAftermath, materializeForced, playerIsPM, runReshuffle,
  openLeadershipVacancy, playerIsLeader, playerIsGovernmentOrOppositionLeader,
  onFrontbenchTrack, onMinorPartyTrack,
  playerTier, nextOfficeFor, eligibilityScore, OFFER_THRESHOLDS, offerThreshold,
  npcReshuffle, npcFrontbencherRetires, playerInGovernment, playerInGovernmentBloc,
  canHoldOffice, reconcilePlayerDeputy, canChairCommittee, pickCommittee,
} from './career';
import { OFFICES } from '../data/offices';
import { relationshipValue } from './relationships';
import { runElection } from './election';
import { gainStat } from './effects';
import { partyPolling, pollingLead, lastElectionShares } from './polling';
import { isoToDay, yearOf, monthOf } from './clock';
import { Rng } from './rng';

// ---------- calendar ----------

interface CalendarEvent {
  key: string;
  month: number; // 1-12
  day: number;
}

const CALENDAR: CalendarEvent[] = [
  { key: 'pmqsWinter', month: 1, day: 22 },
  { key: 'budget', month: 3, day: 10 },
  { key: 'locals', month: 5, day: 4 },
  { key: 'pmqsSummer', month: 6, day: 18 },
  { key: 'recess', month: 8, day: 5 },
  { key: 'conference', month: 9, day: 28 },
];

function nextOccurrence(after: number, month: number, day: number): number {
  let year = yearOf(after);
  let due = isoToDay(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  if (due <= after) {
    year += 1;
    due = isoToDay(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return due;
}

export function initCalendar(state: GameState): void {
  for (const ev of CALENDAR) {
    state.calendarDone[ev.key] = nextOccurrence(state.day, ev.month, ev.day);
  }
}

// ---------- calendar variant rotation ----------
//
// The four annual set-pieces (Budget / Local elections / Summer recess / Party
// conference) used to return a single verbatim outcome string for each choice,
// so a 30-year career read Budget #16 exactly like Budget #2. We rotate among a
// small bank of variants keyed off the calendar YEAR, which:
//   • fires once per card per year, so the rotation steps cleanly year-on-year;
//   • needs NO new persisted state (derived from state.day), so saves are safe.
// Variants are also role/government-aware where it earns its keep — a PM's
// Budget reads nothing like a backbencher's, an opposition critic's conference
// nothing like a loyal minister's.

/** deterministic year-keyed rotation index into a variant bank of length `n` */
function calVariant(state: GameState, n: number): number {
  if (n <= 1) return 0;
  return ((yearOf(state.day) % n) + n) % n;
}

/** coarse role bucket used to colour calendar outcome text */
type CalRole = 'pm' | 'govMinister' | 'oppLeader' | 'oppFront' | 'minor' | 'govBack' | 'oppBack' | 'back';
function calRole(state: GameState): CalRole {
  if (playerIsPM(state)) return 'pm';
  const inGov = playerInGovernmentBloc(state);
  if (onMinorPartyTrack(state)) return 'minor';
  if (playerIsLeader(state)) return inGov ? 'pm' : 'oppLeader';
  const onFront = onFrontbenchTrack(state) && playerTier(state) >= 1;
  if (inGov) return onFront ? 'govMinister' : 'govBack';
  if (state.player.partyId === state.government.oppositionParty) {
    return onFront ? 'oppFront' : 'oppBack';
  }
  return 'back';
}

function makeCalendarCard(state: GameState, rng: Rng, key: string): DrawnCard {
  const base = {
    cardId: `cal_${key}_${state.day}`,
    kind: 'calendar' as const,
    payload: { calKey: key, advance: rng.chance(0.5) ? 30 : 60 },
  };
  const role = calRole(state);
  switch (key) {
    case 'conference': {
      const confBodies = [
        'Conference season. Lanyards, warm white wine, and a fringe-event invitation for every hour of the day. How do you play the week?',
        'Conference again — the seaside hotel, the agency stands, the leader\'s speech everyone will grade by lunchtime. A week of being seen. How do you spend it?',
        'The faithful gather: standing ovations rehearsed, fringe rooms overbooked, the bars busier than the auditorium. Your week to shape.',
      ];
      return {
        ...base,
        title: 'Party conference',
        body: resolveTokens(state, confBodies[calVariant(state, confBodies.length)]),
        choices: [
          { label: 'Work the fringe circuit' },
          { label: 'Stay loyal and visible in the hall' },
          { label: 'Skip it for constituency week' },
        ],
      };
    }
    case 'budget': {
      const govBloc = playerInGovernmentBloc(state);
      const govBodies = [
        'Budget day, and it is your side at the despatch box. The Chancellor performs for an hour; your job is to sell it on the airwaves — or quietly read the small print.',
        'Red box, red lines, red faces on the other bench. Your Chancellor rises; the question for you is whether to broadcast the good news or audit the fine print first.',
      ];
      const oppBodies = [
        "Budget day. The government's Chancellor performs for an hour while everyone hunts for the trap in the fine print. Your inbox will want a verdict by teatime.",
        "Budget day. The Chancellor waves the red box for the cameras, then spends an hour burying the bad news in the costings. Someone has to dig it out by teatime.",
      ];
      const bodies = govBloc ? govBodies : oppBodies;
      return {
        ...base,
        title: 'Budget day',
        body: resolveTokens(state, bodies[calVariant(state, bodies.length)]),
        choices: govBloc
          ? [{ label: 'Champion it loudly' }, { label: 'Pick at the fine print' }]
          : [{ label: 'Attack it on the airwaves' }, { label: 'Pick at the fine print' }],
      };
    }
    case 'locals': {
      const localBodies = [
        'Local election night. Church halls, trestle tables, and a thousand small verdicts that the pundits will weave into one big one by breakfast.',
        'Locals tonight. Counting agents, lukewarm tea, and a swingometer the broadcasters will over-interpret before the first ward declares.',
        'Local election night: leisure-centre counts up and down the country, and a national story the morning papers will have written before half the seats are in.',
      ];
      const govLocal = role === 'pm' || role === 'govMinister' || role === 'govBack';
      const framed = govLocal
        ? 'Local election night — a midterm verdict on your government, ward by ward. ' + localBodies[calVariant(state, localBodies.length)].split('. ').slice(1).join('. ')
        : localBodies[calVariant(state, localBodies.length)];
      return {
        ...base,
        title: 'Local elections',
        body: resolveTokens(state, framed),
        choices: [
          { label: 'Campaign hard for the locals' },
          { label: 'Keep your head down nationally' },
        ],
      };
    }
    case 'recess':
    default: {
      const recessBodies = [
        'Recess. Westminster empties and {constituency} gets you back for six weeks. The diary is yours — a rare and dangerous freedom.',
        'The House rises. For six weeks the green benches go dark and {constituency} reclaims you — fetes, surgeries, and a diary entirely your own.',
        'Summer recess. The Westminster bubble deflates, the lobby decamps to the beach, and six unstructured weeks in {constituency} stretch ahead.',
      ];
      return {
        ...base,
        title: 'Summer recess',
        body: resolveTokens(state, recessBodies[calVariant(state, recessBodies.length)]),
        choices: [
          { label: 'A summer of surgeries' },
          { label: 'An actual holiday' },
        ],
      };
    }
  }
}

export function resolveCalendarChoice(
  state: GameState,
  _rng: Rng,
  card: DrawnCard,
  choiceIndex: number
): { text: string; deltas: StatDelta[] } {
  const deltas: StatDelta[] = [];
  const stat = (k: keyof GameState['player']['stats'], d: number, label: string) => {
    const applied = gainStat(state, k, d);
    if (applied !== 0) deltas.push({ label, delta: applied });
  };
  const key = card.payload?.calKey as string;
  const role = calRole(state);
  // pick a year-rotated variant from a bank; resolves tokens for the caller
  const pick = (bank: string[]) => resolveTokens(state, bank[calVariant(state, bank.length)]);

  switch (key) {
    case 'conference':
      if (choiceIndex === 0) {
        stat('profile', 4, 'Profile');
        stat('partyStanding', 2, 'Standing');
        // working the fringe — role colours who is courting whom
        if (role === 'pm' || role === 'govMinister') {
          return { text: pick([
            'Your fringe is rammed: think-tankers, donors, and a queue of MPs who want a word about their pet scheme. You leave having promised nothing and charmed everyone.',
            'You headline three fringes and a packed Q&A. The cameras follow a minister with a crowd; by Thursday the lobby has you down as one to watch.',
          ]), deltas };
        }
        if (role === 'oppLeader' || role === 'oppFront' || role === 'oppBack') {
          return { text: pick([
            'You work the fringe like the government-in-waiting you say you are — policy launches, friendly editors, a standing-room-only rally. The clips travel.',
            'Five fringes, two receptions, and a barnstorming attack on the government that the morning round picks up. Your side leaves the seaside believing again.',
          ]), deltas };
        }
        if (role === 'minor') {
          return { text: pick([
            'A small party lives or dies on the fringe, and you make every minute count — broadcasters, sympathetic columnists, a hall that feels, briefly, larger than it is.',
            'You punch above your numbers all week: a viral fringe clip, a queue at your stall, a leader\'s speech that lands beyond the faithful.',
          ]), deltas };
        }
        return { text: pick([
          'Five panels, two receptions, one karaoke incident that stays (mostly) off camera. By Thursday, people who matter know your name.',
          'You speak on four fringes, shake every hand in the bar, and corner a special adviser by the buffet. By Thursday the right people know your name.',
          'A week of lanyards and lukewarm canapes, but you make it pay: a good fringe line, a friendly hack, a whip who now knows your face.',
        ]), deltas };
      }
      if (choiceIndex === 1) {
        stat('partyStanding', 4, 'Standing');
        if (role === 'pm' || role === 'oppLeader') {
          // the leader IS the hall — loyalty flows the other way
          return { text: pick([
            'You stand at the front, work the standing ovations, and close the week with a speech the hall actually wanted to hear. Your stock among the faithful holds firm.',
            'You spend the week being the party\'s face — the rope lines, the regional receptions, the grateful activists. The base goes home loyal.',
          ]), deltas };
        }
        return { text: pick([
          'You clap in the right places, laugh at the leader\'s jokes, and are visibly, reliably on-message. Loyalty is a currency; you just minted some.',
          'You take your seat in the hall, cheer the set-piece lines, and make sure the whips see you doing it. Reliability, duly noted.',
          'No fringe freelancing this year — just a week of disciplined, on-message visibility in the hall. The leadership likes a team player.',
        ]), deltas };
      }
      stat('constituencyApproval', 4, 'Approval');
      stat('partyStanding', -2, 'Standing');
      return { text: pick([
        'While colleagues network at the bar, you open a community centre and visit three schools. {constituency} approves. The party notes your absence.',
        'You skip the seaside for a week of surgeries and ribbon-cuttings in {constituency}. Voters notice you stayed; the whips notice you didn\'t come.',
        'No lanyard this year — just a week back in {constituency}, where the casework matters more than the canapes. Your patch is grateful; conference, less so.',
      ]), deltas };

    case 'budget': {
      const bumpLeader = (d: number) => {
        const lead = state.relationships.find((r) => r.kind === 'leader');
        if (lead) { lead.value += d; deltas.push({ label: 'Leader', delta: d }); }
      };
      if (choiceIndex === 0) {
        if (playerInGovernmentBloc(state)) {
          // champion your own government's budget — loyalty rewarded
          bumpLeader(3);
          stat('constituencyApproval', -1, 'Approval');
          if (role === 'pm') {
            stat('profile', 1, 'Profile');
            return { text: pick([
              'It is your Budget as much as the Chancellor\'s, and you sell it everywhere — the broadcast round, the tearoom, the 1922. The party rallies behind the numbers; the doubters keep their counsel for now.',
              'You spend the day as salesman-in-chief: studio sofas, friendly backbenchers, a unity message hammered until it sticks. The government holds the line, just.',
            ]), deltas };
          }
          if (role === 'govMinister') {
            return { text: pick([
              'You defend the Chancellor\'s numbers across the morning round and stay rigidly on-message in the chamber. A minister who sells the line is a minister the leadership keeps.',
              'You take the difficult Budget questions so the Chancellor doesn\'t have to, and absorb the hits with a straight bat. The Treasury sends quiet thanks.',
            ]), deltas };
          }
          return { text: pick([
            'You defend the numbers on regional radio with conviction you mostly feel. The leadership clips your best line.',
            'You go out and bat for the Budget on local stations and in the chamber, loyal to the last decimal point. The whips tick your name with approval.',
          ]), deltas };
        }
        // attack the government's budget — your own side cheers you on
        stat('profile', 3, 'Profile');
        stat('partyStanding', 2, 'Standing');
        bumpLeader(2);
        if (role === 'oppLeader') {
          return { text: pick([
            'You lead the response from the despatch box, turning the Chancellor\'s giveaway into a list of broken promises. Your benches roar; the clip leads the bulletins.',
            'You frame the whole Budget as a confession of failure and make it stick across the evening round. The opposition leaves the chamber believing it can win.',
          ]), deltas };
        }
        if (role === 'oppFront') {
          return { text: pick([
            'You shadow the brief and shred the relevant line item before the ink is dry, briefing every outlet that will take you. The leadership notes a frontbencher who lands punches.',
            'You own the attack on your portfolio, all morning, all afternoon, all over the airwaves. A shadow minister who draws blood is a shadow minister who gets promoted.',
          ]), deltas };
        }
        return { text: pick([
          'You tear into the buried tax rises across the morning round, and the clip plays well with your side. The leadership notes a reliable attack dog.',
          'You spend the day flaying the Chancellor\'s small print on every station that will have you. Your own benches love it; the leadership files you under "useful".',
          'You go on the offensive at first light and don\'t let up — the giveaway is a con, the costings a fiction. The line travels, and your stock with the whips rises.',
        ]), deltas };
      }
      stat('competence', 3, 'Competence');
      stat('profile', 2, 'Profile');
      // "read the small print" — the wonk's choice, coloured by vantage point
      if (role === 'pm' || role === 'govMinister' || role === 'govBack') {
        return { text: pick([
          'You go through your own side\'s Budget line by line and quietly flag the costing that won\'t survive contact with the OBR. Better your colleagues hear it from a friend.',
          'You map every measure that touches your brief before the lobby does, and brief your own people on the awkward bits. Forewarned is forearmed; the wonks respect it.',
        ]), deltas };
      }
      return { text: pick([
        'You find the buried table on page 84 that everyone else missed. Your thread explaining it does respectable numbers and earns a nod from the serious commentators.',
        'While the studios chase the headline giveaway, you read the costings document to the last footnote and surface the stealth raid nobody else clocked. The serious commentators take note.',
        'You ignore the theatre and audit the Red Book itself, pulling out the tax threshold freeze the Chancellor hoped no one would graph. Your explainer does the rounds.',
      ]), deltas };
    }

    case 'locals': {
      const govSide = role === 'pm' || role === 'govMinister' || role === 'govBack';
      if (choiceIndex === 0) {
        stat('constituencyApproval', 3, 'Approval');
        stat('partyStanding', 2, 'Standing');
        if (govSide) {
          // governing party defending its councillors at midterm
          return { text: pick([
            'You pound the pavements to defend councillors against the usual midterm kicking, and your patch holds where others fell. The whips remember who showed up when it was hard.',
            'Midterm is no friend to a governing party, but you out-campaign the national gloom and your wards hang on. People notice whose name was on the thank-you cake.',
          ]), deltas };
        }
        return { text: pick([
          'You deliver leaflets until your shoulder aches. The local results in your patch outrun the national trend, and people notice whose name was on the thank-you cake.',
          'You knock every door twice and run the committee room like a campaign HQ. Your wards swing harder than the national picture, and the gains carry your name.',
          'A month of stake-boards, street stalls, and sore feet pays off: your local slate over-performs the polls, and the activists won\'t forget who led from the front.',
        ]), deltas };
      }
      stat('competence', 1, 'Competence');
      if (govSide) {
        return { text: pick([
          'You read the results like a government chief whip would — ward by ward, swing by swing, hunting the marginals that should worry the cabinet. Useful, sobering patterns.',
          'You let the midterm verdict wash over you and study where it bit hardest. A quiet audit of the damage, filed for whoever in No. 10 will listen.',
        ]), deltas };
      }
      return { text: pick([
        'You let the night wash over you and study the results like tea leaves. Useful patterns, safely observed from a distance.',
        'You skip the count and watch the swingometer from home, mapping where the wind is blowing. Patterns worth knowing, gathered without the cold church hall.',
        'No rosette this year — you treat the locals as data, not a doorstep, and quietly chart which way your region is drifting. Detached, but instructive.',
      ]), deltas };
    }

    case 'recess':
    default:
      if (choiceIndex === 0) {
        stat('constituencyApproval', 5, 'Approval');
        if (role === 'pm' || role === 'govMinister' || role === 'oppLeader' || role === 'oppFront') {
          // a frontbencher who still does the casework grind earns extra credit
          return { text: pick([
            'Red boxes follow you home, but you still run the surgeries — six weeks of fetes, farm visits, and casework between the despatch-box business. {constituency} notices you never left.',
            'You spend recess proving a frontbencher can still be a constituency MP: the surgery queue, the village fete, the casework pile. {constituency} repays the loyalty.',
          ]), deltas };
        }
        return { text: pick([
          'Six weeks of surgeries, fetes, and farm visits. By September you know every pothole in {constituency} by name. The casework pile is conquered.',
          'You spend the recess on the doorstep: advice surgeries, summer fairs, a school-roof campaign that finally moves. By September the casework backlog is gone.',
          'Six weeks of ribbon-cuttings, allotment openings, and a stubborn planning row you actually settle. {constituency} sees more of you than its own councillors.',
        ]), deltas };
      }
      stat('competence', 2, 'Competence');
      stat('constituencyApproval', -1, 'Approval');
      return { text: pick([
        'Two weeks somewhere warm with your phone in the hotel safe. You return alarmingly close to being a functional human being.',
        'You disappear to a villa, read three books that aren\'t briefing notes, and come back sun-rested and sharper. The inbox survived; mostly.',
        'A fortnight off the grid — no boxes, no broadcast round, no doorstep. You return rested, recalibrated, and only slightly guilty about the unanswered casework.',
      ]), deltas };
  }
}

// ---------- systemic hazard rates (per tick, ~monthly) ----------

const RESHUFFLE_HAZARD = 0.085;         // ~ once per ~12 months
const EMERGENCY_RESHUFFLE_BONUS = 0.04; // extra hazard when the party is in the polling mire
const PM_RESHUFFLE_HAZARD = 0.055;      // player-leader interactive reshuffles
const PM_LATE_TERM_ELECTION = 0.06;     // NPC PM "goes early" in year five
const PM_SNAP_ELECTION = 0.012;         // rare snap on an exceptional polling lead
const PLAYER_PM_ELECTION_PROMPT = 0.08;
const PM_LONGEVITY_RESIGN = 0.015;      // PM stands down after a long innings
const PM_SCANDAL_RESIGN = 0.0025;       // PM felled by scandal
const LEADER_COLLAPSE_HAZARD = 0.028;   // NPC leader felled by a sustained polling mire
const NPC_LEADER_SCANDAL = 0.0025;      // an NPC leader felled by scandal
const NPC_RESHUFFLE_HAZARD = 0.04;      // an NPC-led front bench reshuffles itself
const NPC_FRONTBENCH_RETIRE = 0.012;    // an NPC frontbencher steps back
const FIRST_RUNG_HAZARD = 0.20;         // extra path onto the ladder for tier-0 players
const COMMITTEE_CHAIR_HAZARD = 0.10;    // a select-committee chair comes up for a backbencher (~once per ~10 months while eligible)
const PASSED_OVER_HAZARD = 0.045;       // an in-the-frame MP is overlooked in a reshuffle (jeopardy, not a job change)
const MINISTER_RUNG_HAZARD = 0.15;      // accelerated path from PPS/whip to a ministry
const MINOR_CRITIC_HAZARD = 0.14;       // minor-party spokesperson offers (no NPC bench to churn)
const DEPUTY_PM_HAZARD = 0.02;          // rare: the PM elevates a star SoS to deputy
const DEPUTY_REMOVAL_FALLOUT = 0.05;    // a soured PM cuts their deputy loose
const DEPUTY_REMOVAL_REFRESH = 0.006;   // or, rarely, just refreshes the top team
const EXIT_OFFER_HAZARD = 0.03;         // rare: a dignified way out for an MP aged 65+ (at most once per parliament)

// ---------- the brain ----------

/** True when a reshuffle offer has already been presented in the current calendar
 *  month. The hazards roll every tick and a declined offer only advances the clock a
 *  week or two, so without this guard a second, identical "The call" can re-queue in
 *  the same month — back-to-back duplicates the player reads as a glitch. Two genuinely
 *  separate approaches in *different* months are fine and still get through. */
function reshuffleOfferThisMonth(state: GameState): boolean {
  const last = state.player.flags._lastReshuffleOfferDay;
  if (typeof last !== 'number') return false;
  return yearOf(last) === yearOf(state.day) && monthOf(last) === monthOf(state.day);
}

/** True while a recently-sacked MP is serving their spell "in the cold". A dismissal
 *  stamps _sackExileUntil (career.ts); until it lapses the front-bench offer hazards
 *  hold off, so a sacking sticks for a year or two rather than being silently undone at
 *  the very next reshuffle. Cleared lazily once the day passes. */
function inSackExile(state: GameState): boolean {
  const until = state.player.flags._sackExileUntil;
  if (typeof until !== 'number') return false;
  if (state.day >= until) { delete state.player.flags._sackExileUntil; return false; }
  return true;
}

/** True while a recently passed-over MP is licking their wounds — a short cooldown
 *  set when a 'passedOver' beat resolves, so the very next reshuffle doesn't instantly
 *  hand them the job they were just denied. Cleared lazily. */
function recentlyPassedOver(state: GameState): boolean {
  const until = state.player.flags._passedOverUntil;
  if (typeof until !== 'number') return false;
  if (state.day >= until) { delete state.player.flags._passedOverUntil; return false; }
  return true;
}

/** Combined gate: an offer-generating hazard should hold off while the player is in
 *  post-sacking exile or in the brief sulk after being passed over. */
function offersSuppressed(state: GameState): boolean {
  return inSackExile(state) || recentlyPassedOver(state);
}

/** The "chosen exit" a 65+ MP might be offered, if their record qualifies them for
 *  one — or null if none fit. Peerage is checked first (the grandest), then the others.
 *  Reqs are drawn from the plan's locked design decisions. */
function eligibleExitRole(
  state: GameState
): 'peerage' | 'international' | 'executive' | 'university' | null {
  const p = state.player;
  const s = p.stats;
  const years = Math.round((state.day - p.enteredParliament) / 365);
  const longService = years >= 15;
  const peakTier = (p.flags._peakTier as number) ?? 0;
  const exCabinet = peakTier >= 4;   // ever held a full cabinet seat
  const exMinister = peakTier >= 3;  // ever held a Minister-of-State+ post
  const highProfile = s.profile > 60;
  const bg = p.background;

  // peerage — the ermine: a long, well-regarded, honourable innings
  if (years >= 20 && s.partyStanding > 50 && s.integrity > 50) return 'peerage';
  // international governance/defence — the world stage
  if (bg === 'foreignService' || (highProfile && exCabinet && longService)) return 'international';
  // an executive role — cashing out, at a cost to one's reputation
  if (bg === 'business' || bg === 'lawyer' || (highProfile && exMinister && longService)) return 'executive';
  // university chancellor — a dignified retreat for a principled long-server
  if (s.integrity > 65 && longService) return 'university';
  return null;
}

export function nextStep(state: GameState, rng: Rng): void {
  if (state.gameOver) {
    state.currentCard = null;
    return;
  }

  // the Deputy-PM / First-Secretary overlay never survives into opposition
  reconcilePlayerDeputy(state);

  // 1. forced queue first
  const forced = state.forcedQueue.shift();
  if (forced) {
    if (forced.kind === 'electionNight') {
      const { result, playerWonSeat } = runElection(state, rng);
      applyElectionAftermath(state, rng, result, playerWonSeat);
      state.pendingElectionId = result.id;
      state.currentCard = null;
      return;
    }
    // stamp the month a reshuffle offer actually reaches the player, so the
    // hazard checks below can refuse a same-month duplicate (see reshuffleOfferThisMonth)
    if (forced.kind === 'reshuffleOffer') {
      state.player.flags._lastReshuffleOfferDay = state.day;
    }
    state.currentCard = materializeForced(state, rng, forced);
    return;
  }

  // 2. calendar events (skip while seatless)
  if (state.player.hasSeat) {
    for (const ev of CALENDAR) {
      const due = state.calendarDone[ev.key];
      if (due !== undefined && state.day >= due) {
        state.calendarDone[ev.key] = nextOccurrence(state.day, ev.month, ev.day);
        // enriched, role-specific set-pieces (multi-step forced sequences);
        // everyone else gets the lighter single-card calendar version
        if (ev.key === 'budget' && state.player.officeId === 'sos_treasury' && playerInGovernment(state)) {
          state.forcedQueue.push(
            { kind: 'budget', payload: { step: 1 } },
            { kind: 'budget', payload: { step: 2 } },
            { kind: 'budget', payload: { step: 3 } },
          );
          nextStep(state, rng);
          return;
        }
        if (ev.key === 'conference' && playerIsLeader(state)) {
          state.forcedQueue.push(
            { kind: 'conference', payload: { step: 1 } },
            { kind: 'conference', payload: { step: 2 } },
            { kind: 'conference', payload: { step: 3 } },
          );
          nextStep(state, rng);
          return;
        }
        if (ev.key === 'pmqsWinter' || ev.key === 'pmqsSummer') {
          // PMQs is the despatch-box duel between the PM and the Leader of the
          // Opposition — only those two leaders take part. A third-party leader
          // (Green/SNP/Reform/LD-not-in-govt) does NOT get it, and everyone else
          // just watches it happen.
          if (playerIsGovernmentOrOppositionLeader(state)) {
            state.forcedQueue.push(
              { kind: 'pmqs', payload: { step: 1 } },
              { kind: 'pmqs', payload: { step: 2 } },
            );
            nextStep(state, rng);
            return;
          }
          continue;
        }
        state.currentCard = makeCalendarCard(state, rng, ev.key);
        return;
      }
    }
  }

  // 3. systemic checks
  // election due?
  if (state.day >= state.nextElectionBy - 60) {
    queueGeneralElection(state);
    nextStep(state, rng);
    return;
  }

  // snap elections & PM departures
  const yearsIn = (state.day - state.parliamentStart) / 365;
  if (playerIsPM(state)) {
    const tempted = yearsIn > 4 || (yearsIn > 2 && pollingLead(state) > 10);
    if (tempted && rng.chance(PLAYER_PM_ELECTION_PROMPT)) {
      state.currentCard = {
        cardId: `cal_earlyElection_${state.day}`,
        kind: 'calendar',
        title: 'Tempting numbers',
        body: yearsIn > 4
          ? 'Year five. The strategy team spreads the latest numbers across the cabinet table. "We can run down the clock," they say, "or pick our moment before the moment picks us."'
          : 'Your director of strategy spreads the polling across the cabinet table. "These numbers won\'t get better," they say. "Go now and you win. Probably." Probably is doing a lot of work in that sentence.',
        choices: [{ label: 'Call a snap election' }, { label: 'Hold your nerve' }],
        payload: { calKey: 'earlyElection', advance: rng.int(7, 14) },
      };
      return;
    }
  } else {
    const pmName = state.characters[state.government.pmId]?.name ?? 'The Prime Minister';
    // NPC PM goes early: usually late-term, rarely on an exceptional lead
    const lateTerm = yearsIn > 4 && rng.chance(PM_LATE_TERM_ELECTION);
    const snapOnLead = yearsIn > 2.5 && pollingLead(state) > 12 && rng.chance(PM_SNAP_ELECTION);
    if (lateTerm || snapOnLead) {
      state.history.push({
        kind: 'event', date: state.day,
        headline: snapOnLead
          ? `${pmName} stuns Westminster with a snap general election`
          : `${pmName} calls a general election`,
      });
      queueGeneralElection(state);
      nextStep(state, rng);
      return;
    }
    // NPC PM resignations: scandal (any time, rare) or simply a long innings
    const pmTenureYears = (state.day - state.government.pmSinceDay) / 365;
    const scandalFall = rng.chance(PM_SCANDAL_RESIGN);
    const longInnings = pmTenureYears > 6 && rng.chance(PM_LONGEVITY_RESIGN);
    if (scandalFall || longInnings) {
      state.history.push({
        kind: 'event', date: state.day,
        headline: scandalFall
          ? `${pmName} resigns as Prime Minister amid mounting scandal`
          : `${pmName} announces resignation after ${Math.floor(pmTenureYears)} years in Number 10`,
      });
      openLeadershipVacancy(state, rng, state.government.governingParty);
      nextStep(state, rng);
      return;
    }
  }

  // seatless players just survive until the next election
  if (!state.player.hasSeat) {
    state.currentCard = materializeForced(state, rng, { kind: 'wilderness' });
    return;
  }

  // the chosen exit: an MP aged 65+ whose record qualifies them for a dignified
  // departure (peerage / international role / executive role / university chancellor)
  // is, rarely, offered one — at most once per parliament. Accepting opens the confirm
  // modal (store); declining returns to play and the offer may return next parliament.
  // A forced event (not a normal card), so it reaches sitting leaders and PMs too.
  {
    const stamp = state.player.flags._exitOfferParliament as number | undefined;
    const offeredThisParliament = stamp === state.parliamentStart;
    if (state.player.age >= 65 && !offeredThisParliament && !state.player.flags._pendingExit) {
      const role = eligibleExitRole(state);
      if (role && rng.chance(EXIT_OFFER_HAZARD)) {
        // stamp the current parliament so at most one offer is made per parliament
        // (the stamp is cleared at each general election in applyElectionAftermath)
        state.player.flags._exitOfferParliament = state.parliamentStart;
        state.forcedQueue.push({ kind: 'exitOffer', payload: { role } });
        nextStep(state, rng);
        return;
      }
    }
  }

  // a pledged departure date has arrived — honour it (or break it and pay)
  {
    const pledge = state.player.flags._pledgeResignBy as number | undefined;
    if (playerIsLeader(state) && pledge !== undefined && state.day >= pledge) {
      delete state.player.flags._pledgeResignBy;
      state.forcedQueue.push({ kind: 'resignPrompt', payload: { reason: 'pledgeHonoured' } });
      nextStep(state, rng);
      return;
    }
  }

  // a newly-installed player leader remakes the front bench shortly after
  {
    const due = state.player.flags._newLeaderReshuffleBy as number | undefined;
    if (playerIsLeader(state) && due !== undefined && state.day >= due) {
      delete state.player.flags._newLeaderReshuffleBy;
      state.forcedQueue.push({ kind: 'pmReshuffle' });
      nextStep(state, rng);
      return;
    }
  }

  // a new NPC leader of the player's party shakes up the team: a one-off
  // player-facing reshuffle (offer / move / dismissal) shortly after they take over
  {
    const due = state.player.flags._npcLeaderReshuffleBy as number | undefined;
    if (!playerIsLeader(state) && due !== undefined && state.day >= due) {
      delete state.player.flags._npcLeaderReshuffleBy;
      runReshuffle(state, rng);
      if (state.forcedQueue.length > 0) {
        nextStep(state, rng);
        return;
      }
    }
  }

  // minority/coalition instability: stability is dictated by the real
  // parliamentary arithmetic. A government whose bloc (itself + any coalition or
  // confidence partner) commands a majority is safe; otherwise it is fragile in
  // proportion to how far short the bloc is AND how narrow its lead over the
  // nearest rival — a one-seat lead far from a majority falls fast; a party one
  // seat short of a majority lasts. Applies whether the player or an NPC governs.
  {
    const arr = state.government.arrangement;
    const yearsSinceFormation = (state.day - state.parliamentStart) / 365;
    const coupCool = (state.player.flags._coupCooldownUntil as number) ?? 0;
    if (arr !== 'majority' && yearsSinceFormation > 0.6 && state.day >= coupCool) {
      const govParty = state.government.governingParty;
      const sf = state.seats.sf ?? 0;
      const votingSeats = 650 - sf - 1;
      const seatsForMajority = Math.floor(votingSeats / 2) + 1;
      const govSeats = state.seats[govParty] ?? 0;
      // a coalition partner sits in government; a confidence partner backs supply
      // votes — both count toward surviving a confidence motion
      const partner = state.government.coalitionPartner ?? state.government.confidencePartner;
      const partnerSeats = partner ? (state.seats[partner] ?? 0) : 0;
      const blocSeats = govSeats + partnerSeats;
      const trueShortfall = Math.max(0, seatsForMajority - blocSeats);
      // gap to the largest party that isn't in the governing bloc
      let topRival = 0;
      for (const [p, n] of Object.entries(state.seats) as [PartyId, number][]) {
        if (p === govParty || p === partner || p === 'spk') continue;
        if ((n ?? 0) > topRival) topRival = n ?? 0;
      }
      const rivalGap = govSeats - topRival;
      if (trueShortfall <= 0) {
        // the bloc actually commands a majority — effectively stable, skip
      } else {
        // a small minority (large shortfall) is clearly fragile; a near-majority lasts
        let h = 0.011 + 0.0016 * trueShortfall + 0.0016 * Math.max(0, 12 - rivalGap);
        if (arr === 'coalition') h *= 0.5;
        else if (arr === 'supplyConfidence') h *= 0.75;
        h += 0.0015 * (yearsSinceFormation - 0.6);
        if (rng.chance(Math.min(0.13, h))) {
          if (playerIsPM(state)) {
            state.forcedQueue.push({ kind: 'confidenceVote' });
          } else {
            state.history.push({
              kind: 'event', date: state.day,
              headline: `${PARTIES[govParty].name} government falls; a general election is called`,
            });
            queueGeneralElection(state);
          }
          nextStep(state, rng);
          return;
        }
      }
    }
  }

  const coupCool = (state.player.flags._coupCooldownUntil as number) ?? 0;

  // the pressures of Number 10: a PM under fire from poor polling, scandal,
  // their own rebellious backbenches or sheer longevity faces an authority
  // crisis — usually survivable, occasionally fatal to the premiership
  if (playerIsPM(state) && state.day >= coupCool) {
    const polls = partyPolling(state, state.player.partyId);
    const tenureYears = (state.day - state.government.pmSinceDay) / 365;
    let pressure = 0;
    // B3 (player-PMs can fall): a sitting PM only faces ~150 of these checks across a
    // whole premiership, so the old pressure/260 curve topped out near a ~1.2% hazard
    // even at 20% polling — a strong elected PM therefore NEVER got a pmPressure card and
    // retired serenely, making the premiership effectively un-losable in play. Poor
    // polling is the dominant real-world trigger for a heave (MPs fearing for their
    // seats), so it now drives a STEEP, reachable hazard: pressure builds as the share
    // slips below ~34 (a majority party drifting toward losing its majority is already
    // heave-prone, cf. 2022) and becomes a genuine crisis below ~28, while a PM polling
    // comfortably (mid-30s+) stays safe. Scandal/rebellion/longevity stack as accelerants.
    if (polls < 34) pressure += (34 - polls) * 1.6 + Math.max(0, 28 - polls) * 2.6;
    if (state.player.flags.scandal) pressure += 18;
    pressure += state.player.rebellionCount * 6;
    if (tenureYears > 4) pressure += (tenureYears - 4) * 5;
    const hazard = Math.min(0.16, pressure / 150);
    if (hazard > 0 && rng.chance(hazard)) {
      // most authority crises are survivable; a "brutal" one can topple even a strong
      // PM. The worse the polling, the more likely this is the toppling kind — at a true
      // collapse (polls <~24) the grey suits arrive in force. Under acute pressure they
      // may instead offer a face-saving deal: pledge to go by a date (resignPledge).
      const collapse = Math.max(0, 30 - polls);
      const severe = rng.chance(Math.min(0.6, 0.12 + collapse * 0.05));
      if (severe && rng.chance(0.4)) {
        state.forcedQueue.push({ kind: 'resignPledge' });
      } else {
        state.forcedQueue.push({ kind: 'pmPressure', payload: { severe } });
      }
      nextStep(state, rng);
      return;
    }
  }

  // the same pressures bear on a Leader of the Opposition or a minor-party
  // leader: a polling mire, rebellions, longevity, or simply failing to improve
  // on the position they inherited can trigger a heave (partyCoup) — or a deal
  if (playerIsLeader(state) && !playerInGovernment(state) && state.day >= coupCool) {
    const polls = partyPolling(state, state.player.partyId);
    const tenureYears = (state.day - (state.player.officeSinceDay ?? state.day)) / 365;
    const tookOver = (state.player.flags._leaderTookOverPolls as number) ?? polls;
    // a LOW absolute backstop floor (a genuine wipeout still bites), but the
    // dominant driver is how far they've SLID from the polling they inherited — a
    // stable-but-low FPTP standing shouldn't by itself force a heave
    const floor = onMinorPartyTrack(state) ? 10 : 16;
    let pressure = 0;
    if (polls < floor) pressure += (floor - polls) * 0.5;
    pressure += state.player.rebellionCount * 4;
    if (tenureYears > 3) pressure += (tenureYears - 3) * 3;
    if (polls < tookOver - 2) pressure += (tookOver - polls) * 0.9;
    const hazard = Math.min(0.1, pressure / 280);
    if (hazard > 0 && rng.chance(hazard)) {
      if (rng.chance(0.4)) state.forcedQueue.push({ kind: 'resignPledge' });
      else state.forcedQueue.push({ kind: 'partyCoup' });
      nextStep(state, rng);
      return;
    }
  }

  // the player's own (NPC) PM is wounded — a chance to be drawn into the heave.
  // Rare: a multi-year cooldown stops it recurring every year (the player can
  // still move against the PM any time via the Profile action).
  if (
    playerInGovernment(state) && !playerIsLeader(state) && canHoldOffice(state) &&
    state.government.pmId !== 'player' && state.player.hasSeat &&
    state.day >= ((state.player.flags._pmHeaveCooldownUntil as number) ?? 0)
  ) {
    const polls = partyPolling(state, state.government.governingParty);
    if (polls < 28) {
      const hazard = Math.min(0.03, (28 - polls) * 0.004);
      if (rng.chance(hazard)) {
        state.player.flags._pmHeaveCooldownUntil = state.day + rng.int(900, 1400);
        state.forcedQueue.push({ kind: 'pmHeave' });
        nextStep(state, rng);
        return;
      }
    }
  }

  // the deputy's job: very rarely, an exceptional Secretary of State who is close
  // to the PM is elevated to Deputy Prime Minister / First Secretary of State
  if (
    playerInGovernment(state) && !playerIsLeader(state) &&
    state.government.pmId !== 'player' &&
    // a departmental Secretary of State (never the Chief Whip) can be made deputy
    !!state.player.officeId?.startsWith('sos_') &&
    !state.player.flags._isDeputyPM && canHoldOffice(state) &&
    state.day >= ((state.player.flags._deputyPmCooldownUntil as number) ?? 0)
  ) {
    const s = state.player.stats;
    const excellent = s.competence > 65 && s.profile > 60 && s.partyStanding > 65;
    if (excellent && relationshipValue(state, 'leader') > 40 && rng.chance(DEPUTY_PM_HAZARD)) {
      state.player.flags._deputyPmCooldownUntil = state.day + rng.int(700, 1100);
      state.forcedQueue.push({ kind: 'deputyPmOffer' });
      nextStep(state, rng);
      return;
    }
  }

  // ...and the PM can let their deputy go: a falling-out (soured relationship or a
  // scandal) makes it likely, otherwise it's a rare refresh of the top team. Removing
  // the title clears _isDeputyPM, so this can't re-fire on a player who's already out.
  if (
    state.player.flags._isDeputyPM && !playerIsLeader(state) &&
    state.government.pmId !== 'player' && canHoldOffice(state)
  ) {
    const fallout = relationshipValue(state, 'leader') < 12 || !!state.player.flags.scandal;
    const hazard = (fallout ? DEPUTY_REMOVAL_FALLOUT : 0) + DEPUTY_REMOVAL_REFRESH;
    if (rng.chance(hazard)) {
      state.forcedQueue.push({ kind: 'deputyRemoval' });
      nextStep(state, rng);
      return;
    }
  }

  // a minister who clung on through a scandal is living on borrowed time — until the
  // window passes, the leadership is sharply more likely to find a moment to sack them
  if (
    onFrontbenchTrack(state) && !playerIsLeader(state) && state.player.officeId &&
    typeof state.player.flags._scandalExposed === 'number'
  ) {
    if (state.day >= (state.player.flags._scandalExposed as number)) {
      delete state.player.flags._scandalExposed; // they rode it out
    } else if (rng.chance(0.25)) {
      delete state.player.flags._scandalExposed;
      state.forcedQueue.push({ kind: 'dismissal' });
      nextStep(state, rng);
      return;
    }
  }

  // reshuffles — the player-leader runs their own; everyone else is subject to them
  if (onFrontbenchTrack(state) && playerIsLeader(state) && rng.chance(PM_RESHUFFLE_HAZARD)) {
    state.forcedQueue.push({ kind: 'pmReshuffle' });
    nextStep(state, rng);
    return;
  }
  if (onFrontbenchTrack(state) && !playerIsLeader(state) && canHoldOffice(state) && !reshuffleOfferThisMonth(state)) {
    // a party deep in the polling mire reshuffles in desperation
    const inTheMire = partyPolling(state, state.player.partyId) < 28;
    const hazard = RESHUFFLE_HAZARD + (inTheMire ? EMERGENCY_RESHUFFLE_BONUS : 0);
    if (rng.chance(hazard)) {
      runReshuffle(state, rng, inTheMire);
      if (state.forcedQueue.length > 0) {
        nextStep(state, rng);
        return;
      }
    }
  }

  // positions cycle: after a spell in post (mean ~2 years, with a long tail) a
  // move comes calling — a lateral switch to a new brief or a promotion, never a
  // demotion, so the player doesn't stagnate for years in the same department
  if (onFrontbenchTrack(state) && !playerIsLeader(state) && canHoldOffice(state) && state.player.officeId && !reshuffleOfferThisMonth(state)) {
    const t = (state.day - (state.player.officeSinceDay ?? state.day)) / 365;
    if (t > 0.75) {
      const base = 0.06 + 0.06 * (t - 1);
      const tierDamp = playerTier(state) === 4 ? 0.35 : 1; // secretaries of state are much stickier
      if (rng.chance(Math.min(0.22, base * tierDamp))) {
        const target = nextOfficeFor(state, rng);
        if (target) {
          state.forcedQueue.push({
            kind: 'reshuffleOffer',
            payload: { officeId: target, sideways: OFFICES[target].tier <= playerTier(state) },
          });
          nextStep(state, rng);
          return;
        }
      }
    }
  }

  // an extra rung onto the ladder for promising newcomers (reshuffles are rare)
  const playerTierNow = playerTier(state);
  if (
    state.player.officeId === null &&
    onFrontbenchTrack(state) && canHoldOffice(state) &&
    !offersSuppressed(state) &&
    state.player.stats.partyStanding >= 45 &&
    (state.day - state.player.enteredParliament) > 180 &&
    !reshuffleOfferThisMonth(state) &&
    rng.chance(FIRST_RUNG_HAZARD)
  ) {
    // a returning ex-minister gets offered near their old level, not PPS
    const target = nextOfficeFor(state, rng);
    state.forcedQueue.push({
      kind: 'reshuffleOffer',
      payload: { officeId: target ?? (rng.chance(0.55) ? 'pps' : 'whip') },
    });
    nextStep(state, rng);
    return;
  }

  // being PASSED OVER — the climb is not a conveyor. An MP who is plausibly in the
  // frame for a job (a backbencher with the standing for a first rung, or a junior
  // minister hoping to move up) sometimes watches the reshuffle pass them by entirely.
  // No office changes hands; the cost is reputational, and it gently caps a career that
  // never quite breaks through. Fires only when the player is genuinely "expecting"
  // something (so it doesn't pester an MP with no ambitions) and not already cooling off.
  if (
    onFrontbenchTrack(state) && !playerIsLeader(state) && canHoldOffice(state) &&
    !offersSuppressed(state) && !reshuffleOfferThisMonth(state) &&
    (state.day - state.player.enteredParliament) > 365 &&
    (
      (state.player.officeId === null && state.player.stats.partyStanding >= 42) ||
      (playerTier(state) >= 1 && playerTier(state) <= 2)
    ) &&
    rng.chance(PASSED_OVER_HAZARD)
  ) {
    state.player.flags._lastReshuffleOfferDay = state.day; // counts as this month's approach
    state.forcedQueue.push({ kind: 'passedOver' });
    nextStep(state, rng);
    return;
  }

  // a select-committee chairmanship comes up for an established backbencher (any
  // party) — a prestige scrutiny role won by a ballot of the whole House
  if (
    canChairCommittee(state) && !state.player.committeeChair &&
    (state.player.stats.profile > 45 || state.player.stats.competence > 50) &&
    // the ~100-day settling-in wait applies only at the start of the game (the first
    // parliament, before any general election); after an election a fresh chair can
    // come up straight away
    (Object.keys(state.elections).length > 0 || (state.day - state.parliamentStart) > 100) &&
    rng.chance(COMMITTEE_CHAIR_HAZARD)
  ) {
    state.forcedQueue.push({
      kind: 'committeeChairContest',
      payload: { dept: pickCommittee(state, rng) },
    });
    nextStep(state, rng);
    return;
  }

  // accelerated path from PPS/whip into a ministry for strong performers
  if (
    (playerTierNow === 1 || playerTierNow === 2) &&
    onFrontbenchTrack(state) && canHoldOffice(state) &&
    !offersSuppressed(state) &&
    !reshuffleOfferThisMonth(state) &&
    rng.chance(MINISTER_RUNG_HAZARD)
  ) {
    const target = nextOfficeFor(state, rng);
    if (target) {
      const score = eligibilityScore(state, target) + rng.normal(0, 6);
      if (score >= offerThreshold(target)) {
        state.forcedQueue.push({ kind: 'reshuffleOffer', payload: { officeId: target } });
        nextStep(state, rng);
        return;
      }
    }
  }

  // minor-party career: spokesperson offers (frequent — the bench is thin) and
  // the occasional leadership vacancy the player can contest. Independents are
  // excluded — sitting outside every party means no offers and no contests.
  if (onMinorPartyTrack(state) && !playerIsLeader(state) && canHoldOffice(state)) {
    const party = state.player.partyId;
    // the party changes its own leader. A tenure ramp + cooldown keeps contests
    // spaced out (not clustered then absent): nothing in the first year after a
    // contest, then a chance that rises with the leader's tenure.
    if (state.player.flags._minorContestDay === undefined) {
      state.player.flags._minorContestDay = state.day;
    }
    const yrsSince = (state.day - (state.player.flags._minorContestDay as number)) / 365;
    const churnHazard = yrsSince > 1
      ? Math.min(0.08, 0.008 + 0.012 * (yrsSince - 1))
      : 0;
    if (yrsSince > 1 && (rng.chance(NPC_LEADER_SCANDAL) || rng.chance(churnHazard))) {
      state.player.flags._minorContestDay = state.day;
      state.history.push({
        kind: 'event', date: state.day,
        headline: `The ${PARTIES[party].name} leadership falls vacant`,
      });
      openLeadershipVacancy(state, rng, party);
      nextStep(state, rng);
      return;
    }
    // a spokesperson/critic offer — a gentler bar than the main parties. But if
    // the party is in a coalition, this is a real government post, and those are
    // hard to come by for a junior partner: a stiffer bar than usual.
    if (rng.chance(MINOR_CRITIC_HAZARD) && !reshuffleOfferThisMonth(state)) {
      const target = nextOfficeFor(state, rng);
      // never re-offer the exact office the player already holds
      if (target && target !== state.player.officeId) {
        const score = eligibilityScore(state, target) + rng.normal(0, 6);
        const baseBar = OFFER_THRESHOLDS[OFFICES[target].tier] ?? 60;
        const bar = playerInGovernmentBloc(state) ? baseBar + 5 : baseBar - 8;
        if (score >= bar) {
          state.forcedQueue.push({ kind: 'reshuffleOffer', payload: { officeId: target } });
          nextStep(state, rng);
          return;
        }
      }
    }
  }

  // a living political world: front benches churn, leaders fall.
  // Iterate the two frontbench parties; the one the player leads runs its own
  // reshuffles (handled above), so skip it here.
  for (const party of [state.government.governingParty, state.government.oppositionParty]) {
    const isGov = party === state.government.governingParty;
    const leaderId = isGov ? state.government.pmId : state.government.loId;
    if (leaderId === 'player') continue;

    // leader churn: scandal (any time, rare) or a polling collapse. The collapse is
    // anchored to DECLINE from the vote share they won at the last election — under
    // FPTP a leader can govern on a low-but-stable vote without "sliding" — with a
    // low absolute backstop floor to still catch a genuine wipeout.
    const polls = partyPolling(state, party);
    const ref = (lastElectionShares(state)[party] ?? 0) * 100;
    const BACKSTOP_FLOOR = 16;
    const SLIDE_PTS = 8;
    // a leader still polling respectably isn't "collapsing", even if down from a big win
    const SLIDE_CEILING = 30;
    const scandalFall = rng.chance(NPC_LEADER_SCANDAL);
    // a PM gets a ~3-month grace before the polls can fell them — a leader who just
    // won shouldn't resign over polling the same month (only scandal, Liz-Truss-style)
    const pmGrace = !isGov || (state.day - state.government.pmSinceDay) >= 90;
    const slid = polls < BACKSTOP_FLOOR || ((ref - polls) >= SLIDE_PTS && polls < SLIDE_CEILING);
    const collapse = pmGrace && slid && rng.chance(LEADER_COLLAPSE_HAZARD);
    if (scandalFall || collapse) {
      const leaderName = state.characters[leaderId]?.name ?? 'The leader';
      const role = isGov ? 'Prime Minister' : `${PARTIES[party].shortName} leader`;
      state.history.push({
        kind: 'event', date: state.day,
        headline: scandalFall
          ? `${leaderName} resigns as ${role} amid scandal`
          : `${leaderName} resigns as ${role} after a collapse in the polls`,
      });
      // if it's the player's own party, they may stand; otherwise an NPC succeeds
      openLeadershipVacancy(state, rng, party);
      nextStep(state, rng);
      return;
    }

    // periodic NPC reshuffles and the very occasional retirement
    if (rng.chance(NPC_RESHUFFLE_HAZARD)) {
      npcReshuffle(state, rng, party);
    } else if (rng.chance(NPC_FRONTBENCH_RETIRE)) {
      npcFrontbencherRetires(state, rng, party);
    }
  }

  // 3b. a live scandal keeps moving: if mid-arc, surface the next beat promptly
  //     rather than waiting for the random walk to wander back to it
  const scandalStage = state.player.flags.scandal_stage;
  if (state.player.hasSeat && typeof scandalStage === 'number' && scandalStage > 0) {
    const beats = SCANDAL_ARC_BEATS.filter((c) => cardEligible(state, c));
    if (beats.length > 0) {
      const beat = rng.pickWeighted(beats, (c) => c.weight);
      state.lastCardId = beat.id;
      state.cardHistory[beat.id] = state.day;
      state.currentCard = makeDrawnCard(state, rng, beat);
      return;
    }
  }

  // 4. a regular card
  const card = drawCard(state, rng, ALL_CARDS, FALLBACK_POOL);
  state.lastCardId = card.id;
  state.cardHistory[card.id] = state.day;
  state.currentCard = makeDrawnCard(state, rng, card);
}

export function queueGeneralElection(state: GameState): void {
  if (playerIsLeader(state) && state.player.hasSeat) {
    // the leader's campaign: seven make-or-break stages
    state.forcedQueue.push(
      { kind: 'campaign', payload: { step: 1, leader: true } },
      { kind: 'campaign', payload: { step: 2, leader: true } },
      { kind: 'campaign', payload: { step: 3, leader: true } },
      { kind: 'campaign', payload: { step: 4, leader: true } },
      { kind: 'campaign', payload: { step: 5, leader: true } },
      { kind: 'campaign', payload: { step: 6, leader: true } },
      { kind: 'campaign', payload: { step: 7, leader: true } },
      { kind: 'electionNight' }
    );
  } else {
    state.forcedQueue.push(
      { kind: 'campaign', payload: { step: 1 } },
      { kind: 'campaign', payload: { step: 2 } },
      { kind: 'campaign', payload: { step: 3 } },
      { kind: 'electionNight' }
    );
  }
  state.nextElectionBy = state.day + 50;
}

/** the player-PM "call an election?" decision */
export function resolveEarlyElectionChoice(
  state: GameState,
  choiceIndex: number
): { text: string; deltas: StatDelta[] } {
  if (choiceIndex === 0) {
    queueGeneralElection(state);
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${state.player.name} calls a snap general election`,
    });
    return {
      text: 'You stand at the lectern outside Number 10 and ask the country for a fresh mandate. The campaign machine roars into life behind you. No turning back now.',
      deltas: [],
    };
  }
  return {
    text: 'You bank the lead and carry on governing. The strategy team files the polling away with the air of people who will mention this again.',
    deltas: [],
  };
}
