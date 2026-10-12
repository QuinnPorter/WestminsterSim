import {
  ArenaId, CabinetPost, DepartmentId, Designation, GameState, OfficeId, PartyId,
} from '../types/game';
import type { ExecutiveSnapshot } from '../data/niAssembly';
import { PARTIES, outsidePartyPolitics, partyNameIn } from '../data/parties';
import { chamberOf, isDevolved } from '../data/chambers';
import { OFFICES, cabinetOfficesFor, cabsecOfficeId, executiveDepartments } from '../data/offices';
import { dHondt } from './listSeats';
import { workingMajorityIn } from './seats';
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
 * run here. The Executive is carried on the existing fields so that every
 * reader of `governingParty` (the First Minister's party) and `coalitionPartner`
 * (the deputy First Minister's) keeps working, with `government.executive`
 * naming the whole membership. Which chamber does this is
 * `ChamberProfile.jointExecutive`, never an arena literal.
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

/** the order a party reaches for the briefs: the money, then the big spenders */
const DEPARTMENT_PREFERENCE: DepartmentId[] = [
  'finance', 'economy', 'health', 'education', 'infrastructure', 'communities', 'agriculture', 'justice',
];

export function isJointExecutive(arena: ArenaId | undefined): boolean {
  return chamberOf(arena).jointExecutive;
}

/** the parties in government: the Executive's membership where there is one,
 *  otherwise the governing party and any coalition partner */
export function executiveParties(state: GameState): PartyId[] {
  const gv = state.government;
  if (gv.executive) return gv.executive.parties;
  return gv.coalitionPartner ? [gv.governingParty, gv.coalitionPartner] : [gv.governingParty];
}

export function inExecutive(state: GameState, party: PartyId): boolean {
  return executiveParties(state).includes(party);
}

/** false only while a collapsed Executive leaves the chamber without ministers */
export function executiveInBeing(state: GameState): boolean {
  return !state.government.executive || state.government.executive.status === 'formed';
}

export function oppositionMinSeats(house: number): number {
  return Math.ceil(house * OPPOSITION_SHARE);
}

function houseSize(seats: Partial<Record<PartyId, number>>): number {
  return Object.values(seats).reduce((a, b) => a + (b ?? 0), 0);
}

/** does the chamber have an official opposition with a bench? Always at
 *  Westminster, Holyrood and the Senedd; at Stormont only when the largest party
 *  outside the Executive clears the bar */
export function hasOfficialOpposition(state: GameState): boolean {
  if (!state.government.executive) return true;
  const opp = state.government.oppositionParty;
  if (!opp || inExecutive(state, opp)) return false;
  return (state.seats[opp] ?? 0) >= oppositionMinSeats(houseSize(state.seats));
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
  seats: Partial<Record<PartyId, number>>, day: number, rng?: Rng
): PartyId | undefined {
  const alliance = (seats.alliance ?? 0) > 0;
  const independent = (seats.ind ?? 0) > 0;
  if (day < OPPOSITION_REFORM_DAY || !rng) return alliance ? 'alliance' : undefined;
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
}

/** Decide an Executive from a result: who leads it, who joins it, who gets what.
 *  With a real snapshot the answer is the one history gave; otherwise the rules
 *  run, and after the 2016 reforms the smaller entitled parties may decline. */
export function planExecutive(
  seats: Partial<Record<PartyId, number>>, shares: Partial<Record<PartyId, number>>,
  rng: Rng, day: number, arena: ArenaId, snapshot?: ExecutiveSnapshot
): ExecutivePlan | null {
  if (!isDevolved(arena)) return null;
  const departments = executiveDepartments(arena);
  if (snapshot) {
    const justice = snapshot.justice;
    const entrants = snapshot.parties.filter((p) => p !== justice || designationOf(p) !== undefined);
    const allocation = allocateMinistries(seats, entrants.filter((p) => p !== 'ind'), departments, justice);
    return {
      fm: snapshot.fm, dfm: snapshot.dfm, parties: [...snapshot.parties], justice,
      allocation, declined: [...snapshot.declined],
    };
  }
  const heads = designateFirstMinisters(seats, shares);
  if (!heads) return null;
  const justice = pickJusticeParty(seats, day, rng);
  const poolSize = departments.length - (justice && departments.includes('justice') ? 1 : 0);
  const entitled = entitledParties(seats, poolSize);
  const declined: PartyId[] = [];
  if (day >= OPPOSITION_REFORM_DAY) {
    for (const p of entitled) {
      if (p === heads.fm || p === heads.dfm) continue;
      if (rng.chance(DECLINE_CHANCE)) declined.push(p);
    }
  }
  const entrants = entitled.filter((p) => !declined.includes(p));
  const allocation = allocateMinistries(seats, entrants, departments, justice);
  const parties = [...new Set<PartyId>([heads.fm, heads.dfm, ...Object.values(allocation) as PartyId[]])];
  return { ...heads, parties, justice, allocation, declined };
}

// ---------------------------------------------------------------------------
// installing it
// ---------------------------------------------------------------------------

export interface CastContext {
  usedNames: Set<string>;
  idCounter: { value: number };
}

function castContext(state: GameState): CastContext {
  const usedNames = new Set<string>([state.player.name]);
  let max = 0;
  for (const c of Object.values(state.characters)) {
    usedNames.add(c.name);
    const n = Number(c.id.replace('npc_', ''));
    if (!Number.isNaN(n) && n >= max) max = n + 1;
  }
  return { usedNames, idCounter: { value: max } };
}

function holderParty(state: GameState, characterId: string): PartyId | undefined {
  if (characterId === 'player') return state.player.partyId;
  const c = state.characters[characterId];
  return c && c.active ? c.partyId : undefined;
}

/** the party holding each Executive department, read off the cabinet */
export function executiveAllocation(state: GameState): Partial<Record<DepartmentId, PartyId>> {
  const out: Partial<Record<DepartmentId, PartyId>> = {};
  for (const post of state.government.cabinet) {
    const dept = OFFICES[post.officeId]?.department;
    const party = holderParty(state, post.characterId);
    if (dept && party) out[dept as DepartmentId] = party;
  }
  return out;
}

/** the departments the player's party runs, read off the cabinet */
export function partyDepartments(state: GameState, party: PartyId): DepartmentId[] {
  return (Object.entries(executiveAllocation(state)) as [DepartmentId, PartyId][])
    .filter(([, p]) => p === party)
    .map(([d]) => d);
}

export interface InstallOptions {
  /** does the player sit in the chamber (false in the moment after losing
   *  their seat, before the aftermath has stripped them) */
  playerSeated?: boolean;
  cast?: CastContext;
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

function nameOf(state: GameState, id: string, fallback: string): string {
  return id === 'player' ? state.player.name : (state.characters[id]?.name ?? fallback);
}

function openTenure(
  list: { characterId: string; name: string; partyId: PartyId; startDay: number; endDay: number | null }[],
  id: string, name: string, party: PartyId, day: number
): void {
  const open = list.find((t) => t.endDay === null);
  if (open && open.characterId === id) return;
  if (open) open.endDay = day;
  list.push({ characterId: id, name, partyId: party, startDay: day, endDay: null });
}

/** give a post to somebody of `party`, keeping a sitting holder of that party */
function fillPost(
  state: GameState, rng: Rng, post: CabinetPost, party: PartyId, cast: CastContext, seated: boolean
): void {
  const current = holderParty(state, post.characterId);
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

/** the largest party outside the Executive, whatever its size */
function largestOutside(state: GameState, parties: PartyId[]): PartyId | undefined {
  return (Object.entries(state.seats) as [PartyId, number][])
    .filter(([p, n]) => !parties.includes(p) && !outsidePartyPolitics(p, state.arena) && (n ?? 0) > 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
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
  const opp = gv.oppositionParty;
  for (const officeId of cabinetOfficesFor(state.arena)) {
    let post = gv.shadowCabinet.find((p) => p.officeId === officeId);
    if (!post) {
      post = { officeId, characterId: '' };
      gv.shadowCabinet.push(post);
    }
    fillPost(state, rng, post, opp, cast, seated);
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

  gv.governingParty = plan.fm;
  gv.coalitionPartner = plan.dfm;
  delete gv.confidencePartner;
  gv.arrangement = 'coalition';
  gv.executive = {
    status: 'formed', parties: [...plan.parties],
    ...(plan.justice ? { justiceParty: plan.justice } : {}),
    formedDay: state.day,
  };
  gv.majority = workingMajorityIn(state.seats, plan.fm, arena);

  // the heads
  const fmId = leaderIdOf(state, rng, plan.fm, seated, cast);
  if (gv.pmId !== fmId) {
    gv.pmId = fmId;
    gv.pmSinceDay = state.day;
  }
  openTenure(state.pmHistory, fmId, nameOf(state, fmId, chamberOf(arena).head), plan.fm, state.day);

  const dfmId = leaderIdOf(state, rng, plan.dfm, seated, cast);
  gv.deputyPmId = dfmId;
  gv.deputyTitle = 'dfm';
  if (dfmId === 'player') {
    if (!state.player.flags._isDeputyPM) {
      state.player.flags._isDeputyPM = true;
      state.player.flags._everDeputyPM = true;
      state.player.flags._everDeputyArena = arena;
      state.history.push({ kind: 'deputyOverlay', date: state.day, action: 'start', title: 'dfm' });
    }
  } else if (state.player.flags._isDeputyPM) {
    delete state.player.flags._isDeputyPM;
    delete state.player.flags._govOverlayOpen;
    state.history.push({ kind: 'deputyOverlay', date: state.day, action: 'end' });
  }

  // the ministers: each department to its party, the Chief Whip (party
  // machinery, kept on the roster) to the First Minister's party unless an
  // Executive party's member already holds it
  const roster = cabinetOfficesFor(arena);
  for (const officeId of roster) {
    let post = gv.cabinet.find((p) => p.officeId === officeId);
    if (!post) {
      post = { officeId, characterId: '' };
      gv.cabinet.push(post);
    }
    const dept = OFFICES[officeId]?.department as DepartmentId | undefined;
    if (dept) {
      fillPost(state, rng, post, plan.allocation[dept] ?? plan.fm, cast, seated);
    } else {
      const current = holderParty(state, post.characterId);
      if (!current || !plan.parties.includes(current)) fillPost(state, rng, post, plan.fm, cast, seated);
    }
  }
  // posts that are not on this chamber's roster do not survive the formation
  gv.cabinet = gv.cabinet.filter((p) => roster.includes(p.officeId));

  // the opposition: the largest party outside the Executive, with a bench only
  // above the bar
  const opp = largestOutside(state, plan.parties) ?? gv.oppositionParty;
  gv.oppositionParty = opp;
  const loId = leaderIdOf(state, rng, opp, seated, cast);
  gv.loId = loId;
  state.loHistory = state.loHistory ?? [];
  openTenure(state.loHistory, loId, nameOf(state, loId, 'the Leader of the Opposition'), opp, state.day);
  syncOppositionBench(state, rng, { ...opts, cast });
}

/** Plan and install an Executive for the live chamber. With a snapshot the
 *  Executive is the one the real election produced. Returns the plan, or null
 *  where the chamber has no joint Executive. */
export function formExecutive(
  state: GameState, rng: Rng,
  opts: InstallOptions & { snapshot?: ExecutiveSnapshot; shares?: Partial<Record<PartyId, number>>; headline?: boolean } = {}
): ExecutivePlan | null {
  const arena = state.arena ?? 'uk';
  if (!isJointExecutive(arena)) return null;
  const plan = planExecutive(
    state.seats, opts.shares ?? state.polling.shares, rng, state.day, arena, opts.snapshot
  );
  if (!plan) return null;
  installExecutive(state, rng, plan, opts);
  if (opts.headline !== false) {
    const fm = nameOf(state, state.government.pmId, chamberOf(arena).head);
    const dfm = nameOf(state, state.government.deputyPmId ?? '', chamberOf(arena).deputyHead);
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${fm} and ${dfm} are nominated First Minister and ${chamberOf(arena).deputyHead}; the Executive is formed`,
    });
    if (plan.declined.length > 0) {
      state.history.push({
        kind: 'event', date: state.day,
        headline: `${plan.declined.map((p) => partyNameIn(p, arena)).join(' and ')} decline${plan.declined.length === 1 ? 's' : ''} a place in the Executive and take${plan.declined.length === 1 ? 's' : ''} the opposition benches`,
      });
    }
  }
  return plan;
}

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
  if (target.startsWith(`${arena}_spokes_`) && held.includes(dept)) {
    const free = executiveDepartments(arena).filter((d) => !held.includes(d) && d !== current);
    return free.length > 0 ? `${arena}_spokes_${rng.pick(free)}` : null;
  }
  return target;
}
