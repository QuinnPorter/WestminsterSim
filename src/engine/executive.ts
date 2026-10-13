import {
  ArenaId, CabinetPost, DepartmentId, Designation, ExecutiveCollapseCause, GameState, OfficeId, PartyId,
} from '../types/game';
import type { ExecutiveSnapshot } from '../data/niAssembly';
import { formationLaw } from '../data/niAssembly';
import { PARTIES, partyNameIn } from '../data/parties';
import { chamberOf, isDevolved } from '../data/chambers';
import {
  OFFICES, TEO_JUNIOR_DFM, TEO_JUNIOR_FM, cabinetOfficesFor, cabsecOfficeId, executiveDepartments,
  isSpokespersonOffice, spokespersonOfficeId, translateOffice,
} from '../data/offices';
import { dHondt } from './listSeats';
import { largestPartyOutside, totalSeats, workingMajorityIn } from './seats';
import { CastContext, castContext } from './cast';
import { recordLoChange, recordPmChange } from './tenure';
import { characterName } from './relationships';
import { generateCharacter } from '../generation/characters';
import { isoToDay } from './clock';
import { Rng } from './rng';

/**
 * The Northern Ireland Executive.
 *
 * At Stormont the large parties sit in government by right: the First Minister
 * comes from the largest party, the deputy First Minister from the largest party
 * of the other community, and the ministries are shared out by d'Hondt among
 * every party that wants them. There is no winner, so none of the Westminster
 * arrangement machinery (coalition talks, supply and confidence, a minority) is
 * run here: the arrangement is its own, `'executive'`. It is carried on the
 * existing fields so that every reader of `governingParty` (the First
 * Minister's party) and `coalitionPartner` (the deputy First Minister's) keeps
 * working, with `government.executive` naming the whole membership. Which
 * chamber does this is `ChamberProfile.jointExecutive`, never an arena literal.
 */

/** the official opposition needs a bench worth the name: below this share of
 *  the House the largest party outside the Executive has no shadow cabinet and
 *  its members follow the minor-party track */
export const OPPOSITION_SHARE = 0.05;

/** the Assembly elected on 5 May 2016 was the first with an official opposition
 *  (Assembly and Executive Reform (Assembly Opposition) Act 2016): from it a
 *  party entitled to a ministry may decline it and sit in opposition */
export const OPPOSITION_REFORM_DAY = isoToDay('2016-05-05');

/** the share of entitled parties beyond the First and deputy First Ministers'
 *  that decline their ministries after the 2016 reforms */
export const DECLINE_CHANCE = 0.4;

/** how often a tier-3 climber from the First or deputy First Minister's party
 *  is offered the Executive Office's junior post rather than a spokesperson brief */
const TEO_OFFER_CHANCE = 0.3;

/** the order a party reaches for the briefs: the money, then the big spenders */
const DEPARTMENT_PREFERENCE: DepartmentId[] = [
  'finance', 'economy', 'health', 'education', 'infrastructure', 'communities', 'agriculture', 'justice',
];

export function isJointExecutive(arena: ArenaId | undefined): boolean {
  return chamberOf(arena).jointExecutive;
}

// ---------------------------------------------------------------------------
// who sits where
// ---------------------------------------------------------------------------

/** the parties in government: the Executive's membership where there is one,
 *  otherwise the governing party and any coalition partner */
export function executiveParties(state: GameState): PartyId[] {
  const gv = state.government;
  if (gv.executive) return gv.executive.parties;
  return gv.coalitionPartner ? [gv.governingParty, gv.coalitionPartner] : [gv.governingParty];
}

/** is the party in the government bloc: a governing or coalition party at
 *  Westminster, any party holding a ministry in a joint Executive */
export function inGovernmentBloc(state: GameState, party: PartyId): boolean {
  return executiveParties(state).includes(party);
}

/** false only while a collapsed Executive leaves the chamber without heads; a
 *  chamber without a joint Executive always has its government */
export function executiveInBeing(state: GameState): boolean {
  return !state.government.executive || state.government.executive.status === 'formed';
}

/** the sitting head of government, or null while the Executive is collapsed
 *  (`pmId` then still names the First Minister-designate: the largest party's leader) */
export function headOfGovernmentId(state: GameState): string | null {
  return executiveInBeing(state) ? state.government.pmId : null;
}

