import { DrawnCard, ExecutiveCollapseCause, GameState, PartyId } from '../types/game';
import { ExecutiveSnapshot, NI_EXECUTIVE_HISTORY, NI_EXECUTIVE_HISTORY_END, formationLaw } from '../data/niAssembly';
import { chamberOf } from '../data/chambers';
import { partyNameIn, partyNameWithArticle } from '../data/parties';
import { executiveDepartments } from '../data/offices';
import { legislatureAt } from '../data/devolved';
import {
  ExecutivePlan, FormOptions, InstallOptions, allocateMinistries, blockingParty, emptyCabinet, executiveInBeing,
  formExecutive, isJointExecutive, vacateHeads,
} from './executive';
import { arenaBaseline, partyPollingShare } from './polling';
import { isoToDay } from './clock';
import { characterName } from './relationships';
import { Rng, clamp } from './rng';

/**
 * The Executive falling, living without one, and re-forming.
 *
 * A collapse keeps the designates in place: `governingParty` and
 * `coalitionPartner` still name the two heads' parties and `pmId` the First
 * Minister-designate, but `executive.status` is `'collapsed'`, nobody holds the
 * two offices, and the other ministers stay only as caretakers until the law
 * removes them. The clock runs on the statutory period, which the Secretary of
 * State extends a few times before an extraordinary election, and a deal re-forms
 * the Executive through `formExecutive`. A player who leads a head party is
 * asked (the `executiveCrisis` and `executiveTalks` cards) where the NPC world
 * rolls. Everything here is reached only through `isJointExecutive`, so the
 * Commons never draws from it.
 */

/** the walkout hazard per tick while formed, at zero strain */
export const WALKOUT_HAZARD = 0.0025;
/** the deal hazard per tick while collapsed, plus this much more per year collapsed */
export const DEAL_HAZARD = 0.02;
export const DEAL_HAZARD_PER_YEAR = 0.015;
/** the Secretary of State always extends the first lapse (an election straight
 *  after an election settles nothing: 2017 and 2022 both went to legislation,
 *  not the polls), then extends this often, at most this many times */
export const EXTENSION_CHANCE = 0.85;
export const MAX_EXTENSIONS = 6;
export const EXTENSION_DAYS = 120;
/** an extraordinary election is called for this many days out */
export const EXTRAORDINARY_ELECTION_LEAD = 45;
/** no collapse outlasts this */
export const COLLAPSE_CAP_DAYS = Math.round(3.5 * 365);
/** the dormant catch-up steps the clock in strides of this many days */
const CATCH_UP_STRIDE = 28;

/** the real chronology, dated */
const CHRONOLOGY = NI_EXECUTIVE_HISTORY.map((ev) => ({ ...ev, day: isoToDay(ev.on) }));
const HISTORY_END = isoToDay(NI_EXECUTIVE_HISTORY_END);

// ---------------------------------------------------------------------------
// falling
// ---------------------------------------------------------------------------

/** The heads cease to hold office. The ministers stay as caretakers until the
 *  law removes them (pre-2022: until the election; the 2022 Act: forty-eight
 *  weeks), the First Minister's tenure closes, the deputy's overlay clears. */
export function collapseExecutive(
  state: GameState, cause: ExecutiveCollapseCause, blocker: PartyId
): void {
  const ex = state.government.executive;
  if (!ex || !executiveInBeing(state)) return;
  const law = formationLaw(state.day);
  ex.status = 'collapsed';
  ex.collapsedDay = state.day;
  ex.cause = cause;
  ex.blocker = blocker;
  ex.deadline = state.day + law.afterVacancy;
  ex.extensions = 0;
  ex.caretakerUntil = law.caretakerAfterVacancy === 'untilElection'
    ? state.nextElectionBy
    : state.day + law.caretakerAfterVacancy;
  delete ex.strain;
  vacateHeads(state);
  const chamber = chamberOf(state.arena);
  const fmName = characterName(state, state.government.pmId);
  const party = partyNameIn(blocker, state.arena);
  state.history.push({
    kind: 'event', date: state.day,
    headline: cause === 'dfmWalkout'
      ? `${party} pulls its ${chamber.deputyHead} out; ${fmName} ceases to be ${chamber.head} with them and the Executive falls`
      : cause === 'fmWalkout'
        ? `${fmName} resigns as ${chamber.head}; the ${chamber.deputyHead} goes with the office and the Executive falls`
        : `${party} refuses to nominate; the Executive falls`,
  });
}

