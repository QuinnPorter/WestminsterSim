import { DrawnCard, GameState, StatDelta } from '../types/game';
import { ALL_CARDS, FALLBACK_POOL } from '../content/cards';
import { PARTIES } from '../data/parties';
import { drawCard, makeDrawnCard, resolveTokens } from './cardEngine';
import {
  applyElectionAftermath, materializeForced, playerIsPM, runReshuffle,
  openLeadershipVacancy, playerIsLeader, onFrontbenchTrack,
} from './career';
import { runElection } from './election';
import { partyPolling, pollingLead } from './polling';
import { isoToDay, yearOf } from './clock';
import { Rng, clamp } from './rng';

// ---------- calendar ----------

interface CalendarEvent {
  key: string;
  month: number; // 1-12
  day: number;
}

const CALENDAR: CalendarEvent[] = [
  { key: 'budget', month: 3, day: 10 },
  { key: 'locals', month: 5, day: 4 },
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

function makeCalendarCard(state: GameState, rng: Rng, key: string): DrawnCard {
  const base = {
    cardId: `cal_${key}_${state.day}`,
    kind: 'calendar' as const,
    payload: { calKey: key, advance: rng.int(14, 28) },
  };
  switch (key) {
    case 'conference':
      return {
        ...base,
        title: 'Party conference',
        body: resolveTokens(state,
          'Conference season. Lanyards, warm white wine, and a fringe-event invitation for every hour of the day. How do you play the week?'),
        choices: [
          { label: 'Work the fringe circuit' },
          { label: 'Stay loyal and visible in the hall' },
          { label: 'Skip it for constituency week' },
        ],
      };
    case 'budget':
      return {
        ...base,
        title: 'Budget day',
        body: resolveTokens(state, playerIsPM(state) || state.player.officeId === 'sos_treasury'
          ? 'Budget day, and the red box is yours to hold up for the cameras. The numbers inside are less photogenic.'
          : 'Budget day. The Chancellor performs for an hour while everyone scans the fine print for the trap. Your inbox will want a verdict by teatime.'),
        choices: [
          { label: 'Champion it loudly' },
          { label: 'Pick at the fine print' },
        ],
      };
    case 'locals':
      return {
        ...base,
        title: 'Local elections',
        body: resolveTokens(state,
          'Local election night. Church halls, trestle tables, and a thousand small verdicts that the pundits will weave into one big one by breakfast.'),
        choices: [
          { label: 'Campaign hard for the locals' },
          { label: 'Keep your head down nationally' },
        ],
      };
    case 'recess':
    default:
      return {
        ...base,
        title: 'Summer recess',
        body: resolveTokens(state,
          'Recess. Westminster empties and {constituency} gets you back for six weeks. The diary is yours — a rare and dangerous freedom.'),
        choices: [
          { label: 'A summer of surgeries' },
          { label: 'An actual holiday' },
        ],
      };
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
    state.player.stats[k] = clamp(state.player.stats[k] + d, 0, 100);
    deltas.push({ label, delta: d });
  };
  const key = card.payload?.calKey as string;

  switch (key) {
    case 'conference':
      if (choiceIndex === 0) {
        stat('profile', 4, 'Profile');
        stat('partyStanding', 2, 'Standing');
        return { text: 'Five panels, two receptions, one karaoke incident that stays (mostly) off camera. By Thursday, people who matter know your name.', deltas };
      }
      if (choiceIndex === 1) {
        stat('partyStanding', 4, 'Standing');
        return { text: 'You clap in the right places, laugh at the leader\'s jokes, and are visibly, reliably on-message. Loyalty is a currency; you just minted some.', deltas };
      }
      stat('constituencyApproval', 4, 'Approval');
      stat('partyStanding', -2, 'Standing');
      return { text: 'While colleagues network at the bar, you open a community centre and visit three schools. {constituency} approves. The party notes your absence.', deltas };

    case 'budget':
      if (choiceIndex === 0) {
        deltas.push({ label: 'Leader', delta: 3 });
        state.relationships.find((r) => r.kind === 'leader')!.value += 3;
        stat('constituencyApproval', -1, 'Approval');
        return { text: 'You defend the numbers on regional radio with conviction you mostly feel. The leadership clips your best line.', deltas };
      }
      stat('competence', 3, 'Competence');
      stat('profile', 2, 'Profile');
      return { text: 'You find the buried table on page 84 that everyone else missed. Your thread explaining it does respectable numbers and earns a nod from the serious commentators.', deltas };

    case 'locals':
      if (choiceIndex === 0) {
        stat('constituencyApproval', 3, 'Approval');
        stat('partyStanding', 2, 'Standing');
        return { text: 'You deliver leaflets until your shoulder aches. The local results in your patch outrun the national trend, and people notice whose name was on the thank-you cake.', deltas };
      }
      stat('competence', 1, 'Competence');
      return { text: 'You let the night wash over you and study the results like tea leaves. Useful patterns, safely observed from a distance.', deltas };

    case 'recess':
    default:
      if (choiceIndex === 0) {
        stat('constituencyApproval', 5, 'Approval');
        return { text: 'Six weeks of surgeries, fetes, and farm visits. By September you know every pothole in {constituency} by name. The casework pile is conquered.', deltas };
      }
      stat('competence', 2, 'Competence');
      stat('constituencyApproval', -1, 'Approval');
      return { text: 'Two weeks somewhere warm with your phone in the hotel safe. You return alarmingly close to being a functional human being.', deltas };
  }
}

// ---------- systemic hazard rates (per tick, ~monthly) ----------

const RESHUFFLE_HAZARD = 0.07;          // ~ once per 14 months
const EMERGENCY_RESHUFFLE_BONUS = 0.04; // extra hazard when the party is in the polling mire
const PM_RESHUFFLE_HAZARD = 0.055;      // player-leader interactive reshuffles
const PM_LATE_TERM_ELECTION = 0.06;     // NPC PM "goes early" in year five
const PM_SNAP_ELECTION = 0.012;         // rare snap on an exceptional polling lead
const PLAYER_PM_ELECTION_PROMPT = 0.08;
const PM_LONGEVITY_RESIGN = 0.015;      // PM stands down after a long innings
const PM_SCANDAL_RESIGN = 0.0025;       // PM felled by scandal
const LEADER_COLLAPSE_HAZARD = 0.02;
const FIRST_RUNG_HAZARD = 0.14;         // extra path onto the ladder for tier-0 players

// ---------- the brain ----------

export function nextStep(state: GameState, rng: Rng): void {
  if (state.gameOver) {
    state.currentCard = null;
    return;
  }

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
    state.currentCard = materializeForced(state, rng, forced);
    return;
  }

  // 2. calendar events (skip while seatless)
  if (state.player.hasSeat) {
    for (const ev of CALENDAR) {
      const due = state.calendarDone[ev.key];
      if (due !== undefined && state.day >= due) {
        state.calendarDone[ev.key] = nextOccurrence(state.day, ev.month, ev.day);
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

  // reshuffles — the player-leader runs their own; everyone else is subject to them
  if (onFrontbenchTrack(state) && playerIsLeader(state) && rng.chance(PM_RESHUFFLE_HAZARD)) {
    state.forcedQueue.push({ kind: 'pmReshuffle' });
    nextStep(state, rng);
    return;
  }
  if (onFrontbenchTrack(state) && !playerIsLeader(state)) {
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

  // an extra rung onto the ladder for promising newcomers (reshuffles are rare)
  if (
    state.player.officeId === null &&
    onFrontbenchTrack(state) &&
    state.player.stats.partyStanding >= 48 &&
    (state.day - state.player.enteredParliament) > 365 &&
    rng.chance(FIRST_RUNG_HAZARD)
  ) {
    state.forcedQueue.push({
      kind: 'reshuffleOffer',
      payload: { officeId: rng.chance(0.55) ? 'pps' : 'whip' },
    });
    nextStep(state, rng);
    return;
  }

  // leadership collapse: sustained dismal polling fells a leader
  const playerParty = state.player.partyId;
  const isGovParty = playerParty === state.government.governingParty;
  const collapseThreshold = isGovParty ? 21 : 17;
  if (
    !playerIsLeader(state) &&
    onFrontbenchTrack(state) &&
    partyPolling(state, playerParty) < collapseThreshold &&
    rng.chance(LEADER_COLLAPSE_HAZARD)
  ) {
    const leaderName = state.characters[
      isGovParty ? state.government.pmId : state.government.loId
    ]?.name ?? 'The leader';
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${leaderName} resigns as ${PARTIES[playerParty].shortName} leader after polling collapse`,
    });
    openLeadershipVacancy(state, rng, playerParty);
    nextStep(state, rng);
    return;
  }

  // 4. a regular card
  const card = drawCard(state, rng, ALL_CARDS, FALLBACK_POOL);
  state.lastCardId = card.id;
  state.cardHistory[card.id] = state.day;
  state.currentCard = makeDrawnCard(state, rng, card);
}

export function queueGeneralElection(state: GameState): void {
  if (playerIsLeader(state) && state.player.hasSeat) {
    // the leader's campaign: five make-or-break stages
    state.forcedQueue.push(
      { kind: 'campaign', payload: { step: 1, leader: true } },
      { kind: 'campaign', payload: { step: 2, leader: true } },
      { kind: 'campaign', payload: { step: 3, leader: true } },
      { kind: 'campaign', payload: { step: 4, leader: true } },
      { kind: 'campaign', payload: { step: 5, leader: true } },
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