export function oppositionMinSeats(house: number): number {
  return Math.ceil(house * OPPOSITION_SHARE);
}

/** does the chamber have an official opposition with a bench? Always at
 *  Westminster, Holyrood and the Senedd; at Stormont only when the largest party
 *  outside the Executive clears the bar */
export function hasOfficialOpposition(state: GameState): boolean {
  if (!state.government.executive) return true;
  const opp = state.government.oppositionParty;
  if (!opp || inGovernmentBloc(state, opp)) return false;
  return (state.seats[opp] ?? 0) >= oppositionMinSeats(totalSeats(state.seats));
}

/** the parties whose members sit on a bench: the governing party's cabinet (every
 *  Executive party's, where there is one) and the official opposition's shadow
 *  cabinet, which does not exist below the bar */
export function benchParties(state: GameState, side: 'cabinet' | 'shadowCabinet'): PartyId[] {
  if (side === 'cabinet') return state.government.executive?.parties ?? [state.government.governingParty];
  return hasOfficialOpposition(state) ? [state.government.oppositionParty] : [];
}

/** the party of whoever holds a bench post */
export function postParty(state: GameState, post: CabinetPost): PartyId | undefined {
  if (post.characterId === 'player') return state.player.partyId;
  const c = state.characters[post.characterId];
  return c && c.active ? c.partyId : undefined;
}

/** the party holding each Executive department, read off the cabinet */
export function executiveAllocation(state: GameState): Partial<Record<DepartmentId, PartyId>> {
  const out: Partial<Record<DepartmentId, PartyId>> = {};
  for (const post of state.government.cabinet) {
    const dept = OFFICES[post.officeId]?.department;
    const party = postParty(state, post);
    if (dept && party) out[dept as DepartmentId] = party;
  }
  return out;
}

/** the departments a party runs, read off the cabinet */
export function partyDepartments(state: GameState, party: PartyId): DepartmentId[] {
  return (Object.entries(executiveAllocation(state)) as [DepartmentId, PartyId][])
    .filter(([, p]) => p === party)
    .map(([d]) => d);
}

/** the Executive Office junior post that goes with a party's head of government
 *  post, or null for a party holding neither (or while there is no Executive Office) */
export function teoJuniorFor(state: GameState, party: PartyId): OfficeId | null {
  if (!state.government.executive || !executiveInBeing(state)) return null;
  if (party === state.government.governingParty) return TEO_JUNIOR_FM;
  if (party === state.government.coalitionPartner) return TEO_JUNIOR_DFM;
  return null;
}

/** the party an Executive Office junior post belongs to, or undefined for any other office */
export function teoJuniorParty(state: GameState, officeId: OfficeId): PartyId | undefined {
  if (officeId === TEO_JUNIOR_FM) return state.government.governingParty;
  if (officeId === TEO_JUNIOR_DFM) return state.government.coalitionPartner;
  return undefined;
}

// ---------------------------------------------------------------------------
// designation
// ---------------------------------------------------------------------------

function designationOf(party: PartyId): Designation | undefined {
  return PARTIES[party]?.designation;
}

/** seats by community designation */
export function blocSeats(seats: Partial<Record<PartyId, number>>): Record<Designation, number> {
  const out: Record<Designation, number> = { unionist: 0, nationalist: 0, other: 0 };
  for (const [p, n] of Object.entries(seats) as [PartyId, number][]) {
    const d = designationOf(p);
    if (d) out[d] += n ?? 0;
  }
  return out;
}

/** the designated parties with seats, largest first; ties by first-preference
 *  share, then by id so the order is total */
function rankedParties(
  seats: Partial<Record<PartyId, number>>, shares: Partial<Record<PartyId, number>>
): PartyId[] {
  return (Object.keys(seats) as PartyId[])
    .filter((p) => (seats[p] ?? 0) > 0 && designationOf(p) !== undefined)
    .sort((a, b) => (seats[b] ?? 0) - (seats[a] ?? 0)
      || (shares[b] ?? 0) - (shares[a] ?? 0)
      || (a < b ? -1 : 1));
}