/** past the day the law lets them stay, the caretakers go */
function retireCaretakers(state: GameState): void {
  const ex = state.government.executive;
  if (!ex || executiveInBeing(state)) return;
  if (ex.caretakerUntil !== undefined && state.day >= ex.caretakerUntil) {
    delete ex.caretakerUntil;
    if (state.government.cabinet.length > 0) {
      emptyCabinet(state, 'the caretaker ministers’ time is up and the departments pass to their officials');
      state.history.push({
        kind: 'event', date: state.day,
        headline: 'The caretaker ministers leave office; civil servants run the departments',
      });
    }
  }
}

/** call the extraordinary election the Secretary of State is bound to */
export function callExtraordinaryElection(state: GameState): void {
  state.nextElectionBy = state.day + EXTRAORDINARY_ELECTION_LEAD;
  state.history.push({
    kind: 'event', date: state.day,
    headline: `With no Executive formed in time, the Secretary of State calls an Assembly election for ${EXTRAORDINARY_ELECTION_LEAD} days’ time`,
  });
}

// ---------------------------------------------------------------------------
// re-forming
// ---------------------------------------------------------------------------

/** the Executive re-forms around the designates: the rules run again on the
 *  seats, with the blocker's party back inside */
export function restoreExecutive(state: GameState, rng: Rng, opts: FormOptions = {}): ExecutivePlan | null {
  return formExecutive(state, rng, { ...opts, restored: true });
}

/** the caretaker arrangement a collapsed snapshot describes, as an install option */
export function caretakersFrom(
  snapshot: ExecutiveSnapshot, startDay: number
): InstallOptions['collapsed'] | undefined {
  if (snapshot.status !== 'collapsed' || !snapshot.collapsedOn || !snapshot.cause || !snapshot.blocker) return undefined;
  const collapsedDay = isoToDay(snapshot.collapsedOn);
  const care = snapshot.caretaker && isoToDay(snapshot.caretaker.until) > startDay ? snapshot.caretaker : undefined;
  // the caretakers' departments were shared out on the previous Assembly's seats
  const seats = legislatureAt('ni', collapsedDay).seats;
  return {
    cause: snapshot.cause, blocker: snapshot.blocker, collapsedDay,
    ...(care ? {
      caretakers: {
        until: isoToDay(care.until),
        parties: [...care.parties],
        allocation: allocateMinistries(seats, care.parties, executiveDepartments('ni'), care.justice),
      },
    } : {}),
  };
}

// ---------------------------------------------------------------------------
// the clock
// ---------------------------------------------------------------------------

function yearsCollapsed(state: GameState): number {
  const ex = state.government.executive;
  if (!ex || executiveInBeing(state) || ex.collapsedDay === undefined) return 0;
  return (state.day - ex.collapsedDay) / 365;
}

/** the party whose leader the player is, when that party is a head party */
function playerLedHead(state: GameState): PartyId | undefined {
  if (state.player.officeId !== 'leader' || !state.player.hasSeat) return undefined;
  const party = state.player.partyId;
  const gv = state.government;
  return party === gv.governingParty || party === gv.coalitionPartner ? party : undefined;
}

export type TalksContext = 'deadline' | 'deal' | 'cap' | 'postElection' | 'arrival';

/** One tick of the Executive's life, for the live chamber. Returns true when it
 *  queued a decision for the player (the caller shows it). Draws only here. */