/** The statutory rule since the St Andrews Agreement: the First Minister is
 *  nominated by the largest party, the deputy First Minister by the largest
 *  party of the largest designation other than the First Minister's. So when
 *  the largest party is itself in the largest designation the deputy comes
 *  from the second designation, and when a party of the smallest designation
 *  tops the poll the deputy comes from the largest designation. Null when
 *  every seat sits in one designation, which the Assembly has never produced. */
export function designateFirstMinisters(
  seats: Partial<Record<PartyId, number>>, shares: Partial<Record<PartyId, number>> = {}
): { fm: PartyId; dfm: PartyId } | null {
  const ranked = rankedParties(seats, shares);
  const fm = ranked[0];
  if (!fm) return null;
  const fmBloc = designationOf(fm)!;
  const blocs = blocSeats(seats);
  const blocShare = (d: Designation) => ranked
    .filter((p) => designationOf(p) === d)
    .reduce((a, p) => a + (shares[p] ?? 0), 0);
  const otherBloc = (['unionist', 'nationalist', 'other'] as Designation[])
    .filter((d) => d !== fmBloc && blocs[d] > 0)
    .sort((a, b) => blocs[b] - blocs[a] || blocShare(b) - blocShare(a) || (a < b ? -1 : 1))[0];
  if (!otherBloc) return null;
  const dfm = ranked.find((p) => designationOf(p) === otherBloc);
  return dfm ? { fm, dfm } : null;
}

// ---------------------------------------------------------------------------
// the ministries
// ---------------------------------------------------------------------------

/** Justice is filled by a cross-community vote rather than d'Hondt, and by
 *  convention has gone to a party outside the two communities: Alliance until
 *  2016, an independent from the Assembly that formed that year. Undefined when
 *  nobody fits, and the brief goes into the d'Hondt pool like any other. */
export function pickJusticeParty(
  seats: Partial<Record<PartyId, number>>, day: number, rng: Rng
): PartyId | undefined {
  const alliance = (seats.alliance ?? 0) > 0;
  const independent = (seats.ind ?? 0) > 0;
  if (day < OPPOSITION_REFORM_DAY) return alliance ? 'alliance' : undefined;
  if (alliance && independent) return rng.chance(0.5) ? 'alliance' : 'ind';
  return alliance ? 'alliance' : independent ? 'ind' : undefined;
}

/** every party entitled to at least one departmental ministry by d'Hondt */
export function entitledParties(
  seats: Partial<Record<PartyId, number>>, departments: number
): PartyId[] {
  const votes: Partial<Record<PartyId, number>> = {};
  for (const p of Object.keys(seats) as PartyId[]) {
    if (designationOf(p) !== undefined && (seats[p] ?? 0) > 0) votes[p] = seats[p];
  }
  return [...new Set(dHondt(votes, departments))];
}

/** Share the departments by d'Hondt among the entrant parties, each pick taking
 *  the best brief left. Justice, when it has a party of its own, is held back
 *  from the count. The First and deputy First Ministers' own posts are not
 *  departments and consume no pick. */
export function allocateMinistries(
  seats: Partial<Record<PartyId, number>>, entrants: PartyId[], departments: DepartmentId[],
  justice?: PartyId
): Partial<Record<DepartmentId, PartyId>> {
  const allocation: Partial<Record<DepartmentId, PartyId>> = {};
  const pool = departments.filter((d) => !(justice && d === 'justice'));
  if (justice && departments.includes('justice')) allocation.justice = justice;
  const votes: Partial<Record<PartyId, number>> = {};
  for (const p of entrants) if ((seats[p] ?? 0) > 0) votes[p] = seats[p];
  const order = dHondt(votes, pool.length);
  const left = [...pool].sort((a, b) =>
    DEPARTMENT_PREFERENCE.indexOf(a) - DEPARTMENT_PREFERENCE.indexOf(b));
  for (const party of order) {
    const dept = left.shift();
    if (!dept) break;
    allocation[dept] = party;
  }
  return allocation;
}

export interface ExecutivePlan {
  fm: PartyId;
  dfm: PartyId;
  /** every party taking a ministry, the First and deputy First Ministers' first */
  parties: PartyId[];
  justice?: PartyId;
  allocation: Partial<Record<DepartmentId, PartyId>>;
  declined: PartyId[];
  /** the largest party left outside, whatever its size */
  opposition: PartyId | undefined;
}

/** Decide an Executive from a result: who leads it, who joins it, who gets what.
 *  With a real snapshot the answer is the one history gave; otherwise the rules
 *  run, and after the 2016 reforms the smaller entitled parties may decline. */
export function planExecutive(
  seats: Partial<Record<PartyId, number>>, shares: Partial<Record<PartyId, number>>,
  rng: Rng, day: number, arena: ArenaId, snapshot?: ExecutiveSnapshot,
  opts: { /** a party whose leader the player is: its choice is not rolled */ neverDeclines?: PartyId } = {}
): ExecutivePlan | null {
  if (!isDevolved(arena)) return null;
  const departments = executiveDepartments(arena);
  const finish = (plan: Omit<ExecutivePlan, 'opposition'>): ExecutivePlan => ({
    ...plan, opposition: largestPartyOutside(seats, plan.parties, arena, shares),
  });
  if (snapshot) {
    // the independent at Justice is a person, not a party in the d'Hondt count
    const entrants = snapshot.parties.filter((p) => p !== 'ind');
    return finish({
      fm: snapshot.fm, dfm: snapshot.dfm, parties: [...snapshot.parties], justice: snapshot.justice,
      allocation: allocateMinistries(seats, entrants, departments, snapshot.justice),
      declined: [...snapshot.declined],
    });
  }
  const heads = designateFirstMinisters(seats, shares);
  if (!heads) return null;
  const justice = pickJusticeParty(seats, day, rng);
  const poolSize = departments.length - (justice && departments.includes('justice') ? 1 : 0);
  const entitled = entitledParties(seats, poolSize);
  const declined: PartyId[] = [];
  if (day >= OPPOSITION_REFORM_DAY) {
    for (const p of entitled) {
      if (p === heads.fm || p === heads.dfm || p === opts.neverDeclines) continue;
      if (rng.chance(DECLINE_CHANCE)) declined.push(p);
    }
  }
  const entrants = entitled.filter((p) => !declined.includes(p));
  const allocation = allocateMinistries(seats, entrants, departments, justice);
  const parties = [...new Set<PartyId>([heads.fm, heads.dfm, ...Object.values(allocation) as PartyId[]])];
  return finish({ ...heads, parties, justice, allocation, declined });
}

/** after an ordinary election the heads are nominated; after an extraordinary one
 *  (fought during a collapse) the stalemate usually goes on */
export const NON_NOMINATION_ORDINARY = 0.08;
export const NON_NOMINATION_EXTRAORDINARY = 0.6;

/** whether the heads are nominated after an election: usually after an ordinary
 *  one, rarely after an extraordinary one fought during a collapse. The player's
 *  own party is never rolled against: its leader decides on the card. */
export function decideFormation(
  state: GameState, rng: Rng, heads: { fm: PartyId; dfm: PartyId },
  opts: { playerLeads?: PartyId } = {}
): { formed: true } | { formed: false; blocker: PartyId } {
  const prior = state.government.executive;
  const stalemate = prior?.status === 'collapsed';
  const p = stalemate ? NON_NOMINATION_EXTRAORDINARY : NON_NOMINATION_ORDINARY;
  const candidates = [heads.fm, heads.dfm].filter((party) => party !== opts.playerLeads);
  if (candidates.length === 0 || !rng.chance(p)) return { formed: true };
  const blocker = stalemate && prior?.blocker && candidates.includes(prior.blocker)
    ? prior.blocker
    : rng.pick(candidates);
  return { formed: false, blocker };
}

/** close the open span of a tenure ledger on `day` */
export function closeOpenTenure(list: { endDay: number | null }[], day: number): void {
  const open = list.find((t) => t.endDay === null);
  if (open) open.endDay = day;
}

// ---------------------------------------------------------------------------
// installing it
// ---------------------------------------------------------------------------

export interface InstallOptions {
  /** does the player sit in the chamber (false in the moment after losing
   *  their seat, before the aftermath has stripped them) */
  playerSeated?: boolean;
  cast?: CastContext;
  /** install the designates without an Executive: nobody nominated after the
   *  election (or at a collapsed start). The ministers of `caretakers` stay in
   *  post until the day given; without it the cabinet is empty. */
  collapsed?: {
    cause: ExecutiveCollapseCause;
    blocker: PartyId;
    collapsedDay: number;
    caretakers?: { until: number; allocation: Partial<Record<DepartmentId, PartyId>>; parties: PartyId[] };
  };
}