export function collapseTick(state: GameState, rng: Rng): boolean {
  if (!isJointExecutive(state.arena)) return false;
  const gv = state.government;
  const ex = gv.executive;
  if (!ex) return false;
  const playerHead = playerLedHead(state);

  if (executiveInBeing(state)) {
    // strain eases while things hold; the deputy's party sliding in the polls tightens it
    const dfm = gv.coalitionPartner;
    const slide = dfm ? Math.max(0, (arenaBaseline(state)[dfm] ?? 0) - partyPollingShare(state, dfm)) * 100 : 0;
    const strain = clamp((ex.strain ?? 0) * 0.97 + slide * 0.4, 0, 100);
    ex.strain = strain;
    if (!rng.chance(WALKOUT_HAZARD * (1 + strain / 50))) return false;
    // the deputy's party walks far more often than the First Minister's
    const walker: PartyId = rng.chance(0.7) ? (dfm ?? gv.governingParty) : gv.governingParty;
    if (walker === playerHead) {
      if (!state.forcedQueue.some((e) => e.kind === 'executiveCrisis')) {
        state.forcedQueue.push({ kind: 'executiveCrisis' });
      }
      return true;
    }
    collapseExecutive(state, walker === gv.governingParty ? 'fmWalkout' : 'dfmWalkout', walker);
    return false;
  }

  // collapsed
  retireCaretakers(state);
  const years = yearsCollapsed(state);
  const blockerIsPlayer = playerHead !== undefined && blockingParty(state) === playerHead;
  const talksQueued = state.forcedQueue.some((e) => e.kind === 'executiveTalks');
  const talks = (context: TalksContext) => {
    if (!talksQueued) state.forcedQueue.push({ kind: 'executiveTalks', payload: { context } });
    return true;
  };

  // the cap: a deal is forced, and a player blocker is given the last word once;
  // a leader who held out and survived the party is overruled the next time
  if (ex.collapsedDay !== undefined && state.day - ex.collapsedDay >= COLLAPSE_CAP_DAYS) {
    if (blockerIsPlayer && !ex.capAsked) {
      ex.capAsked = true;
      return talks('cap');
    }
    restoreExecutive(state, rng);
    return false;
  }

  // the deal hazard rises the longer it goes on
  if (rng.chance(DEAL_HAZARD + DEAL_HAZARD_PER_YEAR * years)) {
    if (blockerIsPlayer) return talks('deal');
    restoreExecutive(state, rng);
    return false;
  }

  // the statutory deadline: an extension, or the extraordinary election
  if (ex.deadline !== undefined && state.day >= ex.deadline) {
    if (blockerIsPlayer && !talksQueued) {
      // the blocker's leader is asked first; the Secretary of State's move follows the answer
      ex.deadline = state.day + 14;
      return talks('deadline');
    }
    secretaryOfStateMoves(state, rng);
  }
  return false;
}

/** the period has run out: the Secretary of State extends it, or calls the election */
export function secretaryOfStateMoves(state: GameState, rng: Rng): void {
  const ex = state.government.executive;
  if (!ex || executiveInBeing(state)) return;
  // the clock restarts after the election
  const afterTheElection = () => state.nextElectionBy + formationLaw(state.day).afterElection;
  if (state.nextElectionBy - state.day <= EXTRAORDINARY_ELECTION_LEAD) {
    ex.deadline = afterTheElection();
    return;
  }
  const used = ex.extensions ?? 0;
  if (used === 0 || (used < MAX_EXTENSIONS && rng.chance(EXTENSION_CHANCE))) {
    ex.extensions = used + 1;
    ex.deadline = state.day + EXTENSION_DAYS;
    state.history.push({
      kind: 'event', date: state.day,
      headline: `The Secretary of State legislates to extend the deadline for forming an Executive by another ${Math.round(EXTENSION_DAYS / 30)} months`,
    });
    return;
  }
  callExtraordinaryElection(state);
  ex.deadline = afterTheElection();
}

// ---------------------------------------------------------------------------
// the dormant chamber
// ---------------------------------------------------------------------------

/** Run the Executive's clock for a chamber the player is not in, from the
 *  chamber's `day` up to `to`. Real history is played to the day until the
 *  chronology runs out; the hazards take over beyond it. May pull
 *  `nextElectionBy` forward (an extraordinary election), in which case it stops
 *  there so the caller can fight it. */