/** the leader a party would put forward: the player where they lead it and sit,
 *  else the sitting leader, else a fresh one */
function leaderIdOf(state: GameState, rng: Rng, party: PartyId, seated: boolean, cast: CastContext): string {
  if (seated && state.player.partyId === party && state.player.officeId === 'leader') return 'player';
  const sitting = Object.values(state.characters).find(
    (c) => c.active && c.partyId === party && c.officeId === 'leader'
  );
  if (sitting) return sitting.id;
  const c = generateCharacter(rng, cast.usedNames, {
    partyId: party, officeId: 'leader', minAge: 42, maxAge: 63,
    competenceMean: 58, traitBias: ['ambitious'], region: chamberOf(state.arena).regions[0],
  }, cast.idCounter);
  state.characters[c.id] = c;
  return c.id;
}

function ensurePost(bench: CabinetPost[], officeId: OfficeId): CabinetPost {
  let post = bench.find((p) => p.officeId === officeId);
  if (!post) {
    post = { officeId, characterId: '' };
    bench.push(post);
  }
  return post;
}

/** give a post to somebody of `party`, keeping a sitting holder of that party */
function fillPost(
  state: GameState, rng: Rng, post: CabinetPost, party: PartyId, cast: CastContext, seated: boolean
): void {
  const current = postParty(state, post);
  if (current === party && (post.characterId !== 'player' || seated)) return;
  const old = state.characters[post.characterId];
  if (old && old.officeId === post.officeId) old.officeId = null;
  const c = generateCharacter(rng, cast.usedNames, {
    partyId: party, officeId: post.officeId, competenceMean: 55,
    region: chamberOf(state.arena).regions[0],
  }, cast.idCounter);
  state.characters[c.id] = c;
  post.characterId = c.id;
}

/** nobody is deputy First Minister: clear the post and, for a player holding it,
 *  the overlay flags and the timeline span */
export function clearDeputyFirstMinister(state: GameState): void {
  state.government.deputyPmId = undefined;
  if (state.player.flags._isDeputyPM || state.player.flags._govOverlayOpen) {
    delete state.player.flags._isDeputyPM;
    delete state.player.flags._govOverlayOpen;
    state.history.push({ kind: 'deputyOverlay', date: state.day, action: 'end' });
  }
}

/** the ministers leave office: every post is vacated, and a player minister
 *  goes back to the benches with the reason given */
export function emptyCabinet(state: GameState, reason: string): void {
  for (const post of state.government.cabinet) {
    if (post.characterId === 'player') continue;
    const c = state.characters[post.characterId];
    if (c && c.officeId === post.officeId) c.officeId = null;
  }
  const held = state.player.officeId;
  if (held && state.government.cabinet.some((p) => p.characterId === 'player')) {
    const title = OFFICES[held]?.title ?? 'office';
    state.player.officeId = null;
    state.player.officeSinceDay = null;
    state.history.push({ kind: 'roleChange', arena: state.arena ?? 'uk', date: state.day, officeId: null, how: 'leftOffice' });
    state.history.push({ kind: 'event', date: state.day, headline: `${state.player.name} leaves office as ${title}: ${reason}` });
  }
  state.government.cabinet = [];
}

/** the player takes the deputy First Minister's post: the overlay flags and the
 *  timeline span, once */
export function makePlayerDeputyFirstMinister(state: GameState): void {
  state.government.deputyPmId = 'player';
  state.government.deputyTitle = 'dfm';
  if (state.player.flags._isDeputyPM) return;
  state.player.flags._isDeputyPM = true;
  state.player.flags._everDeputyPM = true;
  state.player.flags._everDeputyArena = state.arena ?? 'uk';
  state.history.push({ kind: 'deputyOverlay', date: state.day, action: 'start', title: 'dfm' });
}

/** Make the shadow bench match the opposition: a full bench of the official
 *  opposition's members, kept where already right; no bench at all when the
 *  largest party outside the Executive is below the bar. */