export function catchUpExecutive(state: GameState, rng: Rng, to: number): void {
  if (!isJointExecutive(state.arena) || !state.government.executive) return;
  let day = state.day;
  while (day < to && day < state.nextElectionBy) {
    const next = Math.min(day + CATCH_UP_STRIDE, to, state.nextElectionBy);
    const scripted = CHRONOLOGY.filter((ev) => ev.day > day && ev.day <= next);
    day = next;
    for (const ev of scripted) {
      state.day = ev.day;
      if (ev.kind === 'collapse') {
        if (executiveInBeing(state)) {
          collapseExecutive(state, ev.cause, ev.blocker);
          if (ev.electionOn) state.nextElectionBy = Math.min(state.nextElectionBy, isoToDay(ev.electionOn));
        }
      } else if (!executiveInBeing(state)) {
        restoreExecutive(state, rng, { snapshot: ev.executive, playerSeated: false });
      }
    }
    state.day = day;
    if (scripted.length > 0 || day <= HISTORY_END) {
      // the chronology speaks for this stretch: no hazards
      retireCaretakers(state);
      continue;
    }
    collapseTick(state, rng);
  }
}

// ---------------------------------------------------------------------------
// the other government, seen from Westminster
// ---------------------------------------------------------------------------

/** who speaks for a nation's devolved government on a given day, when the
 *  chamber has never been built: the real chronology says whether Stormont had
 *  an Executive at all */
export function stormontStoodOn(day: number): boolean {
  let formed = true;
  for (const ev of CHRONOLOGY) {
    if (ev.day > day) break;
    formed = ev.kind === 'restore';
  }
  return formed;
}

// ---------------------------------------------------------------------------
// the player's cards
// ---------------------------------------------------------------------------

export function buildExecutiveCard(state: GameState, rng: Rng, kind: 'executiveCrisis' | 'executiveTalks', payload: Record<string, unknown> | undefined): DrawnCard {
  const arena = state.arena ?? 'uk';
  const chamber = chamberOf(arena);
  const gv = state.government;
  const party = state.player.partyId;
  const other = party === gv.governingParty ? gv.coalitionPartner : gv.governingParty;
  const otherName = other ? partyNameWithArticle(other, arena) : 'the other side';
  if (kind === 'executiveCrisis') {
    const fm = party === gv.governingParty;
    return {
      cardId: `forced_execcrisis_${state.day}`,
      kind,
      title: fm ? 'Walk out of Stormont Castle?' : 'Pull the plug?',
      body: `The row with ${otherName} has gone past the point where a joint statement can paper it. Your own people want you to ${fm ? `resign as ${chamber.head}` : `withdraw your ${chamber.deputyHead}`} and bring the Executive down: the office is joint, so if one of you goes, both go, and ${chamber.place} is governed by nobody until a deal is done. The other thing you can do is stay, and be seen to have stayed.`,
      choices: [
        { label: fm ? 'Resign, and bring it down' : 'Withdraw, and bring it down', sublabel: 'your party cheers; the departments go to their officials' },
        { label: 'Stay in, and take the hit', sublabel: 'the Executive stands; your party does not forgive quickly' },
      ],
      payload: { ...payload, advance: rng.int(5, 12) },
    };
  }
  const context = (payload?.context as TalksContext) ?? 'deadline';
  const months = Math.max(1, Math.round(((state.day - (gv.executive?.collapsedDay ?? state.day)) / 30)));
  const bodies: Record<TalksContext, string> = {
    deadline: `The statutory period for forming an Executive runs out this week, and you are the reason it has not been formed. The Secretary of State has been on the phone twice. Civil servants are running ${chamber.place}’s departments on last year’s budget, the health service is writing to you about waiting lists, and ${otherName} say they will nominate the moment you do. It has been ${months} months.`,
    deal: `A paper has come back from London and Dublin that gives you most of what you walked out for, and not all of it. Your negotiators think it is as good as it gets. Your hardliners think it is a sell-out. ${otherName} have already said yes. ${chamber.place} has been without an Executive for ${months} months.`,
    cap: `Three and a half years. The party has had enough: the ministers who lost their departments, the councillors who face the voters, the business lobby that stopped taking your calls. A delegation is in your office with the text of a deal and a message that is not quite a threat. Nominate, or they will find somebody who will.`,
    postElection: `The count is in and the Assembly meets next week to elect a Speaker and nominate its heads. ${otherName} say they are ready. Your party fought the election saying it would not go back in until its demands were met, and they have not been met. The members are watching for the first sign that you blinked.`,
    arrival: `You arrive at ${chamber.seat} to lead a party that has kept the Executive down for ${months} months. The officials in your new office would like to know, politely, whether that is still the policy.`,
  };
  const holdOut = context === 'cap'
    ? { label: 'Hold out anyway', sublabel: 'the party may not let you' }
    : { label: 'Hold out', sublabel: 'the stalemate goes on; your base approves' };
  return {
    cardId: `forced_exectalks_${state.day}`,
    kind,
    title: context === 'postElection' ? 'Nominate, or not' : context === 'cap' ? 'The party has had enough' : 'Back in?',
    body: bodies[context],
    choices: [
      { label: context === 'postElection' ? 'Nominate, and go back in' : 'Take the deal and go back in', sublabel: 'the Executive is re-formed within the week' },
      holdOut,
    ],
    payload: { ...payload, context, advance: rng.int(5, 14) },
  };
}