export function syncOppositionBench(
  state: GameState, rng: Rng, opts: InstallOptions = {}
): void {
  const cast = opts.cast ?? castContext(state);
  const seated = opts.playerSeated ?? state.player.hasSeat;
  const gv = state.government;
  if (!hasOfficialOpposition(state)) {
    for (const post of gv.shadowCabinet) {
      const c = state.characters[post.characterId];
      if (c && c.officeId === post.officeId) c.officeId = null;
    }
    gv.shadowCabinet = [];
    return;
  }
  for (const officeId of cabinetOfficesFor(state.arena)) {
    fillPost(state, rng, ensurePost(gv.shadowCabinet, officeId), gv.oppositionParty, cast, seated);
  }
}

/** Put a planned Executive in office: the heads, their tenures, the deputy
 *  First Minister overlay, the ministers by party (sitting ministers of the
 *  right party stay), and the opposition. The player's own office is left to
 *  the caller, which knows whether to move or strip them. */
export function installExecutive(
  state: GameState, rng: Rng, plan: ExecutivePlan, opts: InstallOptions = {}
): void {
  const arena = state.arena ?? 'uk';
  const cast = opts.cast ?? castContext(state);
  const seated = opts.playerSeated ?? state.player.hasSeat;
  const gv = state.government;

  const wasCollapsed = gv.executive?.status === 'collapsed';
  const collapsed = opts.collapsed;
  gv.governingParty = plan.fm;
  gv.coalitionPartner = plan.dfm;
  delete gv.confidencePartner;
  gv.arrangement = 'executive';
  gv.executive = {
    status: collapsed ? 'collapsed' : 'formed', parties: [...plan.parties],
    ...(plan.justice ? { justiceParty: plan.justice } : {}),
    formedDay: collapsed ? (gv.executive?.formedDay ?? state.day) : state.day,
    ...(collapsed ? {
      // a stalemate that outlasts an election keeps its original date: the cap
      // runs from the day the heads ceased to hold office
      collapsedDay: wasCollapsed ? (gv.executive?.collapsedDay ?? collapsed.collapsedDay) : collapsed.collapsedDay,
      cause: collapsed.cause, blocker: collapsed.blocker,
      deadline: state.day + formationLaw(state.day).afterElection, extensions: 0,
      ...(collapsed.caretakers ? { caretakerUntil: collapsed.caretakers.until } : {}),
    } : {}),
  };
  gv.majority = workingMajorityIn(state.seats, plan.fm, arena);

  // the heads: the designates always; the office, its tenure and the deputy's
  // overlay only when the Executive stands
  const fmId = leaderIdOf(state, rng, plan.fm, seated, cast);
  if (gv.pmId !== fmId || wasCollapsed) {
    gv.pmId = fmId;
    gv.pmSinceDay = state.day;
  }
  const dfmId = leaderIdOf(state, rng, plan.dfm, seated, cast);
  if (collapsed) {
    // a sitting First Minister whose election ended in stalemate ceases to hold office
    closeOpenTenure(state.pmHistory, state.day);
    clearDeputyFirstMinister(state);
    gv.deputyTitle = 'dfm';
  } else {
    recordPmChange(state, fmId);
    if (dfmId === 'player') {
      makePlayerDeputyFirstMinister(state);
    } else {
      gv.deputyPmId = dfmId;
      gv.deputyTitle = 'dfm';
      if (state.player.flags._isDeputyPM) {
        delete state.player.flags._isDeputyPM;
        delete state.player.flags._govOverlayOpen;
        state.history.push({ kind: 'deputyOverlay', date: state.day, action: 'end' });
      }
    }
  }

  // the ministers: each department to its party, the Chief Whip (party
  // machinery, kept on the roster) to the First Minister's party unless an
  // Executive party's member already holds it. With no Executive the cabinet is
  // the caretakers' (the previous allocation) or nobody's.
  const roster = cabinetOfficesFor(arena);
  const allocation = collapsed ? collapsed.caretakers?.allocation : plan.allocation;
  const seatedParties = collapsed ? collapsed.caretakers?.parties : plan.parties;
  if (!allocation || !seatedParties) {
    emptyCabinet(state, 'there is no Executive to hold it');
  } else {
    for (const officeId of roster) {
      const post = ensurePost(gv.cabinet, officeId);
      const dept = OFFICES[officeId]?.department as DepartmentId | undefined;
      if (dept) {
        fillPost(state, rng, post, allocation[dept] ?? plan.fm, cast, seated);
      } else {
        const current = postParty(state, post);
        if (!current || !seatedParties.includes(current)) fillPost(state, rng, post, plan.fm, cast, seated);
      }
    }
    // posts that are not on this chamber's roster do not survive the formation
    gv.cabinet = gv.cabinet.filter((p) => roster.includes(p.officeId));
  }

  // the opposition: the largest party outside the Executive, with a bench only
  // above the bar
  gv.oppositionParty = plan.opposition ?? gv.oppositionParty;
  gv.loId = leaderIdOf(state, rng, gv.oppositionParty, seated, cast);
  recordLoChange(state, gv.loId);
  syncOppositionBench(state, rng, { ...opts, cast });
}