export function resolveExecutiveCard(
  state: GameState, rng: Rng, card: DrawnCard, choiceIndex: number,
  gain: (key: 'profile' | 'partyStanding' | 'integrity' | 'competence' | 'constituencyApproval', delta: number, label: string) => void
): string {
  const arena = state.arena ?? 'uk';
  const chamber = chamberOf(arena);
  const gv = state.government;
  const party = state.player.partyId;
  if (card.kind === 'executiveCrisis') {
    if (choiceIndex === 0) {
      const fm = party === gv.governingParty;
      collapseExecutive(state, fm ? 'fmWalkout' : 'dfmWalkout', party);
      gain('partyStanding', 10, 'Standing');
      gain('profile', 6, 'Profile');
      gain('competence', -4, 'Competence');
      return `You do it on the steps, in the rain, with the letter already delivered. By evening the departments belong to their permanent secretaries and ${chamber.place} has no government. Your party is jubilant. Everybody else is writing down the date.`;
    }
    gain('partyStanding', -8, 'Standing');
    gain('integrity', 3, 'Integrity');
    gain('competence', 2, 'Competence');
    if (gv.executive) gv.executive.strain = clamp((gv.executive.strain ?? 0) - 25, 0, 100);
    return `You stay. The statement says the people of ${chamber.place} did not elect an Executive to walk out of itself, which is true and which your own backbenchers receive in silence. The Executive meets on Thursday as if nothing had happened, and everyone knows something has.`;
  }
  // executiveTalks
  const context = (card.payload?.context as TalksContext) ?? 'deadline';
  if (choiceIndex === 0) {
    restoreExecutive(state, rng);
    gain('competence', 5, 'Competence');
    gain('profile', 4, 'Profile');
    gain('partyStanding', context === 'cap' ? 2 : -6, 'Standing');
    return `You nominate. The chamber fills for the first time in months, the Speaker is elected, and the two of you read out the names of an Executive while the gallery watches for a flicker. Your hardliners call it a surrender. The waiting lists call it Tuesday.`;
  }
  gain('partyStanding', context === 'cap' ? -12 : 6, 'Standing');
  gain('competence', -3, 'Competence');
  gain('integrity', 2, 'Integrity');
  if (context === 'cap') {
    // the party overrules you: a challenge, and the deal is done by whoever wins
    state.forcedQueue.unshift({ kind: 'partyCoup' });
    return `You hold out, and the delegation leaves without shaking your hand. By the weekend the letters are going in. The party has decided to go back in, and it is deciding whether that is with you.`;
  }
  if (context === 'deadline' && gv.executive) {
    // the Secretary of State's move follows
    gv.executive.deadline = state.day;
    secretaryOfStateMoves(state, rng);
  }
  return context === 'postElection'
      ? `You do not nominate. The Assembly meets, fails to elect a Speaker, and adjourns. ${chamber.place} has elected a parliament that cannot sit, and the clock has started again.`
      : `You hold out. The Secretary of State does what Secretaries of State do, which is extend things and look pained. Your base is delighted. The permanent secretaries order more stationery.`;
}