/** Plan and install an Executive for the live chamber. With a snapshot the
 *  Executive is the one the real election produced. Returns the plan, or null
 *  where the chamber has no joint Executive. */
export function formExecutive(
  state: GameState, rng: Rng,
  opts: InstallOptions & { snapshot?: ExecutiveSnapshot; /** roll whether the heads nominate at all */ decideFormation?: boolean } = {}
): ExecutivePlan | null {
  const arena = state.arena ?? 'uk';
  if (!isJointExecutive(arena)) return null;
  const plan = planExecutive(state.seats, state.polling.shares, rng, state.day, arena, opts.snapshot);
  if (!plan) return null;
  let collapsed = opts.collapsed;
  if (!collapsed && opts.decideFormation) {
    const formation = decideFormation(state, rng, plan);
    if (!formation.formed) collapsed = { cause: 'noNomination', blocker: formation.blocker, collapsedDay: state.day };
  }
  installExecutive(state, rng, plan, { ...opts, collapsed });
  const deputyHead = chamberOf(arena).deputyHead;
  if (collapsed) {
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${partyNameIn(collapsed.blocker, arena)} will not nominate; the Assembly sits without an Executive`,
    });
    return plan;
  }
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${characterName(state, state.government.pmId)} and ${characterName(state, state.government.deputyPmId ?? '')} are nominated First Minister and ${deputyHead}; the Executive is formed`,
  });
  if (plan.declined.length > 0) {
    const s = plan.declined.length === 1 ? 's' : '';
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${plan.declined.map((p) => partyNameIn(p, arena)).join(' and ')} decline${s} a place in the Executive and take${s} the opposition benches`,
    });
  }
  return plan;
}

// ---------------------------------------------------------------------------
// the ladder
// ---------------------------------------------------------------------------

/** a post the player's party actually holds, or a spokesperson brief it does
 *  not run itself: the single-tier ladder's offers must fit the share-out.
 *  Null when nothing fits, and the offer is skipped this cycle. */
export function constrainToPartyPosts(
  state: GameState, rng: Rng, target: OfficeId | null
): OfficeId | null {
  if (!target || !state.government.executive || !isDevolved(state.arena)) return target;
  const office = OFFICES[target];
  if (!office || !office.department) return target;
  const arena = state.arena;
  const party = state.player.partyId;
  const held = partyDepartments(state, party);
  const current = state.player.officeId ? OFFICES[state.player.officeId]?.department : undefined;
  const dept = office.department as DepartmentId;
  if (office.tier >= 4) {
    if (held.includes(dept)) return target;
    const others = held.filter((d) => d !== current);
    return others.length > 0 ? cabsecOfficeId(arena, rng.pick(others)) : null;
  }
  if (isSpokespersonOffice(target)) {
    // the heads' parties have a junior rung of their own in the Executive Office
    const teo = teoJuniorFor(state, party);
    if (teo && state.player.officeId !== teo && rng.chance(TEO_OFFER_CHANCE)) return teo;
    if (held.includes(dept)) {
      const free = executiveDepartments(arena).filter((d) => !held.includes(d) && d !== current);
      return free.length > 0 ? spokespersonOfficeId(arena, rng.pick(free)) : null;
    }
  }
  return target;
}

/** a Westminster-shaped office id fitted to the live chamber: translated onto
 *  its ladder, and in a chamber whose ministries are shared out by party,
 *  constrained to a post the player's party holds. Null when nothing fits. */
export function offerableOffice(state: GameState, rng: Rng, officeId: OfficeId | null): OfficeId | null {
  const translated = translateOffice(officeId, state.arena ?? 'uk', (xs) => rng.pick(xs));
  return constrainToPartyPosts(state, rng, translated);
}
