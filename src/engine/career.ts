import {
  CabinetPost, Character, DepartmentId, DrawnCard, ElectionResult, ForcedEvent, GameState, HistoryEntry,
  LegacySummary, Mentor, OfficeId, PartyId, Player, PlayerStats, PmTenure, RegionId, Relationship,
  RelationshipKind, StatDelta,
} from '../types/game';
import type { CreationInput } from './newGame';
import { COMMITTEE_NAMES, committeeChairTitle } from '../data/committees';
import { CABINET_OFFICES, DEPARTMENTS, GREAT_OFFICES, OFFICES, officeTitle, officeTitleFor } from '../data/offices';
import { BACKGROUNDS } from '../data/backgrounds';
import { causeDepartments } from '../data/causes';
import { PARTIES } from '../data/parties';
import { PARLIAMENTS } from '../data/parliaments';
import { generateCharacter } from '../generation/characters';
import {
  adjustRelationship, averageColleagueWarmth, characterName, getRelationship,
  relationshipValue, replaceLeader,
} from './relationships';
import { applyPollingShock, gainStat } from './effects';
import { titleCase } from './strings';
import { Rng, clamp } from './rng';

// ---------- basic queries ----------

export function playerTier(state: GameState): number {
  return state.player.officeId ? OFFICES[state.player.officeId].tier : 0;
}

export function playerInGovernment(state: GameState): boolean {
  return state.player.partyId === state.government.governingParty;
}

/** is the player's party one of the two frontbench parties */
export function onFrontbenchTrack(state: GameState): boolean {
  return (
    state.player.partyId === state.government.governingParty ||
    state.player.partyId === state.government.oppositionParty
  );
}

export function playerIsLeader(state: GameState): boolean {
  return state.player.officeId === 'leader';
}

export function playerIsPM(state: GameState): boolean {
  return playerIsLeader(state) && playerInGovernment(state);
}

/** the player sits with a minor party — neither government nor official
 *  opposition — so they follow the lightweight spokesperson/critic track */
export function onMinorPartyTrack(state: GameState): boolean {
  return state.player.hasSeat && !onFrontbenchTrack(state);
}

/** an Independent sits outside every party, and the Speaker is non-partisan —
 *  neither can be offered ministerial/shadow office or contest a leadership */
export function canHoldOffice(state: GameState): boolean {
  return state.player.partyId !== 'ind' && !state.player.flags._isSpeaker;
}

/** the deputy-PM title prefix for a given variant ('dpm' | 'firstSec') */
function deputyPrefix(variant?: string): string {
  return variant === 'firstSec' ? 'First Secretary of State' : 'Deputy Prime Minister';
}

/** combined title for a cabinet office, applying the Deputy-PM overlay when the
 *  holder doubles as Deputy PM / First Secretary. Used for both player and NPCs. */
export function cabinetTitleFor(officeId: OfficeId, inGovernment: boolean, isDeputy: boolean, variant?: string): string {
  const base = officeTitle(officeId, inGovernment);
  if (isDeputy && OFFICES[officeId]?.tier === 4) {
    return `${deputyPrefix(variant)} and ${base}`;
  }
  return base;
}

/** in government either as the governing party OR as a formal coalition junior
 *  partner — both hold real government office and govern */
export function playerInGovernmentBloc(state: GameState): boolean {
  return playerInGovernment(state) || state.player.partyId === state.government.coalitionPartner;
}

export type LeaderRole = 'pm' | 'lo' | 'minorLeader' | null;
/** which apex role the player-leader occupies (null when not a leader). A
 *  minor-party leader is distinct from the official Leader of the Opposition. */
export function playerLeaderRole(state: GameState): LeaderRole {
  if (!playerIsLeader(state)) return null;
  if (playerInGovernment(state)) return 'pm';
  if (state.player.partyId === state.government.oppositionParty) return 'lo';
  return 'minorLeader';
}

/** years the player has held their current office (0 while a backbencher) */
export function timeInPostYears(state: GameState): number {
  return state.player.officeSinceDay == null ? 0 : (state.day - state.player.officeSinceDay) / 365;
}

/** the full party name, when the player is on the minor-party track — but NOT
 *  when their minor party has joined a coalition, where they hold genuine
 *  government office and take the real ministerial titles */
function minorPartyNameOf(state: GameState): string | undefined {
  if (playerInGovernmentBloc(state)) return undefined;
  return onMinorPartyTrack(state) ? PARTIES[state.player.partyId].name : undefined;
}

export function playerOfficeTitle(state: GameState): string {
  // the Speaker is non-partisan — neither government nor opposition framing
  if (state.player.officeId === 'speaker') return 'Speaker of the House of Commons';

  // a select-committee chairmanship is a prestige backbench role (held with no
  // frontbench office) — it takes over the title pill from "Backbench MP"
  if (state.player.officeId === null && state.player.committeeChair) {
    return committeeChairTitle(state.player.committeeChair);
  }

  // the leader of a JUNIOR coalition partner keeps leading their party while
  // holding a government overlay — they are never "Prime Minister"
  if (state.player.officeId === 'leader'
    && state.government.coalitionPartner === state.player.partyId
    && state.player.partyId !== state.government.governingParty) {
    const leaderTitle = `Leader of the ${PARTIES[state.player.partyId].name}`;
    // the brief (if any) the player holds in the government cabinet
    const briefPost = state.government.cabinet.find((p) => p.characterId === 'player');
    const briefTitle = briefPost && OFFICES[briefPost.officeId] ? OFFICES[briefPost.officeId].title : null;
    if (state.player.flags._isDeputyPM) {
      // Deputy PM (+ optional department brief), Raab/Clegg-style
      return briefTitle
        ? `${deputyPrefix(state.government.deputyTitle)} and ${briefTitle}`
        : deputyPrefix(state.government.deputyTitle);
    }
    if (briefTitle) return `${briefTitle} and ${leaderTitle}`;
    return leaderTitle;
  }

  const base = officeTitleFor(state.player.officeId, {
    inGovernment: playerInGovernmentBloc(state),
    minorPartyName: minorPartyNameOf(state),
  });
  // Deputy-PM / First-Secretary overlay on a sitting Secretary of State — only ever in
  // government (never a "shadow Deputy PM")
  if (
    state.player.flags._isDeputyPM && playerInGovernmentBloc(state) &&
    state.player.officeId && OFFICES[state.player.officeId]?.tier === 4
  ) {
    return `${deputyPrefix(state.government.deputyTitle)} and ${base}`;
  }
  return base;
}

// ---------- select committees ----------

/** the player can win a committee chair only as a pure backbencher with a seat
 *  (no frontbench office, not the Speaker) — matching the real convention */
export function canChairCommittee(state: GameState): boolean {
  return state.player.hasSeat && state.player.officeId === null && !state.player.flags._isSpeaker;
}

/** pick a committee for a contest, biased toward the player's causes/background
 *  (their expertise), else any department */
export function pickCommittee(state: GameState, rng: Rng): DepartmentId {
  const depts = Object.keys(COMMITTEE_NAMES) as DepartmentId[];
  const affinity = new Set<DepartmentId>([
    ...causeDepartments(state.player.causes ?? []),
    ...(BACKGROUNDS[state.player.background]?.deptAffinity ?? []),
  ]);
  const preferred = depts.filter((d) => affinity.has(d));
  return preferred.length > 0 && rng.chance(0.7) ? rng.pick(preferred) : rng.pick(depts);
}

/** take a committee chair (a backbench overlay — officeId stays null) */
function setCommitteeChair(state: GameState, dept: DepartmentId): void {
  state.player.committeeChair = dept;
  state.player.flags._committeeChair = true;
  state.player.flags._wasCommitteeChair = true;
}

/** relinquish the chair (on taking office, losing the seat, or being voted out) */
function clearCommitteeChair(state: GameState, reason: 'tookOffice' | 'lostSeat' | 'votedOut'): void {
  const dept = state.player.committeeChair;
  if (!dept) return;
  state.player.committeeChair = null;
  delete state.player.flags._committeeChair;
  if (reason === 'tookOffice') {
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${state.player.name} stands down as Chair of the ${COMMITTEE_NAMES[dept]} Select Committee to take office`,
    });
  }
}

export type RoleSide = 'gov' | 'opp' | 'minor';

/** the gov / official-opposition / minor-party framing for the player's CURRENT
 *  role. Captured when a role change is recorded so the career timeline keeps the
 *  right framing even after the player later crosses the floor. */
export function currentRoleSide(state: GameState): RoleSide {
  if (playerInGovernmentBloc(state)) return 'gov';
  if (state.player.partyId === state.government.oppositionParty) return 'opp';
  return 'minor';
}

/** the framing of the player's most recently RECORDED leader span (gov / opp /
 *  minor), from the timeline — used to decide whether a leader-role transition
 *  needs a fresh roleChange. Independent of the live government pointers. */
function lastPlayerLeaderRoleSide(state: GameState): RoleSide | null {
  for (let i = state.history.length - 1; i >= 0; i--) {
    const h = state.history[i];
    if (h.kind === 'roleChange' && h.officeId === 'leader') return h.roleSide ?? null;
  }
  return null;
}

/** label an office the player held, for the history/career timeline. Prefer the
 *  framing recorded on the history entry (`ctx`); fall back to recomputing from
 *  the current state for pre-v5 saves that lack it. */
export function playerOfficeLabel(
  state: GameState,
  officeId: OfficeId | null,
  date: number,
  ctx?: { roleSide?: RoleSide; partyId?: PartyId }
): string {
  if (ctx?.roleSide) {
    return officeTitleFor(officeId, {
      inGovernment: ctx.roleSide === 'gov',
      minorPartyName: ctx.roleSide === 'minor'
        ? PARTIES[ctx.partyId ?? state.player.partyId].name
        : undefined,
    });
  }
  if (onMinorPartyTrack(state)) {
    return officeTitleFor(officeId, {
      inGovernment: false,
      minorPartyName: PARTIES[state.player.partyId].name,
    });
  }
  return officeTitle(officeId, governingPartyAt(state, date) === state.player.partyId);
}

function usedNamesOf(state: GameState): Set<string> {
  const used = new Set<string>([state.player.name]);
  for (const c of Object.values(state.characters)) used.add(c.name);
  return used;
}

function npcIdCounter(state: GameState): { value: number } {
  let max = 0;
  for (const id of Object.keys(state.characters)) {
    const n = Number(id.replace('npc_', ''));
    if (!Number.isNaN(n) && n >= max) max = n + 1;
  }
  return { value: max };
}

function frontbenchSide(state: GameState): 'cabinet' | 'shadowCabinet' {
  // a junior coalition partner sits in the GOVERNMENT cabinet, not the shadow bench
  return playerInGovernmentBloc(state) ? 'cabinet' : 'shadowCabinet';
}

function setFrontbenchPost(
  state: GameState,
  side: 'cabinet' | 'shadowCabinet',
  officeId: OfficeId,
  characterId: string
): void {
  const list = state.government[side];
  const post = list.find((p) => p.officeId === officeId);
  if (post) post.characterId = characterId;
  else list.push({ officeId, characterId });
}

function newFrontbencher(state: GameState, rng: Rng, party: PartyId, officeId: OfficeId): Character {
  const c = generateCharacter(rng, usedNamesOf(state), {
    partyId: party, officeId, competenceMean: 55,
  }, npcIdCounter(state));
  state.characters[c.id] = c;
  return c;
}

/** Fill any CABINET_OFFICES post missing from the stored benches with a fresh NPC.
 *  Used by the save migration when new cabinet offices are introduced (newGame
 *  builds the full roster, but older saves and post-election reconcile iterate the
 *  stored arrays). Idempotent. */
export function backfillCabinetOffices(state: GameState, rng: Rng): void {
  const fill = (side: 'cabinet' | 'shadowCabinet', party: PartyId) => {
    for (const officeId of CABINET_OFFICES) {
      if (!state.government[side].some((p) => p.officeId === officeId)) {
        state.government[side].push({ officeId, characterId: newFrontbencher(state, rng, party, officeId).id });
      }
    }
  };
  fill('cabinet', state.government.governingParty);
  fill('shadowCabinet', state.government.oppositionParty);
}

/** Repair any character carrying a stale CABINET-rank office they no longer hold —
 *  e.g. a minister the player displaced who kept their old title ("ghost minister").
 *  Idempotent. Leaves 'leader', minor-party spokesperson (min_*) and other non-bench
 *  offices untouched (those are intentionally not on a tracked bench). */
export function reconcileCharacterOffices(state: GameState): void {
  const seated = new Set<string>();
  for (const side of ['cabinet', 'shadowCabinet'] as const) {
    for (const post of state.government[side]) seated.add(`${post.characterId}:${post.officeId}`);
  }
  for (const c of Object.values(state.characters)) {
    if (!c.officeId || !CABINET_OFFICES.includes(c.officeId)) continue;
    if (!seated.has(`${c.id}:${c.officeId}`)) c.officeId = null;
  }
}

/** After an election, make the cabinet / shadow-cabinet rosters match the parties
 *  that actually won government and official-opposition status — so whether a
 *  party (and the player within it) is the official opposition or a third party
 *  is driven by results, not baked in. NPC posts held by the wrong party are
 *  regenerated; correctly-partied NPCs (and the player, while still on that side)
 *  stay put, so the common two-party swap keeps its continuity. The player is then
 *  (re)seated on their bench if they hold a cabinet-rank office for that party. */
function reconcileFrontbenches(state: GameState, rng: Rng, playerWonSeat: boolean): void {
  const sides: { side: 'cabinet' | 'shadowCabinet'; party: PartyId }[] = [
    { side: 'cabinet', party: state.government.governingParty },
    { side: 'shadowCabinet', party: state.government.oppositionParty },
  ];
  for (const { side, party } of sides) {
    for (const post of state.government[side]) {
      if (post.characterId === 'player') {
        // keep the player only if they still sit on this side with their seat
        if (playerWonSeat && state.player.partyId === party) continue;
        post.characterId = newFrontbencher(state, rng, party, post.officeId).id;
        continue;
      }
      const holder = state.characters[post.characterId];
      if (!holder || !holder.active || holder.partyId !== party) {
        if (holder) { holder.officeId = null; holder.active = false; }
        post.characterId = newFrontbencher(state, rng, party, post.officeId).id;
      }
    }
  }
  // (re)seat the player on their own bench if they hold a cabinet-rank office —
  // e.g. a third-party spokesperson whose party has just become the opposition
  if (
    playerWonSeat && !playerIsLeader(state) && onFrontbenchTrack(state) &&
    state.player.officeId && CABINET_OFFICES.includes(state.player.officeId)
  ) {
    const side = frontbenchSide(state);
    const post = state.government[side].find((p) => p.officeId === state.player.officeId);
    if (post && post.characterId !== 'player') {
      const displaced = state.characters[post.characterId];
      if (displaced) { displaced.officeId = null; displaced.active = false; }
    }
    setFrontbenchPost(state, side, state.player.officeId, 'player');
  }

  // the Leader of the Opposition must belong to the (new) opposition party
  const oppParty = state.government.oppositionParty;
  const playerLeadsOpp = playerWonSeat && state.player.partyId === oppParty && playerIsLeader(state);
  if (playerLeadsOpp) {
    state.government.loId = 'player';
    // open a fresh "Leader of the Opposition" career span whenever the player's
    // previous leader framing wasn't already opposition — covers a PM who just lost
    // government (last framing 'gov') and a minor leader who has just risen (was
    // 'minor'). Based on the recorded timeline, not the live loId (which aftermath
    // pre-sets to the outgoing PM), so the PM→LOO transition is captured.
    if (lastPlayerLeaderRoleSide(state) !== 'opp') {
      state.history.push({
        kind: 'roleChange', date: state.day, officeId: 'leader', how: 'continued',
        roleSide: 'opp', partyId: state.player.partyId,
      });
    }
    recordLoChange(state, 'player');
  } else {
    const lo = state.characters[state.government.loId];
    if (state.government.loId === 'player' || !lo || !lo.active || lo.partyId !== oppParty) {
      state.government.loId = newFrontbencher(state, rng, oppParty, 'leader').id;
    }
    recordLoChange(state, state.government.loId);
    // the player may have stayed a party leader while their party slipped OUT of the
    // top two (Leader of the Opposition / PM → minor-party leader). Record that
    // demotion so the Profile career timeline stops showing the stale opposition /
    // PM framing — the mirror of the minor→opposition and PM→LOO transitions above.
    if (
      playerWonSeat && playerIsLeader(state) &&
      currentRoleSide(state) === 'minor' && lastPlayerLeaderRoleSide(state) !== 'minor'
    ) {
      state.history.push({
        kind: 'roleChange', date: state.day, officeId: 'leader', how: 'continued',
        roleSide: 'minor', partyId: state.player.partyId,
      });
    }
  }
}

// ---------- eligibility ----------

export function eligibilityScore(state: GameState, targetOffice: OfficeId): number {
  const s = state.player.stats;
  const office = OFFICES[targetOffice];
  const bg = BACKGROUNDS[state.player.background];
  const deptBonus =
    office.department && bg.deptAffinity.includes(office.department) ? bg.deptBonus : 0;
  // a small nudge toward the departments aligned with the player's chosen causes
  const causeBonus =
    office.department && causeDepartments(state.player.causes ?? []).has(office.department) ? 4 : 0;
  const scandalPenalty = state.player.flags.scandal ? 18 : 0;
  return (
    0.3 * s.competence +
    0.25 * (50 + relationshipValue(state, 'leader') / 2) +
    0.2 * s.partyStanding +
    0.15 * s.profile +
    0.1 * (50 + relationshipValue(state, 'chiefWhip') / 2) -
    4 * state.player.rebellionCount -
    scandalPenalty +
    deptBonus +
    causeBonus
  );
}

export const OFFER_THRESHOLDS: Record<number, number> = { 1: 41, 2: 47, 3: 52, 4: 59 };

/** the Treasury seniority sub-ladder (all tier 3 except the last two, tier 4) */
const TREASURY_LADDER: OfficeId[] = [
  'exchequer_sec', 'financial_sec', 'min_treasury', 'chief_sec', 'sos_treasury',
];
/** a player's home nation maps to its territorial Secretary of State */
const REGION_OFFICE: Partial<Record<RegionId, OfficeId>> = {
  scotland: 'sos_scotland', wales: 'sos_wales', ni: 'sos_ni',
};

/** entry to a tier-3 Treasury job starts low on the ladder, not at Minister of State */
function treasuryEntry(rng: Rng): OfficeId {
  return rng.chance(0.6) ? 'exchequer_sec' : 'financial_sec';
}

function deptOfficeId(
  rng: Rng, bg: typeof BACKGROUNDS[keyof typeof BACKGROUNDS], tier: 3 | 4,
  treasuryLadder = false
): OfficeId {
  const prefix = tier === 4 ? 'sos' : 'min';
  const dept = bg.deptAffinity.length > 0 && rng.chance(0.5)
    ? rng.pick(bg.deptAffinity)
    : rng.pick(Object.keys(DEPARTMENTS)) as keyof typeof DEPARTMENTS;
  // frontbench (major-party) entrants to the Treasury start low on the ladder;
  // minor-party spokespeople keep the single min_* rung
  if (tier === 3 && dept === 'treasury' && treasuryLadder) return treasuryEntry(rng);
  return `${prefix}_${dept}`;
}

/** the next rung the player would plausibly be offered */
export function nextOfficeFor(state: GameState, rng: Rng): OfficeId | null {
  const target = computeNextOffice(state, rng);
  // never offer the player a post they already hold — that reads as a no-op
  // "reshuffle" offering you your own job. Skip this cycle instead.
  return target === state.player.officeId ? null : target;
}

function computeNextOffice(state: GameState, rng: Rng): OfficeId | null {
  const tier = playerTier(state);
  const bg = BACKGROUNDS[state.player.background];

  // climbing the Treasury ladder: a sitting Treasury minister may be moved one
  // rung up (Exchequer → Financial → Minister of State → Chief Secretary →
  // Chancellor). The Chief Secretary and Chancellor jumps are deliberately rare.
  // If they don't climb, the normal tier logic below can still move them out of
  // the Treasury (a lateral to another department) or dismiss them.
  const cur = state.player.officeId;
  if (!onMinorPartyTrack(state) && cur && TREASURY_LADDER.includes(cur)) {
    const next = TREASURY_LADDER[TREASURY_LADDER.indexOf(cur) + 1];
    if (next) {
      const climbChance =
        next === 'chief_sec' ? 0.18 : next === 'sos_treasury' ? 0.3 : 0.5;
      if (rng.chance(climbChance)) return next;
    }
  }

  // minor parties have a single spokesperson rung (min_*). A backbencher is made
  // a spokesperson; an existing spokesperson is only ever offered a DIFFERENT
  // brief (never the one they already hold), and only occasionally — the next
  // step up from there is the leadership, via a contest.
  if (onMinorPartyTrack(state)) {
    if (tier >= 3) {
      if (!rng.chance(0.5)) return null; // keep brief-switches occasional
      const current = state.player.officeId ? OFFICES[state.player.officeId].department : undefined;
      const affinity = bg.deptAffinity.filter((d) => d !== current);
      const others = (Object.keys(DEPARTMENTS) as (keyof typeof DEPARTMENTS)[])
        .filter((d) => d !== current);
      const dept = affinity.length > 0 && rng.chance(0.5) ? rng.pick(affinity) : rng.pick(others);
      return `min_${dept}`;
    }
    return deptOfficeId(rng, bg, 3); // tier 0/1/2 → a first spokesperson brief
  }

  // career memory: a returning ex-minister on the backbenches isn't sent back
  // to PPS — bring them in near their peak (peak tier, or one below).
  const peak = (state.player.flags._peakTier as number) ?? 0;
  if (tier === 0 && peak >= 3) {
    const comebackTier = rng.chance(0.6) ? peak : peak - 1;
    if (comebackTier >= 4) return deptOfficeId(rng, bg, 4);
    if (comebackTier === 3) return deptOfficeId(rng, bg, 3, true);
    // peak was a whip/PPS — fall through to the normal ladder
  }

  if (tier === 0) {
    // a rare meteoric rise: an exceptional newcomer is handed a ministry without
    // the usual PPS/whip apprenticeship
    const s = state.player.stats;
    if (s.competence > 65 && s.profile > 55 && s.partyStanding > 60 && rng.chance(0.15)) {
      return deptOfficeId(rng, bg, 3, true);
    }
    return rng.chance(0.55) ? 'pps' : 'whip';
  }
  if (tier === 1 || tier === 2) {
    // a sitting Whip is the natural pick for promotion into the whips' office
    if (state.player.officeId === 'whip' && rng.chance(0.2)) return 'chiefWhip';
    const dept = bg.deptAffinity.length > 0 && rng.chance(0.5)
      ? rng.pick(bg.deptAffinity)
      : rng.pick(Object.keys(DEPARTMENTS)) as keyof typeof DEPARTMENTS;
    return dept === 'treasury' ? treasuryEntry(rng) : `min_${dept}`;
  }
  if (tier === 3) {
    // "new ministerial role" (a lateral move to a fresh brief) is the common
    // offer; an actual promotion to Secretary of State is the rarer ~40%.
    const current = state.player.officeId ? OFFICES[state.player.officeId].department : undefined;
    if (rng.chance(0.6)) {
      // lateral: a different department at the same (minister) rank
      const others = (Object.keys(DEPARTMENTS) as (keyof typeof DEPARTMENTS)[])
        .filter((d) => d !== current);
      const dept = bg.deptAffinity.length > 0 && rng.chance(0.4)
        ? rng.pick(bg.deptAffinity)
        : rng.pick(others);
      return dept === 'treasury' ? treasuryEntry(rng) : `min_${dept}`;
    }
    // a tier-4 promotion is usually a Secretary of State, but occasionally the
    // Chief Whip (a parallel cabinet-rank role in the whips' office)
    if (rng.chance(0.2)) return 'chiefWhip';
    // an MP from one of the nations may be sent to run that nation's office
    const regionOffice = REGION_OFFICE[state.player.region];
    if (regionOffice && rng.chance(0.25)) return regionOffice;
    // the Northern Ireland Secretary can be anyone — no playable party fields NI
    // MPs, so it isn't region-locked in practice
    if (rng.chance(0.05)) return 'sos_ni';
    // rarely, the Chief Secretary to the Treasury (junior cabinet)
    if (rng.chance(0.08)) return 'chief_sec';
    // or the Attorney General — a tier-4 law officer (ranks like the Chief
    // Secretary), in government or as Shadow Attorney General in opposition
    if (rng.chance(0.06)) return 'attorney_general';
    // or the Leader of the House — a tier-4 cabinet post running Commons business
    if (rng.chance(0.07)) return 'leader_house';
    const dept = current && rng.chance(0.45)
      ? current
      : bg.deptAffinity.length > 0 && rng.chance(0.4)
        ? rng.pick(bg.deptAffinity)
        : rng.pick(Object.keys(DEPARTMENTS)) as keyof typeof DEPARTMENTS;
    return `sos_${dept}`;
  }
  if (tier === 4) {
    // a sitting Cabinet minister is reshuffled AROUND the Cabinet — a sideways move to
    // a different department (or, occasionally, a promotion into a great office of state)
    // so they don't sit in one brief for a decade. Only departmental Secretary-of-State
    // targets, so it always reads as a lateral shuffle, never a demotion.
    const cur = state.player.officeId;
    const current = cur ? OFFICES[cur].department : undefined;
    if (cur && OFFICES[cur].department && !GREAT_OFFICES.includes(cur) && rng.chance(0.22)) {
      return rng.pick(GREAT_OFFICES.filter((o) => o !== cur));
    }
    const others = (Object.keys(DEPARTMENTS) as (keyof typeof DEPARTMENTS)[]).filter((d) => d !== current);
    if (others.length === 0) return null;
    const affinity = bg.deptAffinity.filter((d) => d !== current);
    const dept = affinity.length > 0 && rng.chance(0.4) ? rng.pick(affinity) : rng.pick(others);
    return `sos_${dept}`;
  }
  return null;
}

// ---------- office changes ----------

/** remember the highest tier the player has ever held, for comebacks */
export function recordPeakTier(state: GameState): void {
  const tier = playerTier(state);
  const peak = (state.player.flags._peakTier as number) ?? 0;
  if (tier > peak) state.player.flags._peakTier = tier;
}

/** a target office on which the Deputy-PM / First-Secretary overlay can sit */
function deputyEligibleOffice(officeId: OfficeId): boolean {
  // a full cabinet office: a departmental Secretary of State (not the Chief
  // Secretary), or the non-departmental Leader of the House
  return officeId === 'leader_house'
    || (OFFICES[officeId]?.tier === 4 && !!OFFICES[officeId]?.department && officeId !== 'chief_sec');
}

/** whether the PM lets the player keep the deputy title across a move — scaled by the
 *  PM's regard (leader relationship + party standing), never certain either way */
function pmKeepsDeputy(state: GameState, rng: Rng): boolean {
  const regard = getRelationship(state, 'leader')?.value ?? 0;       // ~ -100..100
  const standing = state.player.stats.partyStanding;                 // 0..100
  const chance = clamp(0.25 + (regard - 30) / 100 + (standing - 55) / 150, 0.05, 0.9);
  return rng.chance(chance);
}

export function giveOffice(
  state: GameState, rng: Rng, officeId: OfficeId, how: 'appointed' | 'promoted', keepDeputy = false
): void {
  // vacate any cabinet-level post the player held
  removePlayerFromFrontbench(state, rng);
  // a select-committee chair must give up the chair to take a frontbench office
  clearCommitteeChair(state, 'tookOffice');
  // a deputy normally loses the title on a move; keepDeputy (the PM's regard) carries it
  // across — but only onto another deputy-eligible brief
  if (!(keepDeputy && deputyEligibleOffice(officeId))) clearPlayerDeputyPM(state);
  state.player.officeId = officeId;
  state.player.officeSinceDay = state.day;
  recordPeakTier(state);
  // only government/opposition players occupy a tracked cabinet seat; minor-party
  // spokesperson roles are not part of any NPC bench
  if (onFrontbenchTrack(state) && CABINET_OFFICES.includes(officeId)) {
    // displace the NPC holder — drop them to the backbenches so they don't keep a
    // stale title (a "ghost minister" who later shows the wrong role in a contest)
    const side = frontbenchSide(state);
    const post = state.government[side].find((p) => p.officeId === officeId);
    const displaced = post && post.characterId !== 'player' ? state.characters[post.characterId] : undefined;
    if (displaced) displaced.officeId = null;
    setFrontbenchPost(state, side, officeId, 'player');
  }
  state.history.push({
    kind: 'roleChange', date: state.day, officeId, how,
    roleSide: currentRoleSide(state), partyId: state.player.partyId,
  });
}

function removePlayerFromFrontbench(state: GameState, rng: Rng): void {
  const prev = state.player.officeId;
  if (onFrontbenchTrack(state) && prev && CABINET_OFFICES.includes(prev)) {
    const replacement = newFrontbencher(state, rng, state.player.partyId, prev);
    setFrontbenchPost(state, frontbenchSide(state), prev, replacement.id);
  }
}

export function stripOffice(
  state: GameState,
  rng: Rng,
  how: 'dismissed' | 'resigned' | 'leftOffice'
): void {
  removePlayerFromFrontbench(state, rng);
  clearPlayerDeputyPM(state);
  state.player.officeId = null;
  state.player.officeSinceDay = null;
  state.history.push({ kind: 'roleChange', date: state.day, officeId: null, how });
}

/** clear the Deputy-PM overlay when the player loses the underlying SoS post */
function clearPlayerDeputyPM(state: GameState): void {
  if (state.player.flags._isDeputyPM || state.player.flags._govOverlayOpen) {
    delete state.player.flags._isDeputyPM;
    delete state.player.flags._govOverlayOpen;
    // close the concurrent overlay span on the profile timeline
    state.history.push({ kind: 'deputyOverlay', date: state.day, action: 'end' });
    if (state.government.deputyPmId === 'player') {
      state.government.deputyPmId = undefined;
      state.government.deputyTitle = undefined;
    }
  }
}

/** the Deputy-PM / First-Secretary role only exists in government. If the player has
 *  fallen into opposition (a lost election, or a mid-term change of government), drop
 *  the overlay — you can never be a "shadow Deputy PM". Called each turn. */
export function reconcilePlayerDeputy(state: GameState): void {
  if ((state.player.flags._isDeputyPM || state.player.flags._govOverlayOpen) && !playerInGovernmentBloc(state)) {
    const role = state.player.flags._isDeputyPM
      ? `the office of ${deputyPrefix(state.government.deputyTitle)}`
      : 'their government office';
    clearPlayerDeputyPM(state);
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${state.player.name} loses ${role} as the party leaves government`,
    });
  }
}

/** The Deputy PM overlay follows the JUNIOR coalition partner's leader. Call when that
 *  party's leadership changes so the overlay moves to the new leader (or clears a stale
 *  player overlay). No-op outside a coalition, for other parties, or if the junior leader
 *  did not hold the DPM (e.g. they took a department brief instead). */
export function reassignJuniorPartnerDeputy(state: GameState, party: PartyId, newLeaderId: string): void {
  if (state.government.arrangement !== 'coalition' || party !== state.government.coalitionPartner) return;
  const dpm = state.government.deputyPmId;
  const dpmWasJuniorLeader = !!dpm && (dpm === 'player'
    ? state.player.partyId === party
    : state.characters[dpm]?.partyId === party);
  if (!dpmWasJuniorLeader) return;
  const title = state.government.deputyTitle ?? 'dpm';
  clearPlayerDeputyPM(state); // clears _isDeputyPM + deputyPmId if it was 'player'
  state.government.deputyPmId = newLeaderId;
  state.government.deputyTitle = title;
  if (newLeaderId === 'player') {
    state.player.flags._isDeputyPM = true;
    state.player.flags._everDeputyPM = true;
  }
}

/** ~75% of NPC governments run a single deputy (≈2/3 Deputy PM, ≈1/3 First
 *  Secretary of State), drawn from the strongest cabinet hand. Re-rolling this
 *  whole decision keeps the aggregate chance of a deputy at 75% at any snapshot,
 *  whether it runs at the start of a parliament or at a mid-term reshuffle. */
export function appointNpcDeputyPm(state: GameState, rng: Rng): void {
  state.government.deputyPmId = undefined;
  state.government.deputyTitle = undefined;
  if (!rng.chance(0.75)) return;
  // candidates: governing-party cabinet Secretaries of State (a department) or the
  // Chancellor of the Duchy of Lancaster — never the Chief Whip / Chief Secretary,
  // and never a coalition partner's minister
  const pool = state.government.cabinet
    .filter((p) => p.characterId !== 'player'
      && (OFFICES[p.officeId]?.department || p.officeId === 'chancellor_duchy' || p.officeId === 'leader_house')
      && p.officeId !== 'chief_sec')
    .map((p) => ({ post: p, c: state.characters[p.characterId] }))
    .filter((x): x is { post: typeof x.post; c: Character } =>
      !!x.c && x.c.active && x.c.partyId === state.government.governingParty);
  if (pool.length === 0) return;
  // ~50% a great office of state (Chancellor/Home/Foreign), else another
  // secretary — and within the chosen bucket take the strongest by competence
  const great = pool.filter((x) => GREAT_OFFICES.includes(x.post.officeId));
  const other = pool.filter((x) => !GREAT_OFFICES.includes(x.post.officeId));
  const preferGreat = rng.chance(0.5);
  const primary = preferGreat ? great : other;
  const fallback = preferGreat ? other : great;
  const bucket = primary.length > 0 ? primary : fallback;
  if (bucket.length === 0) return;
  const best = bucket.sort((a, b) => b.c.competence - a.c.competence)[0];
  state.government.deputyPmId = best.c.id;
  state.government.deputyTitle = rng.chance(0.67) ? 'dpm' : 'firstSec';
}

/** the start-of-parliament re-decision: clears any holder (including a player
 *  deputy — re-earned each term) and re-rolls the NPC appointment */
function redecideNpcDeputyPm(state: GameState, rng: Rng): void {
  if (state.player.flags._isDeputyPM) {
    const dep = deputyPrefix(state.government.deputyTitle); // capture before clearing
    // re-appointed for the new term only if still in government AND the PM still rates
    // you (relationship + standing + a little chance); losing government always loses it
    const eligible = playerInGovernmentBloc(state)
      && !!state.player.officeId && deputyEligibleOffice(state.player.officeId);
    if (eligible && pmKeepsDeputy(state, rng)) return; // kept — no NPC re-decision, no notice
    clearPlayerDeputyPM(state); // records the overlay end on the timeline
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${state.player.name} is dropped as ${dep} in the post-election reshuffle`,
    });
  }
  appointNpcDeputyPm(state, rng);
}

/** a reshuffle of the governing cabinet may add, drop or move the deputy — but
 *  never disturbs a sitting PLAYER deputy (whose tenure is governed elsewhere,
 *  to keep the player's odds of holding it exactly as before) */
function reshuffleNpcDeputyPm(state: GameState, rng: Rng): void {
  if (state.government.deputyPmId === 'player') return;
  appointNpcDeputyPm(state, rng);
}

/** the player-PM names a cabinet Secretary of State as their Deputy PM / First
 *  Secretary. Only a departmental SoS (never the Chief Whip) is eligible. */
export function setDeputyPmCore(state: GameState, _rng: Rng, characterId: string): void {
  if (!playerIsLeader(state) || !playerInGovernment(state)) return;
  if (characterId === 'player' || characterId === state.government.deputyPmId) return;
  const post = state.government.cabinet.find((p) => p.characterId === characterId);
  // a departmental SoS or the Chancellor of the Duchy of Lancaster — not the Chief
  // Whip, the Chief Secretary, or a territorial secretary
  if (!post || (!OFFICES[post.officeId]?.department && post.officeId !== 'chancellor_duchy' && post.officeId !== 'leader_house') || post.officeId === 'chief_sec') return;
  delete state.player.flags._isDeputyPM;
  state.government.deputyPmId = characterId;
  state.government.deputyTitle = state.government.deputyTitle ?? 'dpm';
  const name = state.characters[characterId]?.name ?? 'a senior minister';
  const prefix = deputyPrefix(state.government.deputyTitle);
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${state.player.name} appoints ${name} ${prefix}`,
  });
}

// ---------- reshuffles ----------

export function runReshuffle(state: GameState, rng: Rng, emergency = false): void {
  if (!onFrontbenchTrack(state) || playerIsLeader(state)) return;

  const tier = playerTier(state);
  const inGov = playerInGovernment(state);
  const leaderName = characterName(
    state,
    inGov ? state.government.pmId : getRelationship(state, 'leader')?.characterId
  );

  state.history.push({
    kind: 'event', date: state.day,
    headline: emergency
      ? `${leaderName} forced into emergency ${inGov ? 'cabinet' : 'shadow cabinet'} reshuffle as polls slide`
      : inGov
        ? `${leaderName} reshuffles the cabinet`
        : `${leaderName} shakes up the shadow cabinet`,
  });

  // churn 1-2 NPC frontbench posts, with named winners and losers (leave any
  // coalition-partner ministers alone — they belong to the junior party)
  const side = frontbenchSide(state);
  const churnable = state.government[side].filter((p) =>
    p.characterId !== 'player' && state.characters[p.characterId]?.partyId === state.player.partyId);
  for (const post of rng.shuffle(churnable).slice(0, rng.int(1, emergency ? 3 : 2))) {
    const old = state.characters[post.characterId];
    if (old) old.officeId = null;
    const fresh = newFrontbencher(state, rng, state.player.partyId, post.officeId);
    post.characterId = fresh.id;
    const postTitle = inGov ? OFFICES[post.officeId].title : OFFICES[post.officeId].shadowTitle;
    state.history.push({
      kind: 'event', date: state.day,
      headline: old
        ? `${fresh.name} takes over as ${postTitle}; ${old.name} returns to the backbenches`
        : `${fresh.name} appointed ${postTitle}`,
    });
  }

  // a reshuffle of the governing cabinet may add/drop/move the deputy PM
  if (inGov) reshuffleNpcDeputyPm(state, rng);

  // is the player for the chop?
  if (state.player.officeId && !playerIsLeader(state)) {
    const holdScore = eligibilityScore(state, state.player.officeId) + rng.normal(0, 5);
    const floor = 39 + tier * 3 + (emergency ? 6 : 0);
    if (holdScore < floor || (state.player.flags.scandal && rng.chance(0.7))) {
      state.forcedQueue.push({ kind: 'dismissal' });
      return;
    }
  }

  // due a promotion / sideways move? A sitting Cabinet minister is left alone unless
  // they've served a good while (a fresh Secretary of State isn't shuffled out at every
  // reshuffle — that churns them too fast; the move-cadence handles longer-tenure moves).
  const tenureYears = (state.day - (state.player.officeSinceDay ?? state.day)) / 365;
  const target = (tier === 4 && tenureYears < 2.5 && !emergency) ? null : nextOfficeFor(state, rng);
  if (target) {
    const targetTier = OFFICES[target].tier;
    const score = eligibilityScore(state, target) + rng.normal(0, 6);
    if (score >= (OFFER_THRESHOLDS[targetTier] ?? 60)) {
      state.forcedQueue.push({ kind: 'reshuffleOffer', payload: { officeId: target } });
      return;
    }
  }

  // not promotable — perhaps a sideways move to a fresh department.
  // Secretaries of State are moved around less often than junior ministers.
  const currentOffice = state.player.officeId ? OFFICES[state.player.officeId] : null;
  const sidewaysChance = currentOffice?.tier === 4 ? 0.15 : 0.3;
  if (currentOffice?.department && rng.chance(sidewaysChance)) {
    const prefix = currentOffice.tier === 4 ? 'sos' : 'min';
    const otherDepts = (Object.keys(DEPARTMENTS) as (keyof typeof DEPARTMENTS)[])
      .filter((d) => d !== currentOffice.department);
    state.forcedQueue.push({
      kind: 'reshuffleOffer',
      payload: { officeId: `${prefix}_${rng.pick(otherDepts)}`, sideways: true },
    });
  }
}

/** an NPC-led party reshuffles its own front bench (texture for a living world) */
export function npcReshuffle(state: GameState, rng: Rng, party: PartyId): void {
  const side =
    party === state.government.governingParty ? 'cabinet'
    : party === state.government.oppositionParty ? 'shadowCabinet'
    : null;
  if (!side) return;
  const inGov = side === 'cabinet';
  const leaderName = characterName(
    state, inGov ? state.government.pmId : state.government.loId
  );
  // never churn a coalition partner's ministers (they belong to the junior party)
  const posts = state.government[side].filter((p) =>
    p.characterId !== 'player' && state.characters[p.characterId]?.partyId === party);
  const changed = rng.shuffle(posts).slice(0, rng.int(1, 2));
  if (changed.length === 0) return;
  for (const post of changed) {
    const old = state.characters[post.characterId];
    if (old) old.officeId = null;
    const fresh = newFrontbencher(state, rng, party, post.officeId);
    post.characterId = fresh.id;
  }
  const first = changed[0];
  const title = inGov ? OFFICES[first.officeId].title : OFFICES[first.officeId].shadowTitle;
  const newName = state.characters[first.characterId]?.name ?? 'a new face';
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${leaderName} reshuffles the ${inGov ? PARTIES[party].shortName + ' cabinet' : PARTIES[party].shortName + ' front bench'}; ${newName} appointed ${title}`,
  });

  // a reshuffle of the governing cabinet may add/drop/move the deputy PM
  if (inGov) reshuffleNpcDeputyPm(state, rng);
}

/** very rare: an NPC frontbencher steps back from public life */
export function npcFrontbencherRetires(state: GameState, rng: Rng, party: PartyId): void {
  const side =
    party === state.government.governingParty ? 'cabinet'
    : party === state.government.oppositionParty ? 'shadowCabinet'
    : null;
  if (!side) return;
  const inGov = side === 'cabinet';
  const post = rng.pick(state.government[side].filter((p) => p.characterId !== 'player'));
  if (!post) return;
  const old = state.characters[post.characterId];
  if (old) { old.officeId = null; old.active = false; }
  const fresh = newFrontbencher(state, rng, party, post.officeId);
  post.characterId = fresh.id;
  const title = inGov ? OFFICES[post.officeId].title : OFFICES[post.officeId].shadowTitle;
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${old?.name ?? 'A senior figure'} steps down from front-line politics; ${fresh.name} takes over as ${title}`,
  });

  // if the deputy PM was the one who retired, the post is re-decided
  if (inGov && old && state.government.deputyPmId === old.id) {
    reshuffleNpcDeputyPm(state, rng);
  }
}

// ---------- leadership ----------

export function leadershipBaseSupport(state: GameState): number {
  const s = state.player.stats;
  const pastLosses = (state.player.flags._contestLosses as number) ?? 0;
  return clamp(
    0.28 * s.partyStanding +
      0.18 * s.profile +
      0.15 * (50 + averageColleagueWarmth(state) / 2) +
      0.14 * s.competence +
      (playerTier(state) >= 4 ? 6 : 0) +
      (state.player.flags._isDeputyPM ? 12 : 0) +
      // a respected select-committee chair is a credible backbench figure
      (state.player.committeeChair || state.player.flags._wasCommitteeChair ? 3 : 0) -
      3 * state.player.rebellionCount -
      7 * pastLosses,
    5, 90
  );
}

/** Distribute a party's seats across leadership candidates in proportion to their raw
 *  support scores, as whole MPs that sum EXACTLY to totalSeats (largest-remainder
 *  rounding). Used purely for display — so the vote tallies the player reads (both when
 *  standing and when backing an NPC) add up to the party's actual size. Every listed
 *  candidate gets at least 1 when there are enough seats to go round. */
export function seatProportionalTallies(
  raw: Record<string, number>, totalSeats: number
): Record<string, number> {
  const ids = Object.keys(raw);
  const out: Record<string, number> = {};
  if (ids.length === 0 || totalSeats <= 0) {
    for (const id of ids) out[id] = 0;
    return out;
  }
  // shift scores positive so a weak candidate still gets a sliver of weight, not zero
  const min = Math.min(...ids.map((id) => raw[id] ?? 0));
  const weight = (id: string) => Math.max(0.0001, (raw[id] ?? 0) - min + 1);
  const sum = ids.reduce((t, id) => t + weight(id), 0);

  // largest-remainder: floor each share, then give the leftover seats to the biggest
  // fractional parts — the result always sums to exactly totalSeats
  const exact = ids.map((id) => ({ id, q: (totalSeats * weight(id)) / sum }));
  let assigned = 0;
  for (const e of exact) { out[e.id] = Math.floor(e.q); assigned += out[e.id]; }
  let leftover = totalSeats - assigned;
  const byFrac = [...exact].sort((a, b) => (b.q - Math.floor(b.q)) - (a.q - Math.floor(a.q)));
  for (let i = 0; leftover > 0; i = (i + 1) % byFrac.length) { out[byFrac[i].id]++; leftover--; }

  // no listed candidate should read "0 MPs" when the party is big enough to share round:
  // borrow a seat from whoever currently has the most (keeps the total exact)
  if (totalSeats >= ids.length) {
    for (const id of ids) {
      if (out[id] === 0) {
        const big = ids.reduce((m, x) => (out[x] > out[m] ? x : m), ids[0]);
        if (out[big] > 1) { out[big]--; out[id]++; }
      }
    }
  }
  return out;
}

/** floor on a player's final members'-ballot score (the appeal-weighted `playerFinal`);
 *  stops a hopeless candidate sneaking the crown on noise alone. Tuned vs sim. */
const LEADERSHIP_WIN_THRESHOLD = 48;

/** Any sitting MP may put their name forward when the leadership falls vacant —
 *  even a backbencher. Whether they get anywhere is decided by support in the
 *  ballots (a long-shot is usually eliminated in the early rounds), not here. */
export function playerCanStandForLeader(state: GameState): boolean {
  return state.player.hasSeat && !playerIsLeader(state) && canHoldOffice(state);
}

/** assemble the named field for a leadership contest: 3-6 heavyweight rivals */
function pickContestCandidates(state: GameState, rng: Rng, party: PartyId): string[] {
  const fieldSize = rng.int(3, 6);
  const byComp = (a: Character, b: Character) => b.competence - a.competence;
  const members = (pred: (c: Character) => boolean) => Object.values(state.characters)
    .filter((c) => c.active && c.partyId === party && c.id !== 'player' && c.officeId !== 'leader' && pred(c))
    .sort(byComp);
  // the field is led by the strongest cabinet-rank front-benchers (the usual contest)
  const ids = members((c) => !!c.officeId && OFFICES[c.officeId].tier === 4)
    .slice(0, fieldSize).map((c) => c.id);
  // if the senior bench can't fill the field (a thin or minor party), Ministers of
  // State and then backbenchers join in — they can stand, they just rarely win
  // (the tier penalty in rivalStrengthOf), keeping major-party contests unchanged
  if (ids.length < fieldSize) {
    const extras = [
      ...members((c) => !!c.officeId && OFFICES[c.officeId].tier === 3),
      ...members((c) => !c.officeId),
    ];
    for (const c of extras) {
      if (ids.length >= fieldSize) break;
      if (!ids.includes(c.id)) ids.push(c.id);
    }
  }

  // your long-standing rival recurs as an antagonist: force them into the field
  // (if they're an active colleague in this party) so the same name keeps coming back
  const rivalId = getRelationship(state, 'rival')?.characterId;
  if (
    rivalId && rivalId !== 'player' && state.characters[rivalId]?.active &&
    state.characters[rivalId]?.partyId === party && !ids.includes(rivalId)
  ) {
    ids.unshift(rivalId);
    if (ids.length > fieldSize) ids.length = fieldSize;
  }

  // top up a thin field with fresh hopefuls so every contest has a proper 3-6 names
  while (ids.length < fieldSize) {
    const c = generateCharacter(rng, usedNamesOf(state), {
      partyId: party, minAge: 40, maxAge: 60, competenceMean: 60, traitBias: ['ambitious'],
    }, npcIdCounter(state));
    state.characters[c.id] = c;
    ids.push(c.id);
  }

  // even with a full front bench, a major party's field occasionally includes an
  // insurgent: a Minister of State (~12%) or a backbencher (~9%) who stands anyway.
  // They take the weakest senior's slot (never the front-runner's) and rarely win.
  const isMajor =
    party === state.government.governingParty || party === state.government.oppositionParty;
  if (isMajor && ids.length >= 3) {
    let injected = 0;
    const injectInsurgent = (id: string) => {
      if (ids.includes(id)) return;
      const idx = ids.length - 1 - injected;
      if (idx >= 1) { ids[idx] = id; injected++; }
    };
    if (rng.chance(0.12)) {
      const realMos = members((c) => !!c.officeId && OFFICES[c.officeId].tier === 3)[0];
      let mosId: string;
      if (realMos) {
        mosId = realMos.id;
      } else {
        const depts = Object.keys(DEPARTMENTS) as (keyof typeof DEPARTMENTS)[];
        const mos = generateCharacter(rng, usedNamesOf(state), {
          partyId: party, minAge: 38, maxAge: 58, competenceMean: 58,
          traitBias: ['ambitious'], officeId: `min_${rng.pick(depts)}` as OfficeId,
        }, npcIdCounter(state));
        state.characters[mos.id] = mos;
        mosId = mos.id;
      }
      injectInsurgent(mosId);
    }
    if (rng.chance(0.09)) {
      const realBencher = members((c) => !c.officeId)[0];
      let benchId: string;
      if (realBencher) {
        benchId = realBencher.id;
      } else {
        const b = generateCharacter(rng, usedNamesOf(state), {
          partyId: party, minAge: 38, maxAge: 60, competenceMean: 56, traitBias: ['ambitious'],
        }, npcIdCounter(state));
        state.characters[b.id] = b;
        benchId = b.id;
      }
      injectInsurgent(benchId);
    }
  }

  // a minor party has no front bench; give SOME contenders a spokesperson brief so the
  // field reads as a mix of "[Party] Spokesperson for X" and "Backbench MP" (not all backbench)
  const isMinor =
    party !== state.government.governingParty && party !== state.government.oppositionParty;
  if (isMinor) {
    const prominent = ['treasury', 'home', 'foreign', 'health'] as (keyof typeof DEPARTMENTS)[];
    const allDepts = Object.keys(DEPARTMENTS) as (keyof typeof DEPARTMENTS)[];
    const used = new Set<string>();
    for (const id of ids) {
      const c = state.characters[id];
      if (!c || c.officeId) continue;       // leave any existing office / the rival's brief alone
      if (!rng.chance(0.45)) continue;       // many stay backbenchers
      const pref = (rng.chance(0.6) ? prominent : allDepts).filter((d) => !used.has(d));
      const dept = pref.length ? rng.pick(pref) : rng.pick(allDepts);
      used.add(dept);
      c.officeId = `min_${dept}` as OfficeId;
    }
  }

  return ids;
}

/** a rival's contest strength: competence-led, trait-flavoured, seeded once */
function rivalStrengthOf(c: Character, rng: Rng): number {
  const traitBonus =
    (c.traits.includes('ambitious') ? 4 : 0) +
    (c.traits.includes('ruthless') ? 4 : 0) +
    (c.traits.includes('charming') ? 3 : 0) +
    (c.traits.includes('fixer') ? 2 : 0) -
    (c.traits.includes('dull') ? 5 : 0);
  // seniority weighs heavily: cabinet-rank candidates are the baseline; a Minister of
  // State is a long shot and a backbencher a rank outsider. Anchored at 0 for tier-4 so
  // a field of front-benchers calibrates exactly as before. The backbench gap (-12 vs
  // the -7.1 head-to-head noise sd) leaves a backbencher ~5% odds against a Sec of State.
  const tier = c.officeId ? OFFICES[c.officeId].tier : 0;
  const tierBonus = tier >= 4 ? 0 : tier === 3 ? -8 : -12;
  return 0.6 * c.competence + traitBonus + tierBonus + rng.normal(0, 5);
}

/** put a rival's seeded strength on the same ~5–95 "MP support" scale as the player's
 *  leadershipBaseSupport, so the whole contest can run off a single tally table */
function rivalTallyFrom(strength: number): number {
  return clamp(strength + 18, 5, 95);
}

/** how many candidates fall at a ballot (incl. the player in `remaining`): usually one,
 *  but a big field sheds its no-hopers faster so the contest converges in ~3–5 ballots */
function dropCountFor(remaining: number): number {
  if (remaining >= 7) return 3;
  if (remaining >= 5) return 2;
  return 1;
}

/** the player is held to a slightly higher bar in the ELIMINATION ballots (never the
 *  members' final), so being knocked out before the last two is ~10% likelier. Tuned vs sim. */
const PRE_FINAL_HANDICAP = 3;

const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
function ordinal(n: number): string {
  return ORDINALS[n] ?? `${n}th`;
}

/** a leadership vacancy has opened in `party` */
export function openLeadershipVacancy(state: GameState, rng: Rng, party: PartyId): void {
  if (party === state.player.partyId && playerCanStandForLeader(state)) {
    state.forcedQueue.push({
      kind: 'leadershipStand',
      payload: { candidateIds: pickContestCandidates(state, rng, party) },
    });
  } else {
    resolveNpcLeadership(state, rng, party);
  }
}

/** an NPC wins the contest; updates PM/LO and the player's leader relationship.
 *  Pass `forcedWinnerId` when the winner is already decided (e.g. the named
 *  finalist who beat the player). */
export function resolveNpcLeadership(
  state: GameState,
  rng: Rng,
  party: PartyId,
  forcedWinnerId?: string
): Character {
  // the field: front-benchers lead, but Ministers of State and even backbenchers can
  // win (rivalStrengthOf makes the senior names the likely victors), else fresh blood
  const members = Object.values(state.characters).filter(
    (c) => c.active && c.partyId === party && c.officeId !== 'leader'
  );
  const contenders = members.filter((c) => c.officeId && OFFICES[c.officeId].tier >= 3);
  const fieldForWin = contenders.length > 0 ? contenders : members;
  let winner: Character;
  if (forcedWinnerId && state.characters[forcedWinnerId]) {
    winner = state.characters[forcedWinnerId];
    const oldOffice = winner.officeId;
    if (oldOffice && CABINET_OFFICES.includes(oldOffice)) {
      const side = party === state.government.governingParty ? 'cabinet' : 'shadowCabinet';
      const fresh = newFrontbencher(state, rng, party, oldOffice);
      setFrontbenchPost(state, side, oldOffice, fresh.id);
    }
  } else if (fieldForWin.length > 0 && rng.chance(0.8)) {
    const scored = fieldForWin.map((c) => ({ c, s: rivalStrengthOf(c, rng) }));
    winner = scored.reduce((a, b) => (a.s >= b.s ? a : b)).c;
    // a cabinet-rank old post gets a new holder (a min_* spokesperson holds no bench seat)
    const oldOffice = winner.officeId;
    const side = party === state.government.governingParty ? 'cabinet' : 'shadowCabinet';
    if (oldOffice && CABINET_OFFICES.includes(oldOffice)) {
      const fresh = newFrontbencher(state, rng, party, oldOffice);
      setFrontbenchPost(state, side, oldOffice, fresh.id);
    }
  } else {
    winner = generateCharacter(rng, usedNamesOf(state), {
      partyId: party, officeId: 'leader', minAge: 42, maxAge: 60,
      competenceMean: 60, traitBias: ['ambitious'],
    }, npcIdCounter(state));
    state.characters[winner.id] = winner;
  }
  winner.officeId = 'leader';

  // retire the old leader
  const oldLeaderId =
    party === state.government.governingParty ? state.government.pmId :
    party === state.government.oppositionParty ? state.government.loId :
    getRelationship(state, 'leader')?.characterId;
  if (oldLeaderId && oldLeaderId !== 'player' && state.characters[oldLeaderId]) {
    state.characters[oldLeaderId].active = false;
    state.characters[oldLeaderId].officeId = null;
  }

  if (party === state.government.governingParty) {
    state.government.pmId = winner.id;
    state.government.pmSinceDay = state.day;
    recordPmChange(state, winner.id);
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${winner.name} becomes Prime Minister`,
    });
  } else if (party === state.government.oppositionParty) {
    state.government.loId = winner.id;
    recordLoChange(state, winner.id);
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${winner.name} elected leader of the ${PARTIES[party].name}`,
    });
  } else if (party === state.government.coalitionPartner) {
    // the junior coalition partner's leadership changed — the Deputy PM overlay
    // follows the new leader (and clears any stale player overlay)
    reassignJuniorPartnerDeputy(state, party, winner.id);
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${winner.name} elected leader of the ${PARTIES[party].name}`,
    });
  } else {
    // any other party (a minor/third party that is neither the government, the official
    // opposition, nor the coalition partner) — record it so no leadership change is silent
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${winner.name} elected leader of the ${PARTIES[party].name}`,
    });
  }

  if (party === state.player.partyId) {
    const seed = clamp(
      5 + state.player.stats.partyStanding / 8 - state.player.rebellionCount * 4 + rng.int(-8, 8),
      -30, 30
    );
    replaceLeader(state, winner.id, seed);
    // a new leader of the player's own party soon remakes the team — schedule a
    // player-facing reshuffle so they are more likely to be moved, promoted or sacked
    if (state.player.hasSeat && onFrontbenchTrack(state) && !playerIsLeader(state)) {
      state.player.flags._npcLeaderReshuffleBy = state.day + rng.int(7, 35);
    }
  }

  // a new NPC leader usually remakes their front bench
  const isFrontbench =
    party === state.government.governingParty || party === state.government.oppositionParty;
  if (isFrontbench && rng.chance(0.65)) {
    npcReshuffle(state, rng, party);
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${winner.name} reshuffles the ${party === state.government.governingParty ? 'cabinet' : 'shadow cabinet'}`,
    });
  }
  return winner;
}

/** the player isn't standing (or has just been knocked out): run the rest of the
 *  contest as a BACKER. Each round they get behind a candidate; the per-candidate
 *  tally (carried in the forced-event payload) decides how warm the new leader is
 *  with them. Strengths are fixed once so the field whittles consistently. */
export function startBacking(state: GameState, rng: Rng, party: PartyId, survivors: string[]): void {
  const field = survivors.filter((id) => state.characters[id]?.active);
  if (field.length <= 1) {
    resolveNpcLeadership(state, rng, party, field[0]);
    return;
  }
  const strengths: Record<string, number> = {};
  for (const id of field) strengths[id] = rivalStrengthOf(state.characters[id], rng);
  state.forcedQueue.unshift({
    kind: 'leadershipBacking',
    payload: { party, survivors: field, strengths, backing: {}, round: 1 },
  });
}

function makePlayerLeader(state: GameState, rng: Rng): void {
  const party = state.player.partyId;
  removePlayerFromFrontbench(state, rng);
  state.player.officeId = 'leader';
  state.player.officeSinceDay = state.day;
  // record the polling the player inherits, so "failed to improve" can bite later;
  // and clear any stale resignation pledge from a previous spell as leader
  state.player.flags._leaderTookOverPolls = (state.polling.shares[party] ?? 0) * 100;
  delete state.player.flags._pledgeResignBy;
  // a new leader remakes the bench quickly — usually within a few weeks
  if (rng.chance(0.80)) {
    state.player.flags._newLeaderReshuffleBy = state.day + rng.int(7, 35);
  }
  recordPeakTier(state);
  // re-taking the JUNIOR coalition partner's leadership reclaims the Deputy PM overlay
  // (it followed the previous leader). Do this BEFORE recording history so the role
  // label reads as "Deputy Prime Minister…" and not the gov-side default "Prime Minister".
  const juniorCoalition = state.government.arrangement === 'coalition'
    && state.government.coalitionPartner === party
    && party !== state.government.governingParty;
  if (juniorCoalition) reassignJuniorPartnerDeputy(state, party, 'player');
  state.history.push({
    kind: 'roleChange', date: state.day, officeId: 'leader', how: 'electedLeader',
    roleSide: currentRoleSide(state), partyId: state.player.partyId,
    ...(juniorCoalition ? { label: playerOfficeTitle(state) } : {}),
  });
  state.history.push({ kind: 'leadershipContest', date: state.day, won: true, partyId: party });

  const oldLeaderId =
    party === state.government.governingParty ? state.government.pmId :
    party === state.government.oppositionParty ? state.government.loId :
    getRelationship(state, 'leader')?.characterId;
  if (oldLeaderId && oldLeaderId !== 'player' && state.characters[oldLeaderId]) {
    state.characters[oldLeaderId].active = false;
    state.characters[oldLeaderId].officeId = null;
  }

  if (party === state.government.governingParty) {
    state.government.pmId = 'player';
    state.government.pmSinceDay = state.day;
    recordPmChange(state, 'player');
    state.history.push({
      kind: 'roleChange', date: state.day, officeId: 'leader', how: 'becamePM',
      roleSide: 'gov', partyId: state.player.partyId,
    });
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${state.player.name} enters Number 10`,
    });
  } else {
    // official opposition or a minor party — either way, "leader of the party"
    if (party === state.government.oppositionParty) {
      state.government.loId = 'player';
      recordLoChange(state, 'player');
    }
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${state.player.name} elected leader of the ${PARTIES[party].name}`,
    });
  }
  const rel = getRelationship(state, 'leader');
  if (rel) rel.characterId = 'player';
}

// ---------- elections: government formation & aftermath ----------

export function applyElectionAftermath(
  state: GameState,
  rng: Rng,
  result: ElectionResult,
  playerWonSeat: boolean
): void {
  const prevGov = state.government.governingParty;
  const prevOpp = state.government.oppositionParty;
  let newGov = result.governingParty;
  // snapshot the outgoing seat counts before they're overwritten — used to scale
  // NPC leader resignations by how much each party gained or lost
  const prevSeats = { ...state.seats };

  state.history.push({
    kind: 'election', date: state.day, resultId: result.id, heldSeat: playerWonSeat,
  });

  // seat status for the player
  if (playerWonSeat && !state.player.hasSeat) {
    state.player.hasSeat = true;
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${state.player.name} returns to Parliament`,
    });
  }

  // the official opposition is the largest non-governing party by seats — driven
  // by the actual result, not a fixed "major party" list, so e.g. the Lib Dems
  // can take it from a collapsed Conservative or Labour party. Sinn Féin abstain,
  // and the Speaker / independents sit outside party politics, so none can lead it.
  const ranked = (Object.entries(result.seats) as [PartyId, number][])
    .filter(([p, n]) => p !== newGov && p !== 'sf' && p !== 'spk' && p !== 'ind' && !!PARTIES[p] && (n ?? 0) > 0)
    .sort((a, b) => b[1] - a[1]);
  let newOpp = ranked[0]?.[0] ?? (newGov === prevGov ? prevOpp : prevGov);

  // rare "rainbow coalition": in a CLOSE hung result the runner-up occasionally
  // forms a coalition and governs instead of the largest party (~4% of the time).
  // The former largest party is bumped into opposition.
  let forceCoalition = false;
  if (result.outcome !== 'majority' && newOpp && newOpp !== newGov) {
    const lead = (result.seats[newGov] ?? 0) - (result.seats[newOpp] ?? 0);
    const partner = pickCoalitionPartner(result, rng, newOpp);
    if (lead <= 18 && partner && rng.chance(0.04)) {
      newGov = newOpp;
      newOpp = (Object.entries(result.seats) as [PartyId, number][])
        .filter(([p, n]) => p !== newGov && p !== 'sf' && p !== 'spk' && p !== 'ind' && !!PARTIES[p] && (n ?? 0) > 0)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? newGov;
      result.governingParty = newGov; // keep the stored result + PM history consistent
      forceCoalition = true;
    }
  }

  // "elections won as leader": the player led their party into this election and
  // it formed the government (winning from opposition, or an incumbent re-elected)
  if (playerWonSeat && playerIsLeader(state) && state.player.partyId === newGov) {
    state.player.flags._electionsWonAsLeader =
      (((state.player.flags._electionsWonAsLeader as number) ?? 0) + 1);
  }

  const changeOfGovernment = newGov !== prevGov;
  if (changeOfGovernment) {
    // the frontbenches swap across the despatch box
    const oldCabinet = state.government.cabinet;
    state.government.cabinet = state.government.shadowCabinet;
    state.government.shadowCabinet = oldCabinet;
    const oldPmId = state.government.pmId;
    // the new PM is the leader of the party that actually WON (newGov) — not
    // necessarily the old Leader of the Opposition (a third/runner-up party can
    // leap to government). The defeated PM usually becomes LO.
    const newPmId = (playerWonSeat && playerIsLeader(state) && state.player.partyId === newGov)
      ? 'player'
      : partyLeaderId(state, rng, newGov);
    state.government.pmId = newPmId;
    state.government.loId = oldPmId;
    state.government.pmSinceDay = state.day;
    recordPmChange(state, newPmId);
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${PARTIES[newGov].name} wins the general election`,
    });
    if (state.government.pmId === 'player') {
      state.history.push({
        kind: 'roleChange', date: state.day, officeId: 'leader', how: 'becamePM',
        roleSide: 'gov', partyId: state.player.partyId,
      });
      state.history.push({
        kind: 'event', date: state.day,
        headline: `${state.player.name} enters Number 10`,
      });
    }
  } else {
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${PARTIES[newGov].name} returned to government`,
    });
  }

  state.government.governingParty = newGov;
  state.government.oppositionParty = newOpp;
  // the rosters (and the player's seat on them) follow the election result
  reconcileFrontbenches(state, rng, playerWonSeat);
  const sfSeats = result.seats.sf ?? 0;
  const votingSeats = 650 - sfSeats - 1;
  const govSeats = result.seats[newGov] ?? 0;
  state.government.majority = govSeats - (votingSeats - govSeats);

  // incumbent fatigue: count consecutive terms the same party has governed
  state.government.termsInPower = newGov === prevGov
    ? (state.government.termsInPower ?? 1) + 1
    : 1;

  // ---- government arrangement & coalition formation ----
  // a fresh parliament starts with no inherited coalition/supply partner
  delete state.government.coalitionPartner;
  delete state.government.confidencePartner;
  if (result.outcome === 'majority') {
    state.government.arrangement = 'majority';
  } else {
    state.government.arrangement = 'minority'; // default; may be upgraded below
    const seatsForMajority = Math.floor(votingSeats / 2) + 1;
    const shortfall = Math.max(0, seatsForMajority - govSeats);
    const partner = pickCoalitionPartner(result, rng, newGov);
    const playerParty = state.player.partyId;
    const playerSeats = result.seats[playerParty] ?? 0;
    if (playerWonSeat && playerIsLeader(state) && playerParty === newGov) {
      // the player is the incoming PM — they choose the arrangement, picking from
      // EVERY compatible partner (the Lib Dems and the SNP both, not just one)
      const partners = compatibleCoalitionPartners(result.seats, newGov);
      state.forcedQueue.push({ kind: 'coalitionTalks', payload: { partners } });
    } else if (
      playerWonSeat && playerIsLeader(state) && playerParty !== newGov &&
      shortfall > 0 && playerSeats >= shortfall
    ) {
      // the player's party holds the balance of power. Usually they're courted —
      // but the largest party isn't bound to them: ~30% of the time, when another
      // willing partner exists, it deals elsewhere and the player gets no offer.
      const otherPartner = pickCoalitionPartner(result, rng, newGov, playerParty);
      if (otherPartner && rng.chance(0.30)) {
        formNpcGovernment(state, rng, newGov, otherPartner);
      } else {
        const majorSeats = result.seats[newGov] ?? 0;
        // "genuinely close" — the runner-up is within reach of competing to govern
        const canCompete = playerSeats > 0 && (majorSeats - playerSeats) <= 40;
        state.forcedQueue.push({
          kind: 'coalitionOffer',
          payload: { majorParty: newGov, shortfall, partySeats: playerSeats, majorSeats, canCompete },
        });
      }
    } else if (forceCoalition && partner) {
      // the runner-up's rainbow coalition seizes government from the largest party
      state.government.arrangement = 'coalition';
      state.government.coalitionPartner = partner;
      seatCoalitionCabinet(state, rng);
      recomputeOpposition(state, rng);
      state.history.push({
        kind: 'event', date: state.day,
        headline: `${PARTIES[newGov].name} forms a coalition with the ${PARTIES[partner].shortName} to govern, despite finishing second`,
      });
    } else {
      // NPCs settle it among themselves
      formNpcGovernment(state, rng, newGov, partner);
    }
  }

  // the deputy-PM job is re-decided for the new parliament
  redecideNpcDeputyPm(state, rng);

  state.parliamentStart = state.day;
  state.nextElectionBy = state.day + Math.round(4.75 * 365);
  state.player.rebellionCount = 0;
  // a defection has now been tested at the ballot box
  delete state.player.flags.defected;
  // start a fresh polling tracker for the new parliament
  state.pollHistory = [{ day: state.day, shares: { ...state.polling.shares } }];

  // ---- player seat lost? ----
  if (!playerWonSeat) {
    state.player.hasSeat = false;
    clearCommitteeChair(state, 'lostSeat'); // a chair who loses their seat loses the chair
    if (playerIsLeader(state)) {
      // losing your own seat as leader ends the leadership immediately
      state.player.officeId = null;
      state.player.officeSinceDay = null;
      // close the career-timeline span (PM / LO / minor leader) — without this the
      // Profile keeps showing the old role running "…–now" after they've left
      state.history.push({ kind: 'roleChange', date: state.day, officeId: null, how: 'leftOffice' });
      resolveNpcLeadership(state, rng, state.player.partyId);
    } else if (state.player.officeId) {
      stripOffice(state, rng, 'leftOffice');
    }
    state.forcedQueue.push({ kind: 'lostSeat' });
    // any leadership fallout in other parties resolves quietly
    settleNpcLeaderships(state, rng, prevGov, newGov, prevOpp, result, prevSeats);
    return;
  }

  // ---- player kept their seat ----
  // if the player's party fell off the frontbench track, they lose office
  const wasOnTrack =
    state.player.partyId === prevGov || state.player.partyId === prevOpp;
  const onTrack =
    state.player.partyId === newGov || state.player.partyId === newOpp;
  if (state.player.officeId && state.player.officeId !== 'speaker' && !playerIsLeader(state) && !onTrack) {
    stripOffice(state, rng, 'leftOffice');
  }

  // a retained portfolio flips between government and shadow (or vice versa) on a
  // change of government — OR when the player's party gains a frontbench track
  // (e.g. a third party becomes the official opposition) without one. Record it so
  // the career timeline and history show the correct current title (e.g. Health
  // Secretary → Shadow Health Secretary, or a spokesperson taking up a shadow brief).
  if (
    (changeOfGovernment || !wasOnTrack) &&
    onTrack &&
    state.player.officeId &&
    state.player.officeId !== 'speaker' &&
    !playerIsLeader(state)
  ) {
    const nowInGov = state.player.partyId === newGov;
    const expected = playerOfficeTitle(state);
    // the "Emily Thornberry effect": a shadow minister / spokesperson usually slots
    // straight into the matching brief, but the incoming leader occasionally passes
    // them over. More likely with weak party standing / competence — ~2% at the top,
    // ~14% at the bottom, 5-7% for a middling frontbencher.
    const s = state.player.stats;
    const snubChance = clamp(0.06 + (55 - (s.partyStanding + s.competence) / 2) * 0.0025, 0.02, 0.15);
    if (rng.chance(snubChance)) {
      if (rng.chance(0.7)) {
        // passed over entirely — back to the backbenches
        stripOffice(state, rng, 'leftOffice');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} is overlooked for ${expected} and returns to the backbenches`,
        });
      } else {
        // handed a lesser brief instead of the job they shadowed
        giveOffice(state, rng, deptOfficeId(rng, BACKGROUNDS[state.player.background], 3), 'appointed');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} is passed over for ${expected} and handed a junior brief`,
        });
      }
    } else {
      state.history.push({
        kind: 'roleChange', date: state.day, officeId: state.player.officeId, how: 'continued',
        roleSide: currentRoleSide(state), partyId: state.player.partyId,
      });
      state.history.push({
        kind: 'event', date: state.day,
        headline: nowInGov
          ? `${state.player.name} takes office as ${expected}`
          : `${state.player.name} becomes ${expected}`,
      });
    }
  }

  // defeated leaders usually resign
  if (playerIsLeader(state) && state.player.partyId === prevGov && changeOfGovernment) {
    state.forcedQueue.push({
      kind: 'resignPrompt',
      payload: { reason: 'electionDefeat' },
    });
  }

  // every parliament opens with the election of a Speaker. Offer it to an eligible
  // player: a sitting backbencher (or the incumbent Speaker recontesting). Solid
  // integrity is the price of entry — unqualified backbenchers aren't pestered.
  const isSpeaker = !!state.player.flags._isSpeaker;
  const eligibleForChair =
    state.player.hasSeat &&
    (isSpeaker || state.player.officeId === null) &&
    (isSpeaker || state.player.stats.integrity > 55);
  if (eligibleForChair) {
    state.forcedQueue.push({ kind: 'speakerContest' });
  }

  // a sitting select-committee chair must seek re-election to the chair each
  // parliament (incumbents are strongly favoured). Fresh chairs come up via the
  // mid-parliament scheduler hazard, so this doesn't clash with the Speaker offer.
  if (state.player.hasSeat && state.player.committeeChair && state.player.officeId === null) {
    state.forcedQueue.push({
      kind: 'committeeChairContest',
      payload: { dept: state.player.committeeChair, incumbent: true },
    });
  }

  settleNpcLeaderships(state, rng, prevGov, newGov, prevOpp, result, prevSeats);
}

const POPULIST_PARTIES: PartyId[] = ['reform', 'brexit', 'ukip'];
/** the maximum ideology gap two parties will bridge to govern together */
const MAX_COALITION_DISTANCE = 75;

/** would these two parties ever sit in government together? Hard bans aside
 *  (Labour never with a populist right party; the Conservatives never with the
 *  Greens), they must be within an ideological reach of each other. */
export function coalitionCompatible(a: PartyId, b: PartyId): boolean {
  const banned = (x: PartyId, y: PartyId) =>
    (x === 'lab' && POPULIST_PARTIES.includes(y)) || (x === 'con' && y === 'green');
  if (banned(a, b) || banned(b, a)) return false;
  if (!PARTIES[a] || !PARTIES[b]) return false;
  return Math.abs(PARTIES[a].ideology - PARTIES[b].ideology) <= MAX_COALITION_DISTANCE;
}

/** pick a plausible coalition/supply partner for the largest party: any seated,
 *  compatible party (not just the single nearest), chosen weighted by seats so
 *  the partner varies but plausibly favours larger ones. Returns null if no
 *  compatible partner exists (→ the major party governs as a minority). */
export function pickCoalitionPartner(
  result: { seats: Partial<Record<PartyId, number>> }, rng: Rng, newGov: PartyId, exclude?: PartyId
): PartyId | null {
  const candidates = (Object.entries(result.seats) as [PartyId, number][])
    .filter(([p, seats]) =>
      p !== newGov && p !== exclude && seats > 0 &&
      p !== 'sf' && p !== 'spk' && p !== 'ind' && !!PARTIES[p] &&
      coalitionCompatible(newGov, p));
  if (candidates.length === 0) return null;
  return rng.pickWeighted(candidates, ([, seats]) => seats)[0];
}

/** every seated, ideologically-compatible coalition partner for the largest party,
 *  largest first, capped — so the player-PM is offered a real choice (e.g. the Lib
 *  Dems AND the SNP), not just one. Opposed parties (per coalitionCompatible) are
 *  excluded, as before. */
export function compatibleCoalitionPartners(
  seats: Partial<Record<PartyId, number>>, newGov: PartyId, max = 3
): PartyId[] {
  return (Object.entries(seats) as [PartyId, number][])
    .filter(([p, n]) =>
      p !== newGov && (n ?? 0) > 0 &&
      p !== 'sf' && p !== 'spk' && p !== 'ind' && !!PARTIES[p] &&
      coalitionCompatible(newGov, p))
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, max)
    .map(([p]) => p);
}

/** the player's party wrests government from the largest party after a hung result:
 *  they form a (precarious) minority government and the former leader falls into
 *  opposition. The front benches are rebuilt around the new line-up. */
function playerSeizesGovernment(state: GameState, rng: Rng): void {
  const major = state.government.governingParty;
  state.government.governingParty = state.player.partyId;
  state.government.oppositionParty = major;
  state.government.pmId = 'player';
  state.government.pmSinceDay = state.day;
  state.government.arrangement = 'minority';
  delete state.government.coalitionPartner;
  delete state.government.confidencePartner;
  const sf = state.seats.sf ?? 0;
  const voting = 650 - sf - 1;
  const govSeats = state.seats[state.player.partyId] ?? 0;
  state.government.majority = govSeats - (voting - govSeats);
  reconcileFrontbenches(state, rng, true);
  recomputeOpposition(state, rng);
  recordPmChange(state, 'player');
  state.history.push({
    kind: 'roleChange', date: state.day, officeId: 'leader', how: 'becamePM',
    roleSide: 'gov', partyId: state.player.partyId,
  });
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${state.player.name} forms a minority government and enters Number 10`,
  });
}

/** NPCs settle a sub-majority government: form a coalition (~10%), confidence-and-
 *  supply (~20%), or a bare minority. Used when the player isn't the kingmaker, or
 *  declines to be — so the largest party can still strike a deal with someone else. */
function formNpcGovernment(state: GameState, rng: Rng, newGov: PartyId, partner: PartyId | null): void {
  if (!partner) {
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${PARTIES[newGov].name} to govern as a minority`,
    });
    return;
  }
  const roll = rng.next();
  if (roll < 0.10) {
    state.government.arrangement = 'coalition';
    state.government.coalitionPartner = partner;
    seatCoalitionCabinet(state, rng);
    recomputeOpposition(state, rng);
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${PARTIES[newGov].name} forms a coalition with the ${PARTIES[partner].shortName}`,
    });
  } else if (roll < 0.30) {
    state.government.arrangement = 'supplyConfidence';
    state.government.confidencePartner = partner;
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${PARTIES[newGov].name} to govern with ${PARTIES[partner].shortName} support`,
    });
  } else {
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${PARTIES[newGov].name} to govern as a minority`,
    });
  }
}

/** seat a coalition partner in the governing cabinet, proportional to its seats:
 *  a small junior partner gets a couple of mid-rank secretaries (never a great
 *  office or the Chief Whip), a tiny 1–2 MP partner at most one (maybe none). */
/** the official opposition is the largest party NOT in the government bloc
 *  (governing party + any coalition partner). Refreshes the LO and shadow bench. */
function recomputeOpposition(state: GameState, rng: Rng): void {
  const ranked = (Object.entries(state.seats) as [PartyId, number][])
    .filter(([p, n]) =>
      p !== state.government.governingParty && p !== state.government.coalitionPartner &&
      p !== 'sf' && p !== 'spk' && p !== 'ind' && !!PARTIES[p] && (n ?? 0) > 0)
    .sort((a, b) => b[1] - a[1]);
  const opp = ranked[0]?.[0];
  // the current opposition is invalid if it has joined the government bloc, or if
  // the player is still flagged as LO despite no longer leading the opposition
  const oppInvalid = state.government.oppositionParty === state.government.governingParty
    || state.government.oppositionParty === state.government.coalitionPartner
    || state.government.loId === 'player';
  if (!opp) {
    // no eligible opposition party at all — don't strand the player as LO
    if (state.government.loId === 'player') {
      state.government.loId = '';
      // close the player's still-open LO tenure (recordLoChange('') no-ops)
      const last = state.loHistory?.[state.loHistory.length - 1];
      if (last && last.endDay === null) last.endDay = state.day;
    }
    return;
  }
  if (opp === state.government.oppositionParty && !oppInvalid) return;
  // resolve the new opposition leader BEFORE mutating oppositionParty: partyLeaderId
  // short-circuits `party === oppositionParty` and would just echo back the stale loId
  // (still the player). Reuse the opp party's existing leader, else mint a fresh one.
  let newLo = state.government.loId;
  if (state.government.loId === 'player' || state.characters[state.government.loId]?.partyId !== opp) {
    if (opp === state.player.partyId && playerIsLeader(state)) {
      // the player leads the largest opposition party (e.g. just after withdrawing from
      // a coalition) — they ARE the Leader of the Opposition again, not a minted NPC
      newLo = 'player';
    } else {
      const existing = Object.values(state.characters).find(
        (c) => c.active && c.partyId === opp && c.officeId === 'leader' && c.id !== 'player'
      );
      newLo = existing ? existing.id : newFrontbencher(state, rng, opp, 'leader').id;
    }
  }
  state.government.oppositionParty = opp;
  // the shadow bench now belongs to the new opposition party
  for (const post of state.government.shadowCabinet) {
    const h = state.characters[post.characterId];
    if (post.characterId !== 'player' && (!h || !h.active || h.partyId !== opp)) {
      if (h) { h.officeId = null; h.active = false; }
      post.characterId = newFrontbencher(state, rng, opp, post.officeId).id;
    }
  }
  state.government.loId = newLo;
  recordLoChange(state, state.government.loId);
}

/** seat the player-leader of a JUNIOR coalition partner: the senior party's leader
 *  becomes PM; the player keeps leading their party and takes a government overlay —
 *  Deputy PM if their party is significant (≥15 seats), otherwise a cabinet brief.
 *  In both cases the player sits in a government cabinet post (officeId stays
 *  'leader') and the opposition is recomputed to exclude the government bloc. */
export function seatPlayerJuniorPartner(state: GameState, rng: Rng, forceBrief = false): void {
  // the senior (governing) party's leader is Prime Minister
  const seniorLeader = partyLeaderId(state, rng, state.government.governingParty);
  if (state.government.pmId !== seniorLeader && seniorLeader !== 'player') {
    state.government.pmId = seniorLeader;
    state.government.pmSinceDay = state.day;
    recordPmChange(state, seniorLeader);
  }
  // a significant junior partner's leader becomes Deputy PM; a "junior post" deal
  // (forceBrief) is a department brief instead
  const deputy = (state.seats[state.player.partyId] ?? 0) >= 15 && !forceBrief;
  // a Deputy PM only takes a department ~half the time (Clegg-style otherwise); a
  // non-deputy junior partner always takes a brief
  const takeBrief = !deputy || rng.chance(0.5);
  let post: CabinetPost | undefined;
  if (takeBrief) {
    // seat the player in a government cabinet department (never a great office /
    // Chief Secretary / Chief Whip), keeping officeId 'leader'
    const candidates = state.government.cabinet.filter(
      (p) => p.characterId !== 'player' && OFFICES[p.officeId]?.department &&
        p.officeId !== 'chief_sec' && !GREAT_OFFICES.includes(p.officeId));
    post = candidates.length ? rng.pick(candidates)
      : state.government.cabinet.find((p) => OFFICES[p.officeId]?.department && p.characterId !== 'player');
    if (post) {
      const old = state.characters[post.characterId];
      if (old && old.id !== 'player') { old.officeId = null; old.active = true; }
      post.characterId = 'player';
    }
  }
  if (deputy) {
    state.government.deputyPmId = 'player';
    state.government.deputyTitle = 'dpm';
    state.player.flags._isDeputyPM = true;
    state.player.flags._everDeputyPM = true;
  } else {
    delete state.player.flags._isDeputyPM;
  }
  // hand the official opposition to the largest party outside the new government bloc
  recomputeOpposition(state, rng);
  // The player REMAINS their party's leader. The timeline shows that as the office span
  // ("Leader of [Party]"), with the government job (Deputy PM, or a department brief) on
  // the concurrent overlay track — so both read at once, regardless of party size.
  const leaderTitle = `Leader of the ${PARTIES[state.player.partyId].name}`;
  state.history.push({
    kind: 'roleChange', date: state.day, officeId: 'leader', how: 'continued',
    roleSide: 'gov', partyId: state.player.partyId, label: leaderTitle,
  });
  const govRole = deputy
    ? 'Deputy Prime Minister'
    : (post ? officeTitleFor(post.officeId, { inGovernment: true }) : playerOfficeTitle(state));
  state.history.push({ kind: 'deputyOverlay', date: state.day, action: 'start', label: govRole });
  if (!deputy) state.player.flags._govOverlayOpen = true; // the DPM case uses _isDeputyPM
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${state.player.name} becomes ${govRole} in coalition`,
  });
}

export function seatCoalitionCabinet(state: GameState, rng: Rng): void {
  const partner = state.government.coalitionPartner;
  if (state.government.arrangement !== 'coalition' || !partner) return;
  const govSeats = state.seats[state.government.governingParty] ?? 0;
  const partnerSeats = state.seats[partner] ?? 0;
  if (partnerSeats <= 0 || govSeats <= 0) return;
  const share = partnerSeats / (govSeats + partnerSeats);
  // base the partner's share on the distributable cabinet (territorial offices are
  // region-locked and never handed to a coalition partner)
  const distributable = CABINET_OFFICES.filter((id) => !OFFICES[id].region).length;
  let count = Math.min(Math.round(share * distributable), partnerSeats);
  if (partnerSeats <= 2) count = Math.min(count, 1);
  if (partnerSeats === 1 && rng.chance(0.5)) count = 0;
  if (count <= 0) return;
  // eligible posts: departmental secretaries that aren't great offices, held by
  // the governing party (not the player, not the Chief Whip)
  const eligible = rng.shuffle(state.government.cabinet.filter((p) =>
    p.characterId !== 'player' &&
    OFFICES[p.officeId]?.department && !GREAT_OFFICES.includes(p.officeId) &&
    state.characters[p.characterId]?.partyId === state.government.governingParty));
  for (const post of eligible.slice(0, count)) {
    const old = state.characters[post.characterId];
    if (old) { old.officeId = null; old.active = false; }
    post.characterId = newFrontbencher(state, rng, partner, post.officeId).id;
  }
}

/** End the coalition: the junior partner's ministers (including the player if they led
 *  the junior party) leave cabinet, those seats revert to the senior governing party,
 *  and the government drops to a normal minority (or majority if the senior party clears
 *  it alone) — with the standard vulnerability that implies, no bespoke danger. Generic:
 *  works whether the player is the senior PM, the junior leader, or uninvolved. */
export function dissolveCoalition(state: GameState, rng: Rng): void {
  const partner = state.government.coalitionPartner;
  if (state.government.arrangement !== 'coalition' || !partner) return;
  const gov = state.government.governingParty;
  for (const post of state.government.cabinet) {
    const holderParty = post.characterId === 'player'
      ? state.player.partyId
      : state.characters[post.characterId]?.partyId;
    if (holderParty === partner) {
      const old = state.characters[post.characterId];
      if (old && old.id !== 'player') { old.officeId = null; old.active = false; }
      post.characterId = newFrontbencher(state, rng, gov, post.officeId).id;
    }
  }
  // a Deputy PM drawn from the partner leaves with them
  if (state.government.deputyPmId && state.government.deputyPmId !== 'player') {
    const dep = state.characters[state.government.deputyPmId];
    if (dep?.partyId === partner) {
      state.government.deputyPmId = undefined;
      state.government.deputyTitle = undefined;
    }
  }
  state.government.coalitionPartner = undefined;
  const sfSeats = state.seats.sf ?? 0;
  const votingSeats = 650 - sfSeats - 1;
  const govSeats = state.seats[gov] ?? 0;
  state.government.majority = govSeats - (votingSeats - govSeats);
  state.government.arrangement = state.government.majority > 0 ? 'majority' : 'minority';
  // the former partner is no longer in the government bloc — it may now be the opposition
  recomputeOpposition(state, rng);
}

/** Player-initiated coalition exit. Junior partner → the player loses their government
 *  role and their party leaves cabinet (they stay party leader, and resume as Leader of
 *  the Opposition if their party is now the largest opposition). Senior PM → the player
 *  stays PM and the junior partner is dropped. Either way the government becomes a normal
 *  minority. */
export function withdrawFromCoalitionCore(state: GameState, rng: Rng): void {
  if (state.government.arrangement !== 'coalition') return;
  const isJunior = state.player.partyId === state.government.coalitionPartner;
  const isSenior = state.player.partyId === state.government.governingParty;
  if (!isJunior && !isSenior) return;
  const govParty = state.government.governingParty;

  if (isJunior) clearPlayerDeputyPM(state); // close the gov-role overlay; stays party leader
  dissolveCoalition(state, rng);

  if (isJunior) {
    // close the (now-ended) government-leader span and reopen an opposition-leader one
    const oppLabel = state.government.loId === 'player'
      ? 'Leader of the Opposition'
      : `Leader of the ${PARTIES[state.player.partyId].name}`;
    state.history.push({
      kind: 'roleChange', date: state.day, officeId: 'leader', how: 'continued',
      roleSide: 'opp', partyId: state.player.partyId, label: oppLabel,
    });
  }
  state.history.push({
    kind: 'event', date: state.day,
    headline: isJunior
      ? `${state.player.name} withdraws the ${PARTIES[state.player.partyId].name} from the coalition; ${PARTIES[govParty].name} governs as a minority`
      : `${state.player.name} ends the coalition; the ${PARTIES[govParty].name} government continues as a minority`,
  });
}

function settleNpcLeaderships(
  state: GameState,
  rng: Rng,
  prevGov: PartyId,
  newGov: PartyId,
  prevOpp: PartyId,
  result: ElectionResult,
  prevSeats: Partial<Record<PartyId, number>>
): void {
  const leaderOf = (party: PartyId): string =>
    party === state.government.governingParty ? state.government.pmId :
    party === state.government.oppositionParty ? state.government.loId : '';

  const changeOfGov = newGov !== prevGov;

  // an outgoing Prime Minister has become Leader of the Opposition. They usually
  // resign — but after a NARROW defeat may stay on to fight another day (a
  // "Harold Wilson"). After a heavy loss they always go.
  if (changeOfGov && leaderOf(prevGov) !== 'player') {
    const gap = (result.seats[newGov] ?? 0) - (result.seats[prevGov] ?? 0);
    const narrow = result.outcome !== 'majority' || gap < 60;
    const stayChance = narrow ? 0.22 : 0;
    if (!rng.chance(stayChance)) openLeadershipVacancy(state, rng, prevGov);
  }

  // a party that stayed in opposition (no change of government) changes its leader
  // often after the result — but a big advance, or denying the winner a majority,
  // earns the incumbent the benefit of the doubt
  if (!changeOfGov && prevOpp !== state.player.partyId && leaderOf(prevOpp) !== 'player') {
    const gained = (result.seats[prevOpp] ?? 0) - (prevSeats[prevOpp] ?? 0);
    let p = 0.6;
    if (gained > 30) p -= 0.45;
    else if (gained > 10) p -= 0.25;
    else if (gained < -10) p += 0.2;
    if (result.outcome !== 'majority') p -= 0.2; // denied them a majority — more credit
    if (rng.chance(clamp(p, 0.1, 0.92))) openLeadershipVacancy(state, rng, prevOpp);
  }

  // minor parties churn their leaders on a gentler performance gradient too:
  // a real advance buys credit, a heavy loss invites a challenge
  const oppParty = state.government.oppositionParty;
  for (const [p, seats] of Object.entries(result.seats) as [PartyId, number][]) {
    if (p === newGov || p === oppParty || p === state.player.partyId) continue;
    if (p === 'sf' || p === 'spk' || p === 'ind' || !PARTIES[p]) continue;
    const gained = seats - (prevSeats[p] ?? 0);
    let prob = 0.4;
    if (gained > 15) prob -= 0.32;
    else if (gained > 3) prob -= 0.2;
    else if (gained < -10) prob += 0.22;
    else if (gained < 0) prob += 0.08;
    if (rng.chance(clamp(prob, 0.05, 0.8))) openLeadershipVacancy(state, rng, p);
  }
}

// ---------- forced events: materialise & resolve ----------

export function materializeForced(state: GameState, rng: Rng, ev: ForcedEvent): DrawnCard {
  switch (ev.kind) {
    case 'reshuffleOffer': {
      const officeId = ev.payload?.officeId as OfficeId;
      const sideways = ev.payload?.sideways === true;
      const title = officeTitleFor(officeId, {
        inGovernment: playerInGovernmentBloc(state),
        minorPartyName: minorPartyNameOf(state),
      });
      const from = onMinorPartyTrack(state)
        ? `the ${PARTIES[state.player.partyId].shortName} leader's office`
        : playerInGovernment(state) ? 'Number 10' : "the Leader's office";
      // a sitting deputy may carry the title across to the new brief (the PM's call) —
      // decide it now and state it plainly, so the card and the outcome always agree
      const isDeputy = !!state.player.flags._isDeputyPM;
      const keepDeputy = isDeputy && deputyEligibleOffice(officeId) && pmKeepsDeputy(state, rng);
      const deputyLine = isDeputy
        ? (keepDeputy
          ? ` You would keep your post as ${deputyPrefix(state.government.deputyTitle)} alongside the new brief.`
          : ` Taking it means giving up your post as ${deputyPrefix(state.government.deputyTitle)}.`)
        : '';
      return {
        cardId: `forced_offer_${state.day}`,
        kind: 'reshuffleOffer',
        title: sideways ? 'A sideways glance' : 'The call',
        body: (sideways
          ? `${from === 'Number 10' ? 'Number 10' : 'The Leader\'s office'} rings with an unusual offer: same rank, new brief — ${title}. A fresh start, a fresh department to master, and a quiet test of your flexibility.`
          : `Your phone buzzes. It's ${from}. They want you as ${title}. The whips are waiting on your answer.`) + deputyLine,
        choices: [{ label: 'Accept the job' }, { label: 'Politely decline' }],
        payload: { officeId, advance: rng.int(7, 14), keepDeputy },
      };
    }
    case 'dismissal':
      return {
        cardId: `forced_dismissal_${state.day}`,
        kind: 'dismissal',
        title: 'The reshuffle',
        body: `The call comes early. "Thank you for your service," the voice says, "but the ${playerInGovernment(state) ? 'Prime Minister' : 'Leader'} is making changes." You are out.`,
        choices: [{ label: 'Go quietly and loyally' }, { label: 'Make your displeasure known' }],
        payload: { advance: rng.int(7, 14) },
      };
    case 'resignPrompt': {
      const reason = ev.payload?.reason as string;
      if (reason === 'electionDefeat') {
        return {
          cardId: `forced_resign_${state.day}`,
          kind: 'resignPrompt',
          title: 'After the defeat',
          body: 'The exit poll was right. The party has lost, and the cameras are outside your door asking the same question: will you resign the leadership?',
          choices: [{ label: 'Resign with dignity' }, { label: 'Fight on as leader' }],
          payload: { reason, advance: rng.int(7, 14) },
        };
      }
      if (reason === 'pledgeHonoured') {
        return {
          cardId: `forced_resign_${state.day}`,
          kind: 'resignPrompt',
          title: 'The day you promised',
          body: 'The date you named has arrived. The party has held its peace on the understanding that today you go. You could honour the pledge and leave with your reputation — or tear it up and try to cling on.',
          choices: [{ label: 'Stand down, as promised' }, { label: 'Break the pledge and fight on' }],
          payload: { reason, advance: rng.int(7, 14) },
        };
      }
      if (reason === 'scandal') {
        return {
          cardId: `forced_resign_${state.day}`,
          kind: 'resignPrompt',
          title: 'The reckoning',
          body: 'You have accepted the charge in public; now comes the act itself. The honourable thing is to lay down your office cleanly and let the story end — or you can defy the lot of them and cling on, daring the leadership to wield the knife.',
          choices: [{ label: 'Resign your office' }, { label: 'Cling on anyway' }],
          payload: { reason: 'scandal', advance: rng.int(7, 14) },
        };
      }
      return {
        cardId: `forced_resign_${state.day}`,
        kind: 'resignPrompt',
        title: 'A matter of principle',
        body: 'You cannot defend this policy. Your conscience, your inbox and your mentor all say the same thing. Resigning would cost you the job — and earn you something harder to buy.',
        choices: [{ label: 'Resign from the frontbench' }, { label: 'Swallow it and stay' }],
        payload: { reason: 'principle', advance: rng.int(7, 14) },
      };
    }
    case 'lostSeat':
      return {
        cardId: `forced_lostseat_${state.day}`,
        kind: 'lostSeat',
        title: 'The count',
        body: 'The returning officer reads the numbers and the room goes quiet. You have lost your seat. Outside, a journalist asks what you will do now.',
        choices: [{ label: 'Vow to win it back' }, { label: 'Retire from politics' }],
        payload: { advance: rng.int(14, 30) },
      };
    case 'leadershipStand': {
      const candidateIds = (ev.payload?.candidateIds as string[]) ?? [];
      const names = candidateIds.map((id) => characterName(state, id));
      const field = names.length >= 2
        ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} have already declared`
        : names.length === 1
          ? `${names[0]} has already declared`
          : 'Several heavyweights are circling';
      // if a senior friend owes you, you can cash that in to shore up your launch
      const favour = (state.player.favours ?? []).find(
        (f) => f.kind === 'ally' || f.kind === 'mentor' || f.kind === 'chiefWhip'
      );
      const choices = [{ label: 'Stand for leader' }];
      if (favour) {
        choices.push({
          label: `Call in ${characterName(state, favour.characterId)}'s favour — and stand`,
        });
      }
      choices.push({ label: 'Sit this one out' });
      return {
        cardId: `forced_stand_${state.day}`,
        kind: 'leadershipStand',
        title: 'The leadership is vacant',
        body: `The ${PARTIES[state.player.partyId].name} needs a new leader. ${field}, and the tea room is a hive of arithmetic. More than one colleague has glanced your way. Nomination papers close on Friday.`,
        choices,
        payload: { candidateIds, advance: rng.int(7, 14), ...(favour ? { favourKind: favour.kind } : {}) },
      };
    }
    case 'leadershipBallot': {
      const tallies = (ev.payload?.tallies as Record<string, number>) ?? {};
      const round = (ev.payload?.round as number) ?? 1;
      const finalRound = !!ev.payload?.finalRound;
      const justElim = (ev.payload?.justEliminated as { name: string; swungTo: string }[]) ?? [];
      const pass = { ...ev.payload, advance: rng.int(8, 14) };

      // a sorted "vote tally" readout of the surviving field, the player marked as "You".
      // counts are scaled so the whole field sums to the party's actual seats.
      const counts = seatProportionalTallies(tallies, state.seats[state.player.partyId] ?? 0);
      const ranked = Object.entries(tallies)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => ({ id, v: counts[id] ?? 0, name: id === 'player' ? 'You' : characterName(state, id) }));
      const readout = ranked.map((r) => `${r.name} ${r.v}`).join(' · ');
      const elimLine = justElim.length
        ? `${justElim.map((e) => `${e.name} falls, their backers swinging to ${e.swungTo}`).join('; ')}. `
        : '';

      if (finalRound) {
        const finalistName = characterName(state, ev.payload?.finalistId as string);
        return {
          cardId: `forced_ballot_final_${state.day}`, kind: 'leadershipBallot',
          title: `Members' ballot — you vs ${finalistName}`,
          body: `${elimLine}It is down to you and ${finalistName}, and now the whole party membership decides — this is won in the country, not the tea room. The hustings tour is done; the ballots are in the post. Your closing pitch to the members?`,
          choices: [
            { label: 'A barnstorming, emotional rally' },
            { label: 'Sober, detailed, prime-ministerial' },
            { label: 'Quietly promise jobs to waverers' },
          ],
          payload: pass,
        };
      }

      const myRank = ranked.findIndex((r) => r.id === 'player') + 1;
      const frontrunner = ranked.find((r) => r.id !== 'player')?.name ?? 'the frontrunner';
      const opener = round === 1
        ? 'The field is set and the first ballot of MPs is called. '
        : elimLine;
      return {
        cardId: `forced_ballot${round}_${state.day}`, kind: 'leadershipBallot',
        title: `Ballot ${round}`,
        body: `${opener}MPs declare — ${readout}. You sit ${ordinal(myRank)} of ${ranked.length}; ${frontrunner} leads. What is your move this round?`,
        choices: [
          { label: 'Work the parliamentary party' },
          { label: 'Court the members and the media' },
          { label: `Go after ${frontrunner}` },
        ],
        payload: pass,
      };
    }
    case 'leadershipBacking': {
      const survivors = (ev.payload?.survivors as string[]) ?? [];
      const strengths = (ev.payload?.strengths as Record<string, number>) ?? {};
      const round = (ev.payload?.round as number) ?? 1;
      // offer EVERY surviving contender to back, strongest first (cap generously)
      const backable = [...survivors]
        .sort((a, b) => (strengths[b] ?? 0) - (strengths[a] ?? 0))
        .slice(0, 8);
      const names = backable.map((id) => characterName(state, id));
      const field = names.length > 1
        ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
        : names[0] ?? 'the survivors';
      const body = round === 1
        ? `You are not in the running, but a leadership contest is a market in loyalty. ${field} are in the field. Whom do you get behind?`
        : `The field narrows to ${field}. A leader will emerge within days. Where do you throw your weight now?`;
      // each candidate's current position, so the player can tell the (procedurally
      // named) contenders apart when deciding whom to back
      const roleOf = (id: string): string | undefined => {
        const c = state.characters[id];
        if (!c) return undefined;
        const gov = state.government.governingParty, opp = state.government.oppositionParty;
        const minorName = c.partyId !== gov && c.partyId !== opp ? PARTIES[c.partyId].name : undefined;
        return officeTitleFor(c.officeId, { inGovernment: c.partyId === gov, minorPartyName: minorName });
      };
      // MP backing for each contender, scaled so the field sums to the party's seats —
      // the player reads who is likely to win while still seeing each candidate's role
      const party = (ev.payload?.party as PartyId) ?? state.player.partyId;
      const counts = seatProportionalTallies(strengths, state.seats[party] ?? 0);
      return {
        cardId: `forced_backing_${round}_${state.day}`,
        kind: 'leadershipBacking',
        title: `Leadership contest — ballot ${round}`,
        body,
        choices: backable.map((id) => {
          const role = roleOf(id);
          const n = counts[id] ?? 0;
          const mps = `${n} MP${n === 1 ? '' : 's'}`;
          return { label: `Back ${characterName(state, id)}`, sublabel: role ? `${role} · ${mps}` : mps };
        }),
        payload: { ...ev.payload, candidateIds: backable, advance: rng.int(7, 12) },
      };
    }
    case 'pmReshuffle': {
      const side = playerInGovernment(state) ? 'cabinet' : 'shadowCabinet';
      const posts = state.government[side].filter((p) =>
        p.characterId !== 'player' && state.characters[p.characterId]?.partyId === state.player.partyId);
      const members = posts
        .map((p) => state.characters[p.characterId])
        .filter((c): c is Character => Boolean(c));
      const weakest = [...members].sort((a, b) => a.competence - b.competence)[0];
      return {
        cardId: `forced_pmreshuffle_${state.day}`,
        kind: 'pmReshuffle',
        title: 'Reshuffle day',
        body: `The corridor outside your office contains, at various distances, hope, dread, and {rival} pretending to read their phone. The ${playerInGovernment(state) ? 'cabinet' : 'shadow cabinet'} is yours to remake — whose career do you make today, and whose do you end?`,
        choices: [
          { label: 'Promote your loyalists' },
          { label: 'Big tent — bring in your critics' },
          { label: weakest ? `Sack ${weakest.name} and refresh` : 'Refresh the weakest performers' },
        ],
        payload: { weakestId: weakest?.id, advance: rng.int(7, 14) },
      };
    }
    case 'pmPressure': {
      const severe = ev.payload?.severe === true;
      return {
        cardId: `forced_pmpressure_${state.day}`,
        kind: 'pmPressure',
        title: severe ? 'A vote of no confidence' : 'Your authority is questioned',
        body: severe
          ? 'It has come to this. Enough of your own MPs have put in letters to force a confidence vote, and the men and women in grey suits have been to see you. Tonight the parliamentary party decides whether you go on — and the numbers are genuinely too close to call.'
          : 'The mood has soured. The backbenches are restive, the papers scent blood, and a delegation of the awkward squad wants "a frank conversation". Your grip on the party needs reasserting, and quickly.',
        choices: [
          { label: 'Face down the rebels head-on' },
          { label: 'Reshuffle to reassert your grip' },
          { label: 'Offer concessions to buy peace' },
        ],
        payload: { severe, advance: rng.int(7, 14) },
      };
    }
    case 'resignPledge':
      return {
        cardId: `forced_pledge_${state.day}`,
        kind: 'resignPledge',
        title: 'The men in grey suits',
        body: 'A delegation of the party\'s most senior figures files into your office and shuts the door. They are not quite threatening you. They simply want a timetable: name a date to go, they suggest, and the knives go back in the drawer. For now.',
        choices: [
          { label: 'Pledge to stand down within the year' },
          { label: 'Refuse — I am going nowhere' },
          { label: 'Resign now, with dignity' },
        ],
        payload: { advance: rng.int(7, 14) },
      };
    case 'confidenceVote': {
      const broken = ev.payload?.broken === true;
      return {
        cardId: `forced_confidence_${state.day}`,
        kind: 'confidenceVote',
        title: 'A motion of no confidence',
        body: broken
          ? 'You broke your word, and the party has not forgiven it. The opposition tables a motion of no confidence and your own benches are ominously quiet. Tonight the House decides whether your government stands.'
          : 'The opposition has tabled a motion of no confidence, and without a majority the arithmetic is brutal. Every vote must be whipped, every waverer found. Lose, and the government falls — and the country votes.',
        choices: [
          { label: 'Whip every loyalist mercilessly' },
          { label: 'Buy off the waverers with concessions' },
          { label: 'Dare them — tie it to a dissolution' },
        ],
        payload: { broken, advance: rng.int(7, 14) },
      };
    }
    case 'partyCoup': {
      const broken = ev.payload?.broken === true;
      return {
        cardId: `forced_coup_${state.day}`,
        kind: 'partyCoup',
        title: 'The heave',
        body: broken
          ? 'Your broken promise hangs over everything. The plotters no longer bother to hide; they have the names, the numbers and the nerve. A formal leadership challenge is lodged.'
          : 'It has been coming for weeks. A bloc of your own MPs has organised, the letters are in, and a stalking-horse challenger has emerged. To survive you must out-organise the organised.',
        choices: [
          { label: 'Face down the plotters' },
          { label: 'Reshuffle the team to reassert grip' },
          { label: 'Concede a policy review to the rebels' },
        ],
        payload: { broken, advance: rng.int(7, 14) },
      };
    }
    case 'coalitionTalks': {
      // every compatible partner the player can choose from (largest first); older
      // saves may still carry a single partnerId
      const partners = (ev.payload?.partners as PartyId[] | undefined)
        ?? (ev.payload?.partnerId ? [ev.payload.partnerId as PartyId] : []);
      const names = partners.map((p) => PARTIES[p].name);
      const balance = names.length === 0 ? 'no one will deal'
        : names.length === 1 ? `${names[0]} hold the balance`
          : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} could each hold the balance`;
      const choices = partners.map((p) => ({ label: `Form a full coalition with the ${PARTIES[p].shortName}` }));
      if (partners.length > 0) {
        choices.push({ label: `Confidence-and-supply with the ${PARTIES[partners[0]].shortName}` });
      }
      choices.push({ label: 'Govern alone as a minority' });
      return {
        cardId: `forced_coalitiontalks_${state.day}`,
        kind: 'coalitionTalks',
        title: 'A hung parliament',
        body: `Nobody has a majority. As leader of the largest party you have first go at forming a government, and ${balance} — at a price. Your options run from a formal coalition to going it alone and daring the House to stop you.`,
        choices,
        payload: { partners, advance: rng.int(7, 14) },
      };
    }
    case 'coalitionOffer': {
      const majorParty = ev.payload?.majorParty as PartyId | undefined;
      const majorName = majorParty ? PARTIES[majorParty].name : 'the largest party';
      const canCompete = ev.payload?.canCompete === true;
      const choices = [
        { label: 'Demand senior cabinet seats' },
        { label: 'A focused policy win and a junior post' },
        { label: 'Confidence-and-supply only' },
        { label: 'Stay out — pure opposition' },
      ];
      // when the result is close, the runner-up can refuse and try to govern instead
      if (canCompete) choices.push({ label: 'Refuse — try to form your own government' });
      return {
        cardId: `forced_coalitionoffer_${state.day}`,
        kind: 'coalitionOffer',
        title: 'Holding the balance',
        body: `The numbers are extraordinary: your party holds the balance of power. ${majorName} cannot govern without you, and their negotiators are already on the phone. How hard do you push?`,
        choices,
        payload: {
          majorParty, advance: rng.int(7, 14), canCompete,
          shortfall: ev.payload?.shortfall, partySeats: ev.payload?.partySeats,
          majorSeats: ev.payload?.majorSeats,
        },
      };
    }
    case 'pmHeave': {
      const pmName = state.characters[state.government.pmId]?.name ?? 'the Prime Minister';
      const frontbench = playerTier(state) >= 1;
      return {
        cardId: `forced_pmheave_${state.day}`,
        kind: 'pmHeave',
        title: 'The PM is wounded',
        body: `${pmName} is on the ropes — dire polls, worse headlines, and the corridors thick with plotting. Colleagues are quietly sounding you out. Do you move against your own leader?`,
        choices: frontbench
          ? [{ label: 'Resign and call for the PM to go' }, { label: 'Stay loyal — for now' }]
          : [{ label: 'Submit a letter of no confidence' }, { label: 'Keep your head down' }],
        payload: { advance: rng.int(7, 14) },
      };
    }
    case 'campaign': {
      const step = (ev.payload?.step as number) ?? 1;
      const isLeader = ev.payload?.leader === true;
      if (isLeader) {
        const defending = playerInGovernment(state);
        const stages: { title: string; body: string; choices: string[] }[] = [
          {
            title: 'The campaign grid',
            body: `Parliament is dissolved and this election is yours to win or lose — ${defending ? 'your record, your government, your name on the door' : 'your one shot at the door of Number 10'}. Your strategists want the shape of the whole campaign decided tonight. What is the grid?`,
            choices: ['A relentless message discipline', 'Big rallies and momentum', 'Rapid rebuttal — fight every story'],
          },
          {
            title: 'The manifesto launch',
            body: 'Launch day. The cameras are set and the manifesto goes to the printers tonight. What kind of offer are you putting to the country?',
            choices: ['A bold, transformative offer', 'Safety first — small targets, no hostages', "Steal the other side's best clothes", 'Bet it all on one giant uncosted pledge'],
          },
          {
            title: 'The TV debate',
            body: 'Tonight: the head-to-head debate, live, eight million watching. Your prep team offers three strategies and warns that campaigns have died on this stage.',
            choices: ['Attack from the first answer', 'Statesmanlike — rise above it', 'Land the rehearsed zinger', "Go personal — shred their character"],
          },
          {
            title: 'The wobble',
            body: 'Mid-campaign crisis: a candidate suspended over old posts, a costing that doesn\'t add up, and a poll showing the gap moving the wrong way. The morning press conference is in nine hours. The room looks at you.',
            choices: ['Own it — apologise and act fast', 'Brazen it out, change the subject', 'Counter-attack with opposition research', 'Blame the media and refuse to engage'],
          },
          {
            title: 'The battleground blitz',
            body: 'Ten days left. The bus can only be in one place at a time, and the spreadsheet people are fighting about where. Your call, leader.',
            choices: ['Shore up the heartlands', 'Raid their marginals', 'Gamble on the unlikely new coalition', 'Coast — the lead will hold itself'],
          },
          {
            title: 'The final broadcast',
            body: 'Election eve. One last party broadcast, one last message the country sleeps on before it votes. Everything you have done has led to this single piece of communication.',
            choices: ['Fear — the other lot will ruin everything', 'Hope — paint the better morning', 'Competence — boring, reliable, ready'],
          },
          {
            title: 'Get out the vote',
            body: 'Polling day. The campaign is over; now it is logistics and nerve. Where do you throw the final hours of activist energy?',
            choices: ['Knock every door in the marginals', 'A dawn-to-dusk media blitz', 'Trust the machine and project calm'],
          },
        ];
        const stage = stages[step - 1] ?? stages[0];
        return {
          cardId: `forced_leadercampaign_${step}_${state.day}`,
          kind: 'campaign',
          title: stage.title,
          body: stage.body,
          choices: stage.choices.map((label) => ({ label })),
          payload: { step, leader: true, advance: rng.int(7, 10) },
        };
      }
      const bodies = [
        'Parliament is dissolved and the battle bus is fuelled. Where do you spend the first week of the campaign?',
        'Mid-campaign. The national picture is volatile and your association chair is nervous. What is the focus?',
        'The final week. Everything aches and nobody is sleeping. One last push — where?',
      ];
      return {
        cardId: `forced_campaign_${step}_${state.day}`,
        kind: 'campaign',
        title: `The campaign — week ${step === 1 ? 'one' : step === 2 ? 'three' : 'six'}`,
        body: bodies[step - 1] ?? bodies[0],
        choices: [
          { label: 'Pound the streets at home' },
          { label: 'Tour the airwaves for the party' },
          { label: 'Quietly rest and fundraise' },
        ],
        payload: { step, advance: rng.int(12, 16) },
      };
    }
    case 'budget': {
      const step = (ev.payload?.step as number) ?? 1;
      const chancellor = state.player.officeId === 'sos_treasury' && !playerIsPM(state);
      const stages: { title: string; body: string; choices: string[] }[] = [
        {
          title: 'Budget day — the centrepiece',
          body: `The red box is yours${chancellor ? ', Chancellor' : ''}. There is a little headroom this year, and where you spend it will define the Budget — and you. What is the centrepiece?`,
          choices: ['Into the NHS and schools', 'Tax cuts for working people', 'Infrastructure and green jobs', 'Defence and security'],
        },
        {
          title: 'Paying for it',
          body: 'Every giveaway needs a source, and the watchdog will mark your homework live on the news. How do you fund it?',
          choices: ['Borrow against future growth', 'Tax the wealthy and big business', 'Find the savings elsewhere'],
        },
        {
          title: 'The despatch box',
          body: 'An hour at the despatch box, the House baying, the country half-listening over lunch. How do you deliver it?',
          choices: ['A barnstorming, political statement', 'Sober, total command of the detail'],
        },
      ];
      const stage = stages[step - 1] ?? stages[0];
      return {
        cardId: `forced_budget_${step}_${state.day}`,
        kind: 'budget',
        title: stage.title,
        body: stage.body,
        choices: stage.choices.map((label) => ({ label })),
        payload: { step, advance: rng.int(5, 9) },
      };
    }
    case 'pmqs': {
      const step = (ev.payload?.step as number) ?? 1;
      const oppId = playerInGovernment(state) ? state.government.loId : state.government.pmId;
      const oppName = characterName(state, oppId);
      const oppRole = playerInGovernment(state) ? 'the Leader of the Opposition' : 'the Prime Minister';
      if (step === 1) {
        return {
          cardId: `forced_pmqs1_${state.day}`,
          kind: 'pmqs',
          title: 'Prime Minister\'s Questions',
          body: `Noon on Wednesday. The benches are packed and ${oppName}, ${oppRole}, is on their feet across the despatch box. You have six questions and the whole country clipping the best ten seconds. What is your line of attack?`,
          choices: [
            { label: 'Hammer them on the economy' },
            { label: 'Make it about the NHS' },
            { label: 'Expose their party\'s splits' },
            { label: 'Spring a prepared trap' },
          ],
          payload: { step, advance: rng.int(3, 6) },
        };
      }
      return {
        cardId: `forced_pmqs2_${state.day}`,
        kind: 'pmqs',
        title: 'The comeback',
        body: `${oppName} hits back hard, and the House erupts. The next exchange decides who walks away with the win. How do you respond?`,
        choices: [
          { label: 'Rise above it — statesmanlike' },
          { label: 'Counterpunch, no mercy' },
          { label: 'Defuse it with a joke' },
        ],
        payload: { step, advance: rng.int(3, 6) },
      };
    }
    case 'conference': {
      const step = (ev.payload?.step as number) ?? 1;
      const stages: { title: string; body: string; choices: string[] }[] = [
        {
          title: 'Conference — the leader\'s speech',
          body: 'The hall is full, the autocue loaded, the cameras live. An hour to set the tone for the year. How do you pitch it?',
          choices: ['A unifying, one-nation note', 'A radical, agenda-setting speech', 'A combative attack on your opponents'],
        },
        {
          title: 'The big announcement',
          body: 'Every conference speech needs its headline — the line that leads the bulletins. What is yours?',
          choices: ['A bold new pledge', 'A careful, costed offer', 'A sharp dividing line'],
        },
        {
          title: 'The delivery',
          body: 'The peroration. The hall is on the edge of its seats and the whole speech turns on how you land these final minutes.',
          choices: ['Build to a rousing crescendo', 'Measured and prime-ministerial'],
        },
      ];
      const stage = stages[step - 1] ?? stages[0];
      return {
        cardId: `forced_conference_${step}_${state.day}`,
        kind: 'conference',
        title: stage.title,
        body: stage.body,
        choices: stage.choices.map((label) => ({ label })),
        payload: { step, advance: rng.int(5, 9) },
      };
    }
    case 'wilderness': {
      // a single decision that stands in for the whole spell out of Parliament:
      // jump the clock to the next general-election window (the scheduler queues the
      // campaign before it would draw another wilderness card), so the player isn't
      // re-prompted every few months. continueCore advances polling across the jump.
      const toElection = Math.max(150, (state.nextElectionBy - 60) - state.day + rng.int(1, 20));
      return {
        cardId: `forced_wilderness_${state.day}`,
        kind: 'wilderness',
        title: 'Life outside',
        body: 'Civilian life is quieter. The constituency association keeps you on as their candidate, and you will not see the inside of the Commons again until the country next goes to the polls. How do you spend the wilderness years?',
        choices: [
          { label: 'Keep your profile up locally' },
          { label: 'Earn money and lie low' },
        ],
        payload: { advance: toElection },
      };
    }
    case 'deputyPmOffer': {
      const pmName = state.characters[state.government.pmId]?.name ?? 'the Prime Minister';
      return {
        cardId: `forced_deputypm_${state.day}`,
        kind: 'deputyPmOffer',
        title: 'Number 10 calls',
        body: `${pmName} wants to see you alone. The offer, when it comes, is the one every senior minister dreams of: to serve as the government's number two — Deputy Prime Minister and First Secretary, deputising at PMQs, chairing Cabinet in the PM's absence. It is a vote of total confidence. It also makes you the obvious successor, which not everyone will love.`,
        choices: [{ label: 'Accept — become the deputy' }, { label: 'Decline, with thanks' }],
        payload: { advance: rng.int(7, 14) },
      };
    }
    case 'deputyRemoval': {
      const pmName = state.characters[state.government.pmId]?.name ?? 'the Prime Minister';
      const dep = deputyPrefix(state.government.deputyTitle);
      const briefTitle = state.player.officeId ? OFFICES[state.player.officeId]?.title : undefined;
      // mostly a demotion to your own department; occasionally a clean-out of the cabinet
      const sacked = rng.chance(0.25);
      return {
        cardId: `forced_deputyremoval_${state.day}`,
        kind: 'deputyRemoval',
        title: 'Number 10 reshuffles its number two',
        body: sacked
          ? `${pmName} has decided to move you on. You are relieved of the post of ${dep} — and of the cabinet altogether. The car will not be coming tomorrow.`
          : `${pmName} has decided to refresh the top team. You lose the post of ${dep}, though you keep${briefTitle ? ` your department as ${briefTitle}` : ' your departmental brief'}. A demotion dressed up as continuity.`,
        choices: [{ label: 'Accept with grace' }, { label: 'Make your displeasure known' }],
        payload: { advance: rng.int(7, 14), sacked },
      };
    }
    case 'speakerContest': {
      const incumbent = !!state.player.flags._isSpeaker;
      return {
        cardId: `forced_speaker_${state.day}`,
        kind: 'speakerContest',
        title: incumbent ? 'Re-electing the Speaker' : 'The election of the Speaker',
        body: incumbent
          ? 'A new parliament has assembled, and the House must decide whether to keep you in the Chair. The convention favours a sitting Speaker, but you still need the House to carry you. Do you put yourself forward again?'
          : 'Before any other business, the House must elect its Speaker — the impartial referee of the Commons, who gives up party allegiance for the authority of the Chair. To win you would need the respect of all sides: a record of scrupulous integrity and a serious public profile. Do you let your name go forward?',
        choices: [
          { label: incumbent ? 'Seek re-election to the Chair' : 'Stand for Speaker' },
          { label: 'Stay on the benches' },
        ],
        payload: { advance: rng.int(7, 14) },
      };
    }
    case 'committeeChairContest': {
      const incumbent = ev.payload?.incumbent === true;
      const dept = (ev.payload?.dept as DepartmentId) ?? 'treasury';
      const name = COMMITTEE_NAMES[dept];
      return {
        cardId: `forced_committee_${state.day}`,
        kind: 'committeeChairContest',
        title: incumbent ? `Re-electing the ${name} Committee Chair` : `The ${name} Committee chairmanship`,
        body: incumbent
          ? `A new parliament means a fresh ballot for the chair of the ${name} Select Committee. Colleagues across the House have valued your scrutiny — but the post is in the gift of MPs, and you must stand again. Put your name forward?`
          : `The chair of the ${name} Select Committee is vacant, and it is elected by the whole House. It is a prize for a respected backbencher: a platform to scrutinise the government, summon ministers, and build a reputation independent of the front bench. Do you stand?`,
        choices: [
          { label: incumbent ? 'Seek re-election as Chair' : 'Stand for the chairmanship' },
          { label: 'Stay on the benches' },
        ],
        payload: { dept, incumbent, advance: rng.int(7, 14) },
      };
    }
    case 'calendar':
    case 'electionNight':
      // produced/handled by the scheduler, not here
      throw new Error(`${ev.kind} events are not materialised by career.ts`);
  }
}

export function resolveForcedChoice(
  state: GameState,
  rng: Rng,
  card: DrawnCard,
  choiceIndex: number
): { text: string; deltas: StatDelta[] } {
  const deltas: StatDelta[] = [];
  const push = (label: string, delta: number) => deltas.push({ label, delta });
  // apply a stat change through the diminishing-returns curve and report the
  // effective amount (positives shrink near the ceiling; negatives apply in full)
  const gain = (key: keyof GameState['player']['stats'], delta: number, label: string) => {
    const applied = gainStat(state, key, delta);
    if (applied !== 0) push(label, applied);
  };

  switch (card.kind) {
    case 'reshuffleOffer': {
      const officeId = card.payload?.officeId as OfficeId;
      if (choiceIndex === 0) {
        const promoted = OFFICES[officeId].tier > playerTier(state);
        giveOffice(state, rng, officeId, promoted ? 'promoted' : 'appointed', card.payload?.keepDeputy === true);
        gain('partyStanding', 6, 'Standing');
        gain('profile', 8, 'Profile');
        const title = officeTitleFor(officeId, {
          inGovernment: playerInGovernmentBloc(state),
          minorPartyName: minorPartyNameOf(state),
        });
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} appointed ${title}`,
        });
        return {
          text: `You say yes before they finish the sentence. By evening your name is on the door: ${title}. The red box (or at least the lanyard) arrives tomorrow.`,
          deltas,
        };
      }
      adjustRelationship(state, 'leader', -8);
      push('Leader', -8);
      gain('integrity', 3, 'Integrity');
      return {
        text: 'You decline, claiming family reasons. The silence on the line lasts a beat too long. Some colleagues call it principled; the leader\'s office calls it something else.',
        deltas,
      };
    }

    case 'dismissal': {
      stripOffice(state, rng, 'dismissed');
      if (choiceIndex === 0) {
        adjustRelationship(state, 'leader', 6);
        push('Leader', 6);
        gain('partyStanding', 3, 'Standing');
        return {
          text: 'You thank them for the opportunity and wish your successor well. The graceful exit is noted in the right places. There is always another reshuffle.',
          deltas,
        };
      }
      adjustRelationship(state, 'leader', -12);
      push('Leader', -12);
      gain('profile', 7, 'Profile');
      gain('partyStanding', -4, 'Standing');
      return {
        text: 'Your "friends" brief every lobby journalist in the building by lunchtime. The story runs for three days. The leadership will remember — but so will the public.',
        deltas,
      };
    }

    case 'resignPrompt': {
      const reason = card.payload?.reason as string;
      if (reason === 'electionDefeat') {
        if (choiceIndex === 0) {
          state.player.officeId = null;
          state.history.push({
            kind: 'roleChange', date: state.day, officeId: null, how: 'resigned',
          });
          gain('integrity', 5, 'Integrity');
          resolveNpcLeadership(state, rng, state.player.partyId);
          return {
            text: 'You resign at a lectern in the rain, as tradition demands. History will be kinder than this morning\'s front pages.',
            deltas,
          };
        }
        gain('partyStanding', -12, 'Standing');
        adjustRelationship(state, 'rival', -10);
        return {
          text: 'You fight on. Half the party admires the steel; the other half begins counting letters of no confidence.',
          deltas,
        };
      }
      if (reason === 'pledgeHonoured') {
        if (choiceIndex === 0) {
          // honour the timetable — a dignified, scheduled exit
          const party = state.player.partyId;
          state.player.officeId = null;
          state.player.officeSinceDay = null;
          state.history.push({ kind: 'roleChange', date: state.day, officeId: null, how: 'resigned' });
          state.history.push({
            kind: 'event', date: state.day,
            headline: `${state.player.name} stands down as promised`,
          });
          gain('integrity', 6, 'Integrity');
          gain('partyStanding', 4, 'Standing');
          resolveNpcLeadership(state, rng, party);
          return {
            text: 'You keep your word and go on schedule, with a valedictory that even your enemies call gracious. Honouring the pledge costs you the job — and buys you a reputation that outlasts it.',
            deltas,
          };
        }
        // renege — break the pledge: stats collapse and a challenge is now certain
        gain('partyStanding', -18, 'Standing');
        gain('integrity', -15, 'Integrity');
        gain('profile', -6, 'Profile');
        applyPollingShock(state, state.player.partyId, -1.5);
        state.forcedQueue.unshift({
          kind: playerIsPM(state) ? 'confidenceVote' : 'partyCoup',
          payload: { broken: true },
        });
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} breaks pledge to stand down`,
        });
        return {
          text: 'You tear up your own timetable and announce you are staying after all. The betrayal is total and the reaction immediate: your party turns on you, and a formal challenge is already being lodged.',
          deltas,
        };
      }
      if (reason === 'scandal') {
        if (choiceIndex === 0) {
          stripOffice(state, rng, 'resigned');
          gain('integrity', 4, 'Integrity');
          state.history.push({
            kind: 'event', date: state.day,
            headline: `${state.player.name} resigns over the scandal`,
          });
          return {
            text: 'You take responsibility and lay down your office. Painful — but the story finally has its ending, and your integrity survives the wreckage.',
            deltas,
          };
        }
        // cling on anyway — severe, and now a marked minister living on borrowed time
        gain('partyStanding', -18, 'Standing');
        gain('profile', -12, 'Profile');
        gain('integrity', -10, 'Integrity');
        adjustRelationship(state, 'leader', -16);
        push('Leader', -16);
        applyPollingShock(state, state.player.partyId, -1);
        state.player.flags._scandalExposed = state.day + 365;
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} refuses to resign amid scandal`,
        });
        return {
          text: 'You refuse to go. The leadership says nothing in public and sharpens its knives in private. You are a marked minister now, and everyone in the building knows it.',
          deltas,
        };
      }
      // principle
      if (choiceIndex === 0) {
        stripOffice(state, rng, 'resigned');
        adjustRelationship(state, 'leader', -10);
        push('Leader', -10);
        gain('integrity', 8, 'Integrity');
        gain('profile', 6, 'Profile');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} resigns on principle`,
        });
        return {
          text: 'Your resignation letter is quoted on every channel by six. The backbenches greet you like a returning soldier. The leader\'s office does not.',
          deltas,
        };
      }
      gain('integrity', -6, 'Integrity');
      adjustRelationship(state, 'leader', 4);
      push('Leader', 4);
      return {
        text: 'You stay. The policy passes. You avoid mirrors for a few days, but the leader notices the loyalty.',
        deltas,
      };
    }

    case 'lostSeat': {
      if (choiceIndex === 0) {
        state.player.hasSeat = false;
        state.player.officeId = null;
        return {
          text: 'You give a gracious speech and promise the count is not the end. The association adopts you again as their candidate. The wilderness years begin.',
          deltas,
        };
      }
      state.gameOver = { reason: 'lostSeat', legacy: buildLegacy(state) };
      return {
        text: 'You thank the constituency for the years and step away. Politics will carry on without you — it always does.',
        deltas,
      };
    }

    case 'leadershipStand': {
      const candidateIds = (card.payload?.candidateIds as string[]) ?? [];
      const sitOutIndex = card.choices.length - 1;
      if (choiceIndex !== sitOutIndex) {
        // the player's MP support reflects their standing (tier, Deputy-PM), computed
        // BEFORE resigning the office to stand
        let playerTally = Math.round(leadershipBaseSupport(state));
        // cashing in a favour from a senior friend gives a real launch boost
        const usingFavour = choiceIndex === 1 && !!card.payload?.favourKind;
        let favourName = '';
        if (usingFavour) {
          const kind = card.payload!.favourKind as RelationshipKind;
          const fi = (state.player.favours ?? []).findIndex((f) => f.kind === kind);
          if (fi >= 0) {
            favourName = characterName(state, state.player.favours[fi].characterId);
            state.player.favours.splice(fi, 1);
          }
          playerTally += 12;
          push('Support', 12);
        }
        // a frontbencher resigns their post to mount a challenge — win or lose,
        // they are no longer in the cabinet/shadow cabinet during the contest
        if (state.player.officeId && !playerIsLeader(state)) {
          stripOffice(state, rng, 'resigned');
          state.history.push({
            kind: 'event', date: state.day,
            headline: `${state.player.name} resigns from the front bench to stand for the leadership`,
          });
        }
        // seed one tally table: the player plus every rival on a shared MP-support scale.
        // The contest then plays out dynamically — one (or more) eliminated per ballot.
        const tallies: Record<string, number> = { player: playerTally };
        for (const id of candidateIds) {
          if (state.characters[id]) {
            tallies[id] = Math.round(rivalTallyFrom(rivalStrengthOf(state.characters[id], rng)));
          }
        }
        state.forcedQueue.unshift({
          kind: 'leadershipBallot',
          payload: { tallies, round: 1, fieldSize: candidateIds.length, justEliminated: [] },
        });
        gain('profile', 6, 'Profile');
        return {
          text: usingFavour && favourName
            ? `${favourName} makes the calls they promised, and a bloc of waverers swings behind you before you have even declared. You launch from a position of strength.`
            : 'You declare outside Parliament with your allies arranged behind you like a protective wall. The longest fortnight in politics begins.',
          deltas,
        };
      }
      // not standing — but you won't sit on your hands: get behind a candidate,
      // round by round, and the new leader will remember which side you took
      startBacking(state, rng, state.player.partyId, candidateIds);
      return {
        text: 'You decide not to run. But a leadership contest is a market in loyalty, and you mean to be a buyer — whom do you get behind?',
        deltas,
      };
    }

    case 'leadershipBallot': {
      const tallies = { ...((card.payload?.tallies as Record<string, number>) ?? {}) };
      const round = (card.payload?.round as number) ?? 1;
      const finalRound = !!card.payload?.finalRound;
      const fieldSize = (card.payload?.fieldSize as number) ?? 3;

      const recordLoss = () => {
        state.history.push({
          kind: 'leadershipContest', date: state.day, won: false, partyId: state.player.partyId,
        });
        state.player.flags._contestLossDay = state.day;
        state.player.flags._contestLosses =
          (((state.player.flags._contestLosses as number) ?? 0) + 1);
      };

      // ---- the members' ballot: decided on PUBLIC appeal, not MP support ----
      if (finalRound) {
        const finalist = state.characters[card.payload?.finalistId as string];
        let change = 0;
        if (choiceIndex === 0) change = rng.int(-6, 16);        // rally: high variance
        if (choiceIndex === 1) change = rng.int(2, 10);         // steady, statesmanlike
        if (choiceIndex === 2) { change = rng.int(4, 12); gain('integrity', -4, 'Integrity'); }
        const s = state.player.stats;
        // grassroots appeal: profile leads, then competence/approval/integrity — NOT party standing
        const memberAppeal =
          0.34 * s.profile + 0.22 * s.competence + 0.18 * s.constituencyApproval + 0.12 * s.integrity + 8;
        const playerFinal = 0.7 * memberAppeal + 0.3 * (tallies.player ?? 50) + change + rng.normal(0, 6);
        const finalistComp = finalist ? finalist.competence : 60;
        const finalistAppeal = 0.6 * finalistComp + (finalist ? rivalStrengthOf(finalist, rng) - 0.6 * finalistComp : 0) + 18;
        // a bigger field leaves a more fractured membership and a stronger
        // "anyone-but-the-frontrunner" coalition behind the runner-up
        const finalistFinal =
          0.7 * finalistAppeal + 0.3 * (tallies[finalist?.id ?? ''] ?? 45) + (fieldSize - 3) * 2.5 + rng.normal(0, 7);

        // a small (~5%) edge tips the closest contests the player's way
        if (playerFinal * 1.08 >= finalistFinal && playerFinal >= LEADERSHIP_WIN_THRESHOLD) {
          makePlayerLeader(state, rng);
          gain('profile', 15, 'Profile');
          gain('partyStanding', 10, 'Standing');
          if (finalist) {
            const rivalRel = state.relationships.find((r) => r.kind === 'rival');
            if (rivalRel) { rivalRel.characterId = finalist.id; rivalRel.value = -15; }
          }
          const leaderRole = playerLeaderRole(state);
          const closer = leaderRole === 'pm'
            ? 'You are the leader of the party — and Prime Minister.'
            : leaderRole === 'lo'
              ? 'You are the leader of the party — and Leader of the Opposition.'
              : `You are the leader of the ${PARTIES[state.player.partyId].name}.`;
          return {
            text: `The returning officer reads the membership's verdict${finalist ? ` — and ${finalist.name}'s face tells the room before the words do` : ''}. You have won. ${closer}`,
            deltas,
          };
        }
        recordLoss();
        resolveNpcLeadership(state, rng, state.player.partyId, finalist?.id);
        gain('profile', 8, 'Profile');
        gain('partyStanding', -6, 'Standing');
        const winnerNm = characterName(state, getRelationship(state, 'leader')?.characterId);
        return {
          text: `So close. The members give it to ${winnerNm} on the final ballot. Your concession speech is, everyone agrees, leadership material — which stings.`,
          deltas,
        };
      }

      // ---- an elimination ballot (MPs voting) ----
      let change = 0; let flavour = '';
      if (choiceIndex === 0) { change = 3 + rng.int(0, 6); flavour = 'You work the corridors; wavering MPs feel courted.'; }
      else if (choiceIndex === 1) { change = rng.int(-3, 12); flavour = change > 3 ? 'A commanding media and membership week.' : 'The membership warms to you; some MPs sniff populism.'; }
      else {
        // go after the frontrunner: risky — dent them, or it rebounds on you
        const frontId = Object.entries(tallies).filter(([id]) => id !== 'player')
          .sort((a, b) => b[1] - a[1])[0]?.[0];
        if (rng.chance(0.55)) {
          change = 5 + rng.int(0, 6);
          if (frontId) tallies[frontId] -= 4 + rng.int(0, 5);
          flavour = 'You land blows on the frontrunner and climb at their expense.';
        } else {
          change = -4 - rng.int(0, 5);
          flavour = 'The attack looks desperate; it rebounds on you.';
        }
      }
      tallies.player = (tallies.player ?? 50) + change;
      if (change !== 0) push('Support', Math.round(change));
      // a little campaign drift for every rival
      for (const id of Object.keys(tallies)) if (id !== 'player') tallies[id] += rng.normal(0, 4);

      // eliminate the lowest (more at once for a big field); the player is held to a
      // slightly higher bar (PRE_FINAL_HANDICAP) so they fall before the last two more often
      const effTally = (id: string) => (tallies[id] ?? 0) - (id === 'player' ? PRE_FINAL_HANDICAP : 0);
      const order = Object.keys(tallies).sort((a, b) => effTally(a) - effTally(b));
      const drop = Math.min(dropCountFor(order.length), order.length - 2);
      const eliminated = order.slice(0, drop);

      if (eliminated.includes('player')) {
        // knocked out — endorse a survivor for the rest of the contest (kingmaker)
        recordLoss();
        const survivors = Object.keys(tallies)
          .filter((id) => id !== 'player' && !eliminated.includes(id) && state.characters[id]?.active);
        startBacking(state, rng, state.player.partyId, survivors);
        gain('profile', 2, 'Profile');
        return {
          text: `${flavour} It is not enough — you are knocked out at ballot ${round}, your support draining to stronger names. But the contest goes on, and your endorsement is suddenly worth having. Whom do you get behind?`,
          deltas,
        };
      }

      // swing each eliminated rival's backers (mostly to the frontrunner, partly to you)
      const justEliminated: { name: string; swungTo: string }[] = [];
      for (const id of eliminated) {
        const pot = Math.max(0, tallies[id] ?? 0);
        delete tallies[id];
        const frontId = Object.entries(tallies).filter(([k]) => k !== 'player')
          .sort((a, b) => b[1] - a[1])[0]?.[0];
        const pShare = clamp(0.18 + rng.next() * 0.34, 0.1, 0.55);
        tallies.player += pot * pShare;
        if (frontId) tallies[frontId] += pot * (1 - pShare);
        justEliminated.push({
          name: characterName(state, id),
          swungTo: pShare > 0.45 ? 'you' : characterName(state, frontId ?? ''),
        });
      }

      // advance: another elimination ballot, the members' final, or a walkover
      const remaining = Object.keys(tallies);
      if (remaining.length > 2) {
        state.forcedQueue.unshift({
          kind: 'leadershipBallot',
          payload: { tallies, round: round + 1, fieldSize, justEliminated },
        });
        return { text: `${flavour} The field narrows.`, deltas };
      }
      const finalistId = remaining.find((id) => id !== 'player');
      if (finalistId) {
        state.forcedQueue.unshift({
          kind: 'leadershipBallot',
          payload: { tallies, round: round + 1, finalRound: true, finalistId, fieldSize, justEliminated },
        });
        return { text: `${flavour} You are through to the membership ballot.`, deltas };
      }
      // every rival fell — an unopposed coronation
      makePlayerLeader(state, rng);
      gain('profile', 12, 'Profile');
      return { text: `${flavour} Your last rival withdraws — you are elected unopposed.`, deltas };
    }

    case 'leadershipBacking': {
      const party = card.payload?.party as PartyId;
      const survivors = [...((card.payload?.survivors as string[]) ?? [])];
      const strengths = { ...((card.payload?.strengths as Record<string, number>) ?? {}) };
      const backing = { ...((card.payload?.backing as Record<string, number>) ?? {}) };
      const backable = (card.payload?.candidateIds as string[]) ?? survivors;
      const round = (card.payload?.round as number) ?? 1;
      const chosen = backable[choiceIndex];

      // tally: a buff to the backed candidate, a SMALLER debuff to the rest, so
      // backing is recoverable (switch and the new pick's buffs offset old debuffs)
      const BACK_GAIN = 12, BACK_LOSS = 5;
      if (chosen) {
        backing[chosen] = (backing[chosen] ?? 0) + BACK_GAIN;
        for (const id of survivors) if (id !== chosen) backing[id] = (backing[id] ?? 0) - BACK_LOSS;
      }
      const chosenName = chosen ? characterName(state, chosen) : 'no one';

      // kingmaker: a small, seniority-scaled lift to the player's pick — tilts but
      // never decides the contest
      const king = 2 + (state.player.stats.partyStanding > 60 ? 3 : 0) + (playerTier(state) >= 4 ? 2 : 0);
      const eff = (id: string) => (strengths[id] ?? 0) + (id === chosen ? king : 0);

      // knock out the weakest survivor
      let remaining = [...survivors];
      if (remaining.length > 2) {
        const weakest = remaining.reduce((a, b) => (eff(a) <= eff(b) ? a : b));
        remaining = remaining.filter((id) => id !== weakest);
        // drop the eliminated candidate from the tallies so next round's MP counts
        // re-apportion the party's seats over the SURVIVORS only — their backers
        // redistribute, and the displayed totals still sum to the party's seats
        delete strengths[weakest];
        delete backing[weakest];
      }

      if (remaining.length > 2) {
        state.forcedQueue.unshift({
          kind: 'leadershipBacking',
          payload: { party, survivors: remaining, strengths, backing, round: round + 1 },
        });
        return {
          text: `You get behind ${chosenName}. The weakest hopeful drops away as the votes are counted, and the contest moves to another ballot.`,
          deltas,
        };
      }

      // the final two go to the membership (or a single survivor walks it)
      let winnerId: string;
      if (remaining.length === 2) {
        const [a, b] = remaining;
        winnerId = eff(a) + rng.normal(0, 7) >= eff(b) + rng.normal(0, 7) ? a : b;
      } else {
        winnerId = remaining[0];
      }

      resolveNpcLeadership(state, rng, party, winnerId);

      if (party === state.player.partyId) {
        // the new leader's warmth reflects how loyally the player backed them
        const rel = getRelationship(state, 'leader');
        if (rel && rel.characterId === winnerId) {
          rel.value = clamp(rel.value + (backing[winnerId] ?? 0), -100, 100);
        }
        // realise the tally against any tracked relationship that was in the field
        for (const kind of ['rival', 'ally', 'mentor'] as RelationshipKind[]) {
          const r = getRelationship(state, kind);
          if (r && r.characterId !== winnerId && backing[r.characterId] !== undefined) {
            adjustRelationship(state, kind, Math.round((backing[r.characterId] as number) * 0.5));
          }
        }
      }

      const winnerName = characterName(state, winnerId);
      const backedWinner = (backing[winnerId] ?? 0) > 0;
      gain('partyStanding', backedWinner ? 3 : -1, 'Standing');
      return {
        text: backedWinner
          ? `${winnerName} takes the crown — and remembers, warmly, that you were on the right side. A friend at the top is worth a great deal.`
          : `${winnerName} takes the crown. You backed the other horse, and the new leader knows it. There are fences to mend.`,
        deltas,
      };
    }

    case 'pmReshuffle': {
      const inGov = playerInGovernment(state);
      const side = inGov ? 'cabinet' : 'shadowCabinet';
      const party = state.player.partyId;
      // a coalition partner's ministers are theirs to keep — don't reshuffle them
      const posts = state.government[side].filter((p) =>
        p.characterId !== 'player' && state.characters[p.characterId]?.partyId === party);
      const titleOf = (officeId: OfficeId) =>
        inGov ? OFFICES[officeId].title : OFFICES[officeId].shadowTitle;
      const headline = (text: string) =>
        state.history.push({ kind: 'event', date: state.day, headline: text });

      const text = (() => {
        if (choiceIndex === 0) {
          // loyalists in, competence be damned
          for (const post of rng.shuffle(posts).slice(0, 2)) {
            const old = state.characters[post.characterId];
            if (old) old.officeId = null;
            const fresh = newFrontbencher(state, rng, party, post.officeId);
            fresh.competence = Math.round(clamp(rng.normal(50, 8), 30, 75));
            fresh.traits = ['loyal', rng.chance(0.5) ? 'dull' : 'fixer'];
            post.characterId = fresh.id;
            headline(`${fresh.name}, a close ${state.player.name} ally, appointed ${titleOf(post.officeId)}`);
          }
          adjustRelationship(state, 'ally', 8);
          adjustRelationship(state, 'rival', -6);
          push('Ally', 8);
          push('Rival', -6);
          gain('partyStanding', 3, 'Standing');
          applyPollingShock(state, party, -0.2);
          return 'The team around the table is now unmistakably yours — government by people who answer your texts. The sketch writers reach for "chumocracy"; the excluded factions retreat to the tearoom to begin the long, patient work of resenting you.';
        }
        if (choiceIndex === 1) {
          // big tent: bring in talented critics
          const post = rng.shuffle(posts)[0];
          if (post) {
            const old = state.characters[post.characterId];
            if (old) old.officeId = null;
            const critic = newFrontbencher(state, rng, party, post.officeId);
            critic.competence = Math.round(clamp(rng.normal(66, 8), 50, 90));
            critic.traits = ['ambitious', rng.chance(0.5) ? 'maverick' : 'principled'];
            post.characterId = critic.id;
            headline(`${critic.name}, a prominent internal critic, brought into the fold as ${titleOf(post.officeId)}`);
          }
          adjustRelationship(state, 'rival', 8);
          push('Rival', 8);
          gain('integrity', 3, 'Integrity');
          applyPollingShock(state, party, 0.2);
          return 'You hand your critics serious jobs, on the ancient theory about tents and the direction of urination. The commentariat calls it confident; the appointees, disarmed and slightly suspicious, start being useful.';
        }
        // sack the weakest, promote talent
        const weakest = state.characters[card.payload?.weakestId as string];
        const weakPost = weakest ? posts.find((p) => p.characterId === weakest.id) : undefined;
        if (weakest && weakPost) {
          weakest.officeId = null;
          const fresh = newFrontbencher(state, rng, party, weakPost.officeId);
          fresh.competence = Math.round(clamp(rng.normal(68, 7), 55, 92));
          weakPost.characterId = fresh.id;
          headline(`${weakest.name} sacked; rising star ${fresh.name} appointed ${titleOf(weakPost.officeId)}`);
        }
        const backfire = rng.chance(0.3);
        applyPollingShock(state, party, backfire ? -0.2 : 0.35);
        gain('competence', 2, 'Competence');
        if (backfire) {
          adjustRelationship(state, 'rival', -4);
          push('Rival', -4);
          return `${weakest?.name ?? 'The departed minister'} does not go quietly: a wounded interview on the Sunday shows, a pointed resignation letter "released to friends". The refresh was right — the handling, the papers agree, was not.`;
        }
        return 'Ruthless, swift, and — crucially — correct. The commentators call it a government with renewed purpose, and the new appointment is hailed as inspired. Somewhere, your old mentor smiles at the headlines.';
      })();

      // a PM remaking the cabinet may add, drop or move their deputy
      if (inGov) reshuffleNpcDeputyPm(state, rng);
      return { text, deltas };
    }

    case 'pmPressure': {
      const severe = card.payload?.severe === true;
      const s = state.player.stats;
      let strength = 0.4 * s.partyStanding + 0.3 * s.profile + 0.3 * s.integrity;
      let text = '';
      if (choiceIndex === 0) {
        // face them down — high variance, the brave/foolish move
        strength += rng.chance(0.5) ? 13 : -9;
        gain('profile', 3, 'Profile');
        text = 'You walk into the committee corridor with no notes and dare them to move against you in person.';
      } else if (choiceIndex === 1) {
        // reshuffle to reassert grip — steady
        strength += 6;
        gain('partyStanding', 2, 'Standing');
        text = 'You move the deckchairs with conviction, handing jobs to the wavering and the dangerous alike.';
      } else {
        // concessions — reliable but costly to your standing as a conviction PM
        strength += 10;
        gain('integrity', -4, 'Integrity');
        gain('partyStanding', 3, 'Standing');
        text = 'You give ground: a U-turn here, a select-committee chair there. Unlovely, and effective.';
      }
      const bar = (severe ? 80 : 58) + rng.normal(0, 6);
      if (strength + rng.normal(0, 6) >= bar) {
        applyPollingShock(state, state.player.partyId, severe ? 0.3 : 0.5);
        state.player.rebellionCount = Math.max(0, state.player.rebellionCount - 1);
        state.history.push({
          kind: 'event', date: state.day,
          headline: severe
            ? `${state.player.name} survives a confidence vote`
            : `${state.player.name} faces down a party revolt`,
        });
        return { text: `${text} You survive — bruised and diminished, but still in Number 10.`, deltas };
      }
      // forced out: the party turns and an NPC successor takes over
      const party = state.player.partyId;
      state.player.officeId = null;
      state.history.push({ kind: 'roleChange', date: state.day, officeId: null, how: 'resigned' });
      state.history.push({
        kind: 'event', date: state.day,
        headline: `${state.player.name} is forced out as Prime Minister`,
      });
      gain('profile', 4, 'Profile');
      resolveNpcLeadership(state, rng, party);
      return {
        text: `${text} It is not enough. The numbers are against you; you resign at the despatch box rather than be dragged out, and watch a colleague take the keys to Number 10.`,
        deltas,
      };
    }

    case 'campaign': {
      if (card.payload?.leader === true) {
        return resolveLeaderCampaignChoice(state, rng, card, choiceIndex, deltas, push);
      }
      // an MP's campaign runs ~5% harder: the gains that protect a seat are
      // shaved a little, so a marginal is marginally harder to hold.
      if (choiceIndex === 0) {
        gain('constituencyApproval', 5 * 0.95, 'Approval');
        return { text: 'Doorstep by doorstep, you shore up the home vote. Your agent stops looking quite so haunted.', deltas };
      }
      if (choiceIndex === 1) {
        gain('profile', 4 * 0.95, 'Profile');
        gain('partyStanding', 3 * 0.95, 'Standing');
        gain('constituencyApproval', -2, 'Approval');
        applyPollingShock(state, state.player.partyId, 0.4 * 0.95);
        return { text: 'You become a fixture of the morning rounds. The party is grateful; your constituency notices your absence.', deltas };
      }
      gain('competence', 2 * 0.95, 'Competence');
      return { text: 'You sleep, you fundraise, you plan. Unfashionable, effective.', deltas };
    }

    case 'budget': {
      const step = (card.payload?.step as number) ?? 1;
      const own = state.player.partyId;
      if (step === 1) {
        if (choiceIndex === 0) {
          gain('profile', 3, 'Profile'); gain('partyStanding', 2, 'Standing');
          applyPollingShock(state, own, 1.2);
          return { text: 'You make public services the story of the Budget. The wards and the staffrooms cheer; the question of who pays waits for the next page.', deltas };
        }
        if (choiceIndex === 1) {
          gain('profile', 4, 'Profile'); gain('competence', -1, 'Competence');
          applyPollingShock(state, own, 1.5);
          return { text: 'You put money back in pay packets, and the headline writes itself. Crowd-pleasing — and a hostage to the deficit you have just deepened.', deltas };
        }
        if (choiceIndex === 2) {
          gain('competence', 3, 'Competence'); gain('profile', 2, 'Profile');
          applyPollingShock(state, own, 0.8);
          return { text: 'You bet on the long game: roads, rail, grids and green jobs. The serious commentators nod; the dividend, like the concrete, takes years to set.', deltas };
        }
        gain('competence', 2, 'Competence'); gain('partyStanding', 2, 'Standing');
        return { text: 'You put defence and security first. Sober, statesmanlike, and a signal to your own benches about what you take seriously.', deltas };
      }
      if (step === 2) {
        if (choiceIndex === 0) {
          gain('competence', -2, 'Competence'); applyPollingShock(state, own, 0.6);
          return { text: 'You borrow against future growth. The giveaways land today; the bond market reserves judgement, and reserves the right to send a bill later.', deltas };
        }
        if (choiceIndex === 1) {
          gain('partyStanding', 3, 'Standing'); gain('competence', -1, 'Competence');
          applyPollingShock(state, own, 0.8);
          return { text: 'You ask the broadest shoulders to carry more. Your side roars approval; a few well-connected phones start ringing in the City.', deltas };
        }
        gain('competence', 4, 'Competence'); gain('constituencyApproval', -2, 'Approval');
        applyPollingShock(state, own, -0.8);
        return { text: 'You find the savings elsewhere — quiet cuts, no fanfare. Fiscally credible, politically thankless, and somebody, somewhere, is now worse off.', deltas };
      }
      // step 3 — the despatch box. Only the Chancellor's name goes on the headline.
      if (state.player.officeId === 'sos_treasury' && playerInGovernment(state)) {
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} delivers the Budget`,
        });
      }
      if (choiceIndex === 0) {
        gain('profile', 4, 'Profile'); applyPollingShock(state, own, 0.6);
        return { text: 'You deliver it as theatre — jokes, traps, the lot. The clips fly and your benches wave their order papers like a cup final.', deltas };
      }
      gain('competence', 4, 'Competence'); gain('partyStanding', 2, 'Standing');
      return { text: 'You deliver it as a master of the detail, every figure at your fingertips. No fireworks — just the unmistakable sound of someone who has done the work.', deltas };
    }

    case 'pmqs': {
      const step = (card.payload?.step as number) ?? 1;
      const own = state.player.partyId;
      if (step === 1) {
        gain('profile', 3, 'Profile');
        applyPollingShock(state, own, 0.4);
        const texts = [
          'You go in hard on the economy, reeling off the numbers that sting. They have an answer, but not a good one, and the benches behind you bay.',
          'You make it about the NHS, and the human story behind the statistic. The chamber quietens; even the other side knows this one lands.',
          'You prise open the splits in their party, and watch them squirm trying not to name names. A direct hit, gleefully received behind you.',
          'You spring the prepared trap, and they walk straight into it. The gasp-then-roar is the sweetest sound in the building.',
        ];
        return { text: texts[choiceIndex] ?? texts[0], deltas };
      }
      // step 2 — the verdict
      if (choiceIndex === 0) {
        gain('partyStanding', 3, 'Standing'); gain('integrity', 1, 'Integrity');
        return { text: 'You refuse to be dragged into the mud and look like the only adult in the room. The sketch-writers, for once, are kind.', deltas };
      }
      if (choiceIndex === 1) {
        gain('profile', 3, 'Profile'); gain('integrity', -1, 'Integrity');
        applyPollingShock(state, own, 0.5);
        return { text: 'You counterpunch without mercy and the clip does numbers all afternoon. Brutal, effective, and not entirely fair — which is rather the point.', deltas };
      }
      gain('profile', 2, 'Profile'); gain('partyStanding', 1, 'Standing');
      return { text: 'You defuse the whole thing with a joke that actually lands. Even the opposition front bench cracks a reluctant smile. You walk out the winner.', deltas };
    }

    case 'conference': {
      const step = (card.payload?.step as number) ?? 1;
      const own = state.player.partyId;
      if (step === 1) {
        if (choiceIndex === 0) {
          gain('partyStanding', 3, 'Standing');
          return { text: 'You strike a unifying, one-nation note, reaching past the hall to the country. The wets love it; the true believers want more red meat.', deltas };
        }
        if (choiceIndex === 1) {
          gain('profile', 4, 'Profile'); applyPollingShock(state, own, 0.5);
          return { text: 'You go radical, setting the agenda rather than chasing it. Bold — and a gift to every interviewer asking how you will pay for it.', deltas };
        }
        gain('profile', 3, 'Profile'); gain('partyStanding', -1, 'Standing');
        return { text: 'You come out swinging at your opponents, and the hall loves a fight. Energising for the faithful, a touch tribal for everyone watching at home.', deltas };
      }
      if (step === 2) {
        if (choiceIndex === 0) {
          gain('profile', 3, 'Profile'); applyPollingShock(state, own, 1.0);
          return { text: 'You make a bold new pledge, and the hall is on its feet. The bulletins lead on it — now you have a year to make it real.', deltas };
        }
        if (choiceIndex === 1) {
          gain('competence', 3, 'Competence'); gain('partyStanding', 2, 'Standing');
          return { text: 'You unveil a careful, costed offer. Less applause in the room, more respect in the morning papers — the trade of the serious politician.', deltas };
        }
        gain('profile', 3, 'Profile'); applyPollingShock(state, own, 0.6);
        return { text: 'You draw a sharp dividing line and dare the other side to cross it. Clarifying and combative — exactly the row you wanted.', deltas };
      }
      // step 3 — the delivery and the verdict
      state.history.push({
        kind: 'event', date: state.day,
        headline: `${state.player.name} addresses the party conference`,
      });
      if (choiceIndex === 0) {
        gain('profile', 4, 'Profile'); gain('partyStanding', 3, 'Standing');
        applyPollingShock(state, own, 0.8);
        state.player.flags._conferenceTriumph = state.day;
        return { text: 'You build to a rousing crescendo and the hall rises as one, the ovation rolling on past the autocue. A speech they will still be quoting at Christmas.', deltas };
      }
      gain('competence', 4, 'Competence'); gain('partyStanding', 2, 'Standing');
      return { text: 'You deliver it measured and prime-ministerial, every beat in its place. No roof lifted — but nobody doubts who is in charge.', deltas };
    }

    case 'wilderness': {
      // a single choice now covers the whole parliament out of office, so the
      // effect is scaled up from the old per-6-month values
      if (choiceIndex === 0) {
        gain('constituencyApproval', 12, 'Approval');
        return { text: 'Years of fetes, food banks, and the local radio breakfast show. People remember who keeps showing up — and the road back runs through them.', deltas };
      }
      gain('profile', -5, 'Profile');
      return { text: 'Consultancy pays better than Parliament ever did. You bank it and bide your time, slipping quietly out of the national picture.', deltas };
    }

    case 'resignPledge': {
      if (choiceIndex === 0) {
        // pledge a departure date — buys breathing room; enforced by the scheduler
        state.player.flags._pledgeResignBy = state.day + rng.int(240, 400);
        gain('integrity', 2, 'Integrity');
        state.player.rebellionCount = Math.max(0, state.player.rebellionCount - 1);
        applyPollingShock(state, state.player.partyId, 0.3);
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} signals they will stand down within the year`,
        });
        return {
          text: 'You give them a date — vague, but a date. The knives go back in the drawer and the noise subsides. You have bought time. The clock, however, is now running.',
          deltas,
        };
      }
      if (choiceIndex === 1) {
        // refuse — escalate to a confidence vote (PM) or a leadership challenge (otherwise)
        gain('partyStanding', -6, 'Standing');
        state.forcedQueue.unshift({ kind: playerIsPM(state) ? 'confidenceVote' : 'partyCoup' });
        return {
          text: 'You tell them where to put their timetable. The room empties in silence, and within hours the briefing war begins. A formal challenge is now only a matter of time — days, not weeks.',
          deltas,
        };
      }
      // resign now, on your own terms
      const party = state.player.partyId;
      state.player.officeId = null;
      state.player.officeSinceDay = null;
      state.history.push({ kind: 'roleChange', date: state.day, officeId: null, how: 'resigned' });
      state.history.push({
        kind: 'event', date: state.day,
        headline: `${state.player.name} resigns the leadership`,
      });
      gain('integrity', 4, 'Integrity');
      resolveNpcLeadership(state, rng, party);
      return {
        text: 'You go now, at a lectern of your choosing, while you can still write the headline rather than become it. The party murmurs that it was, in the end, rather dignified.',
        deltas,
      };
    }

    case 'confidenceVote': {
      const broken = card.payload?.broken === true;
      const s = state.player.stats;
      let strength = 0.4 * s.partyStanding + 0.3 * s.profile + 0.3 * s.competence;
      const arr = state.government.arrangement;
      if (arr === 'coalition') strength += 6;
      else if (arr === 'supplyConfidence') strength += 2;
      else if (arr === 'minority') strength -= 8;
      else strength += 10;
      let text = '';
      if (choiceIndex === 0) {
        strength += rng.chance(0.5) ? 12 : -8;
        gain('profile', 2, 'Profile');
        text = 'You whip the vote as if your life depends on it, because it does.';
      } else if (choiceIndex === 1) {
        strength += 9;
        gain('integrity', -4, 'Integrity');
        gain('partyStanding', 2, 'Standing');
        text = 'Concessions fly out of the door: a review here, a carve-out there, a peerage hinted at.';
      } else {
        strength += rng.chance(0.55) ? 14 : -6;
        text = 'You tie the motion to a dissolution — vote me down and we all face the voters.';
      }
      const bar = (broken ? 92 : 74) + rng.normal(0, 6);
      if (strength + rng.normal(0, 6) >= bar) {
        applyPollingShock(state, state.player.partyId, 0.3);
        state.player.rebellionCount = Math.max(0, state.player.rebellionCount - 1);
        state.player.flags._coupCooldownUntil = state.day + rng.int(180, 360);
        if ((arr === 'coalition' || arr === 'supplyConfidence') && rng.chance(0.5)) {
          gain('partyStanding', -3, 'Standing'); // the partner exacts a price for its votes
        }
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name}'s government survives a confidence vote`,
        });
        return { text: `${text} The government survives the division — by a margin that will be argued over for weeks.`, deltas };
      }
      // government falls → the country goes to the polls (player fights it as leader)
      gain('profile', 3, 'Profile');
      state.nextElectionBy = state.day; // scheduler queues the general election on the next step
      state.history.push({
        kind: 'event', date: state.day,
        headline: `${state.player.name}'s government loses a confidence vote`,
      });
      return {
        text: `${text} It is not enough. The motion carries; your government has fallen and Parliament is dissolved. You will fight the election as leader — but the country has the last word now.`,
        deltas,
      };
    }

    case 'partyCoup': {
      const broken = card.payload?.broken === true;
      const s = state.player.stats;
      let strength = 0.4 * s.partyStanding + 0.3 * s.profile + 0.3 * s.competence;
      let text = '';
      if (choiceIndex === 0) {
        strength += rng.chance(0.5) ? 12 : -8;
        gain('profile', 2, 'Profile');
        text = 'You confront the ringleaders in person and dare them to put up or shut up.';
      } else if (choiceIndex === 1) {
        strength += 7;
        gain('partyStanding', 2, 'Standing');
        text = 'You reshuffle the top team, binding rivals in with jobs and shared blame.';
      } else {
        strength += 9;
        gain('integrity', -3, 'Integrity');
        text = 'You hand the rebels a policy review and a seat at the table. Unlovely, but it splits them.';
      }
      const bar = (broken ? 90 : 66) + rng.normal(0, 6);
      if (strength + rng.normal(0, 6) >= bar) {
        state.player.rebellionCount = Math.max(0, state.player.rebellionCount - 1);
        state.player.flags._coupCooldownUntil = state.day + rng.int(180, 360);
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} sees off a leadership challenge`,
        });
        return { text: `${text} When the votes are counted you have held on. The plotters melt away — for now.`, deltas };
      }
      const party = state.player.partyId;
      state.player.officeId = null;
      state.player.officeSinceDay = null;
      state.history.push({ kind: 'roleChange', date: state.day, officeId: null, how: 'resigned' });
      state.history.push({
        kind: 'event', date: state.day,
        headline: `${state.player.name} is ousted as leader`,
      });
      gain('profile', 3, 'Profile');
      resolveNpcLeadership(state, rng, party);
      return {
        text: `${text} It is not enough. The challenge succeeds; you stand aside and watch a rival take the leadership. The backbenches await — and, perhaps, a road back.`,
        deltas,
      };
    }

    case 'coalitionTalks': {
      const partners = (card.payload?.partners as PartyId[] | undefined)
        ?? (card.payload?.partnerId ? [card.payload.partnerId as PartyId] : []);
      // choices: [coalition with each partner...], [C&S with the largest], [minority]
      if (choiceIndex < partners.length) {
        const partnerId = partners[choiceIndex];
        state.government.arrangement = 'coalition';
        state.government.coalitionPartner = partnerId;
        delete state.government.confidencePartner;
        seatCoalitionCabinet(state, rng);
        recomputeOpposition(state, rng); // opposition = largest party outside the new bloc
        gain('partyStanding', -6, 'Standing');
        gain('integrity', -3, 'Integrity');
        state.player.rebellionCount += 1;
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${PARTIES[state.player.partyId].name} forms a coalition with the ${PARTIES[partnerId].shortName}`,
        });
        return {
          text: `You strike the deal: ${PARTIES[partnerId].name} take seats around the cabinet table and a slice of the programme. Your purists are appalled — but the government has a working majority and room to breathe.`,
          deltas,
        };
      }
      if (choiceIndex === partners.length && partners.length > 0) {
        const partnerId = partners[0];
        state.government.arrangement = 'supplyConfidence';
        state.government.confidencePartner = partnerId;
        delete state.government.coalitionPartner;
        gain('partyStanding', -2, 'Standing');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${PARTIES[state.player.partyId].name} to govern with ${PARTIES[partnerId].shortName} confidence-and-supply`,
        });
        return {
          text: `${PARTIES[partnerId].name} agree to keep you in office vote by vote, in return for a handful of promises. Government on a short leash — but government.`,
          deltas,
        };
      }
      state.government.arrangement = 'minority';
      delete state.government.coalitionPartner;
      delete state.government.confidencePartner;
      gain('profile', 3, 'Profile');
      state.history.push({
        kind: 'event', date: state.day,
        headline: `${PARTIES[state.player.partyId].name} to govern as a minority`,
      });
      return {
        text: 'You decide to govern alone and dare the House to bring you down. The bold choice, and the fragile one: every vote is now a test of survival.',
        deltas,
      };
    }

    case 'coalitionOffer': {
      const majorParty = card.payload?.majorParty as PartyId | undefined;
      const shortfall = (card.payload?.shortfall as number) ?? 10;
      const partySeats = (card.payload?.partySeats as number) ?? 10;
      const s = state.player.stats;
      const leverage = Math.min(1.5, shortfall / Math.max(1, partySeats));
      if (choiceIndex === 0) {
        // demand senior seats — the hard, high-reward path
        const score = 30 * leverage + 0.3 * s.competence + 0.3 * s.profile + rng.normal(0, 10);
        if (score >= 55) {
          state.government.arrangement = 'coalition';
          state.government.coalitionPartner = state.player.partyId;
          delete state.government.confidencePartner;
          seatCoalitionCabinet(state, rng);
          seatPlayerJuniorPartner(state, rng);
          gain('profile', 10, 'Profile');
          gain('partyStanding', -4, 'Standing');
          state.history.push({
            kind: 'event', date: state.day,
            headline: `${PARTIES[state.player.partyId].name} enters coalition; ${state.player.name} takes a senior government role`,
          });
          return {
            text: 'You drive a hard bargain and win it: your party enters government with seats around the cabinet table, and you take a senior post at its heart. From the wilderness to Whitehall in a single afternoon.',
            deltas,
          };
        }
        gain('partyStanding', -4, 'Standing');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `Coalition talks with ${PARTIES[state.player.partyId].name} collapse`,
        });
        return {
          text: `You overplay your hand. ${majorParty ? PARTIES[majorParty].shortName : 'The larger party'} walks away to cut a deal elsewhere — or to dare the House alone. Your activists wanted purity anyway; now they have it.`,
          deltas,
        };
      }
      if (choiceIndex === 1) {
        // junior post + policy win — safer, smaller
        state.government.arrangement = 'coalition';
        state.government.coalitionPartner = state.player.partyId;
        delete state.government.confidencePartner;
        seatCoalitionCabinet(state, rng);
        seatPlayerJuniorPartner(state, rng, true); // junior post → a cabinet brief
        gain('partyStanding', -2, 'Standing');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${PARTIES[state.player.partyId].name} joins a coalition government`,
        });
        return {
          text: 'You settle for a real win on your signature issue and a foot inside government. Modest, deliverable — and more than your party has had in a generation.',
          deltas,
        };
      }
      if (choiceIndex === 2) {
        state.government.arrangement = 'supplyConfidence';
        state.government.confidencePartner = state.player.partyId;
        delete state.government.coalitionPartner;
        gain('integrity', 3, 'Integrity');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${PARTIES[state.player.partyId].name} agrees confidence-and-supply`,
        });
        return {
          text: 'You keep your hands clean and your independence intact: support on the big votes in return for concessions, but no ministerial cars. Your members can still look themselves in the mirror.',
          deltas,
        };
      }
      if (choiceIndex === 3) {
        // decline — but the largest party isn't stuck: it turns to another partner,
        // falling back to a minority only if nobody else will deal
        gain('partyStanding', 2, 'Standing');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${PARTIES[state.player.partyId].name} declines to prop up a government`,
        });
        if (majorParty) {
          const other = pickCoalitionPartner({ seats: state.seats }, rng, majorParty, state.player.partyId);
          formNpcGovernment(state, rng, majorParty, other);
        }
        return {
          text: 'You stay out of it entirely. Let the big parties own the mess; you will hold them to account from the cleanliness of opposition.',
          deltas,
        };
      }
      // choiceIndex >= 4: refuse the deal and try to form your OWN government. The
      // largest party normally prevails; a near-tie and real standing give a chance.
      {
        const majorSeats = (card.payload?.majorSeats as number) ?? (partySeats + 40);
        const gap = Math.max(0, majorSeats - partySeats);
        const closeness = clamp(1 - gap / 60, 0, 1);
        const standing = (s.partyStanding + s.profile) / 200;
        const p = clamp(0.05 + 0.08 * closeness + 0.05 * standing, 0.04, 0.25);
        if (rng.chance(p)) {
          playerSeizesGovernment(state, rng);
          gain('profile', 14, 'Profile');
          gain('partyStanding', 8, 'Standing');
          return {
            text: 'Against the odds, you out-manoeuvre them. By nightfall it is your name the Palace calls — a minority government, precarious and yours. The largest party is left fuming on the opposition benches.',
            deltas,
          };
        }
        gain('partyStanding', -3, 'Standing');
        if (majorParty) {
          const other = pickCoalitionPartner({ seats: state.seats }, rng, majorParty, state.player.partyId);
          formNpcGovernment(state, rng, majorParty, other);
        }
        return {
          text: `You gamble everything on forming a government of your own — and fall short. ${majorParty ? PARTIES[majorParty].shortName : 'The largest party'} stitches together the numbers first, and you are left to lead the opposition to it.`,
          deltas,
        };
      }
    }

    case 'pmHeave': {
      if (choiceIndex === 0) {
        const res = callForPmResignationCore(state, rng);
        return { text: res.text, deltas };
      }
      adjustRelationship(state, 'leader', 3);
      push('Leader', 3);
      return {
        text: 'You stay your hand and let others wield the knife. Whatever happens to the PM, the leadership notes who held firm.',
        deltas,
      };
    }

    case 'deputyPmOffer': {
      if (choiceIndex === 0) {
        state.player.flags._isDeputyPM = true;
        state.player.flags._everDeputyPM = true;
        // becoming deputy displaces any incumbent — there is only ever one
        state.government.deputyPmId = 'player';
        state.government.deputyTitle = rng.chance(0.67) ? 'dpm' : 'firstSec';
        // open the concurrent overlay span on the profile timeline (alongside the brief)
        state.history.push({
          kind: 'deputyOverlay', date: state.day, action: 'start', title: state.government.deputyTitle,
        });
        gain('partyStanding', 8, 'Standing');
        gain('profile', 10, 'Profile');
        adjustRelationship(state, 'leader', 6);
        push('Leader', 6);
        const title = playerOfficeTitle(state);
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} appointed ${title}`,
        });
        return {
          text: `You accept. By the evening bulletin you are the government's number two — ${title}. The red box feels heavier, and the corridor watches you differently now.`,
          deltas,
        };
      }
      adjustRelationship(state, 'leader', -3);
      push('Leader', -3);
      gain('integrity', 2, 'Integrity');
      return {
        text: 'You thank the PM but ask to stay focused on your own brief. Some read it as loyalty without ambition; you call it knowing your own mind.',
        deltas,
      };
    }

    case 'deputyRemoval': {
      const sacked = card.payload?.sacked === true;
      const dep = deputyPrefix(state.government.deputyTitle);
      // sacked → out of the cabinet entirely; otherwise a demotion to the brief alone.
      // (stripOffice and clearPlayerDeputyPM both record the overlay end on the timeline.)
      if (sacked) {
        stripOffice(state, rng, 'dismissed');
      } else {
        clearPlayerDeputyPM(state);
      }
      if (choiceIndex === 1) {
        // make your displeasure known: a higher profile, a colder PM
        gain('profile', 5, 'Profile');
        adjustRelationship(state, 'leader', -8);
        push('Leader', -8);
      } else {
        // accept with grace
        gain('partyStanding', -3, 'Standing');
        gain('integrity', 2, 'Integrity');
      }
      state.history.push({
        kind: 'event', date: state.day,
        headline: sacked
          ? `${state.player.name} sacked as ${dep}`
          : `${state.player.name} removed as ${dep}`,
      });
      return {
        text: choiceIndex === 1
          ? `You let it be known, on and off the record, exactly what you think of the decision. The story has legs; the PM's office has a long memory.`
          : `You thank the PM for the opportunity and leave with your dignity intact. The grace is noted, even if the demotion stings.`,
        deltas,
      };
    }

    case 'speakerContest': {
      const wasSpeaker = !!state.player.flags._isSpeaker;
      if (choiceIndex === 1) {
        // declined — an incumbent who steps aside relinquishes the Chair
        if (wasSpeaker) {
          loseSpeakership(state, rng, 'resigned');
          return {
            text: 'You let your name fall away and return to the green benches as an ordinary Member. The House thanks you for your service from the Chair.',
            deltas,
          };
        }
        gain('profile', 2, 'Profile');
        return { text: 'You decide the Chair is not for you, at least not now, and stay among your colleagues on the benches.', deltas };
      }
      const s = state.player.stats;
      const score = 0.4 * s.integrity + 0.3 * s.profile + 0.3 * s.competence
        + (wasSpeaker ? 15 : 0) + rng.normal(0, 8);
      if (score >= 78) {
        // vacate any party office and take the Chair
        if (state.player.officeId && state.player.officeId !== 'speaker') {
          removePlayerFromFrontbench(state, rng);
          clearPlayerDeputyPM(state);
        }
        state.player.officeId = 'speaker';
        state.player.officeSinceDay = state.day;
        state.player.flags._isSpeaker = true;
        state.player.flags._wasSpeaker = true;
        state.player.flags._speakerTerms = ((state.player.flags._speakerTerms as number) ?? 0) + 1;
        recordPeakTier(state);
        gain('profile', 6, 'Profile');
        gain('integrity', 4, 'Integrity');
        state.history.push({
          kind: 'roleChange', date: state.day, officeId: 'speaker', how: wasSpeaker ? 'continued' : 'appointed',
        });
        state.history.push({
          kind: 'event', date: state.day,
          headline: wasSpeaker
            ? `${state.player.name} re-elected Speaker of the House of Commons`
            : `${state.player.name} elected Speaker of the House of Commons`,
        });
        return {
          text: wasSpeaker
            ? '"The Right Honourable Member will now resume the Chair." The House carries you again, and the gavel is yours for another parliament.'
            : 'The division is called, the names are read, and the result is yours. You are dragged — by tradition, reluctantly — to the Chair. From this moment you are above party: the Speaker of the House of Commons.',
          deltas,
        };
      }
      // lost the contest
      if (wasSpeaker) {
        // an incumbent who fails to be re-elected loses the Chair
        loseSpeakership(state, rng, 'leftOffice');
        return {
          text: 'The House looks elsewhere this time. You step down from the Chair and return to the benches — an unusual fate for a sitting Speaker.',
          deltas,
        };
      }
      gain('profile', 3, 'Profile');
      return {
        text: 'The House chooses another. Your candidacy was respectfully heard, but the Chair goes elsewhere. You remain on the backbenches.',
        deltas,
      };
    }

    case 'committeeChairContest': {
      const incumbent = card.payload?.incumbent === true;
      const dept = (card.payload?.dept as DepartmentId) ?? 'treasury';
      const name = COMMITTEE_NAMES[dept];
      // guard: only a pure backbencher can chair — if the player has since taken
      // office or the Chair, an incumbent loses the chair and the contest passes
      if (!canChairCommittee(state)) {
        if (incumbent) clearCommitteeChair(state, 'votedOut');
        return { text: 'Events have moved on, and the committee chooses its chair without you.', deltas };
      }
      if (choiceIndex === 1) {
        if (incumbent) {
          clearCommitteeChair(state, 'votedOut');
          state.history.push({
            kind: 'event', date: state.day,
            headline: `${state.player.name} steps down as Chair of the ${name} Select Committee`,
          });
          return { text: `You let the chairmanship go and return to the ordinary business of the backbenches.`, deltas };
        }
        gain('profile', 2, 'Profile');
        return { text: 'You decide against putting your name forward, at least for now.', deltas };
      }
      const s = state.player.stats;
      const affinity = new Set<DepartmentId>([
        ...causeDepartments(state.player.causes ?? []),
        ...(BACKGROUNDS[state.player.background]?.deptAffinity ?? []),
      ]);
      const score = 0.35 * s.competence + 0.3 * s.profile + 0.25 * s.partyStanding + 0.1 * s.integrity
        + (incumbent ? 12 : 0) + (affinity.has(dept) ? 6 : 0) + rng.normal(0, 8);
      if (score >= 70) {
        setCommitteeChair(state, dept);
        if (incumbent) {
          // the prestige/expertise reward for another term in the chair
          gain('profile', 2, 'Profile');
          gain('competence', 2, 'Competence');
          state.history.push({
            kind: 'event', date: state.day,
            headline: `${state.player.name} re-elected Chair of the ${name} Select Committee`,
          });
          return { text: `The committee corridor keeps you: you are re-elected to the chair of the ${name} Select Committee.`, deltas };
        }
        gain('profile', 5, 'Profile');
        gain('competence', 3, 'Competence');
        gain('partyStanding', 2, 'Standing');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} elected Chair of the ${name} Select Committee`,
        });
        return {
          text: `The ballot of the whole House goes your way. You are the new Chair of the ${name} Select Committee — a backbench platform with real teeth.`,
          deltas,
        };
      }
      // lost the contest
      if (incumbent) {
        clearCommitteeChair(state, 'votedOut');
        state.history.push({
          kind: 'event', date: state.day,
          headline: `${state.player.name} loses the chair of the ${name} Select Committee`,
        });
        return { text: `Your colleagues turn to a fresh face this time. You lose the chair and return to the ordinary backbenches.`, deltas };
      }
      gain('profile', 2, 'Profile');
      return { text: `The chairmanship goes to a better-connected colleague. Your candidacy was noted, if not rewarded.`, deltas };
    }

    default:
      return { text: 'Time passes.', deltas };
  }
}

/** strip the Speakership and return the player to their own party's backbenches,
 *  with the respect an ex-Speaker carries (a one-off profile/standing head-start) */
function loseSpeakership(state: GameState, _rng: Rng, how: 'resigned' | 'leftOffice'): void {
  delete state.player.flags._isSpeaker;
  state.player.officeId = null;
  state.player.officeSinceDay = null;
  state.history.push({ kind: 'roleChange', date: state.day, officeId: null, how });
  // the comeback edge: a former Speaker is widely respected on return to the fray
  gainStat(state, 'profile', 6);
  gainStat(state, 'partyStanding', 8);
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${state.player.name} returns to the backbenches as ${PARTIES[state.player.partyId].shortName} MP`,
  });
}

// ---------- resign office / sack ministers (player-initiated, from the UI) ----------

/** the player resigns their current office and returns to the backbenches.
 *  As leader/PM this opens a succession (an NPC takes over). */
export function resignOfficeCore(state: GameState, rng: Rng): void {
  if (!state.player.officeId) return;
  if (state.player.officeId === 'speaker') {
    loseSpeakership(state, rng, 'resigned');
    return;
  }
  if (playerIsLeader(state)) {
    const party = state.player.partyId;
    state.player.officeId = null;
    state.history.push({ kind: 'roleChange', date: state.day, officeId: null, how: 'resigned' });
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${state.player.name} resigns the leadership of the ${PARTIES[party].name}`,
    });
    gainStat(state, 'integrity', 3);
    resolveNpcLeadership(state, rng, party);
    return;
  }
  stripOffice(state, rng, 'resigned');
  gainStat(state, 'integrity', 3);
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${state.player.name} returns to the backbenches`,
  });
}

/** A government-party MP moves against their own (NPC) Prime Minister. A
 *  frontbencher must resign their post to do so (the high-impact form); a
 *  backbencher submits a letter. Wrecks relations with the leader and whips,
 *  pressures the PM, and sometimes topples them — opening a leadership contest
 *  the player can enter. Impact scales with seniority. Returns narrative text. */
export function callForPmResignationCore(state: GameState, rng: Rng): { text: string } {
  if (
    !playerInGovernment(state) || playerIsLeader(state) || !state.player.hasSeat ||
    state.government.pmId === 'player'
  ) {
    return { text: 'There is no sitting Prime Minister of your party to move against.' };
  }
  const tier = playerTier(state);
  const frontbench = tier >= 1;
  const pmName = state.characters[state.government.pmId]?.name ?? 'the Prime Minister';

  if (frontbench) stripOffice(state, rng, 'resigned');

  adjustRelationship(state, 'leader', -(10 + tier * 5));
  adjustRelationship(state, 'chiefWhip', -(8 + tier * 4));
  gainStat(state, 'partyStanding', -(6 + tier * 2));
  gainStat(state, 'profile', 3 + tier * 2);
  gainStat(state, 'integrity', 2);

  const weight = 4 + tier * 6;
  const prior = state.government.pmHeavePressure ?? 0;
  state.government.pmHeavePressure = prior + weight;

  const pollsPct = (state.polling.shares[state.player.partyId] ?? 0) * 100;
  let pmWeakness = 0;
  if (pollsPct < 30) pmWeakness += (30 - pollsPct) * 0.01;
  pmWeakness += prior / 200;
  const p = clamp(0.05 + weight / 120 + pmWeakness, 0.03, 0.85);

  state.history.push({
    kind: 'event', date: state.day,
    headline: frontbench
      ? `${state.player.name} resigns and calls on ${pmName} to go`
      : `${state.player.name} submits a letter of no confidence in ${pmName}`,
  });

  if (rng.chance(p)) {
    state.government.pmHeavePressure = 0;
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${pmName} resigns as Prime Minister under pressure`,
    });
    openLeadershipVacancy(state, rng, state.government.governingParty);
    return {
      text: `Your move lands. Within days ${pmName} concedes the numbers are hopeless and resigns. The leadership is open — and you are free to stand.`,
    };
  }
  return {
    text: `${pmName} shrugs it off, and the whips mark your card. The wound is real but not yet fatal — and your standing with the leadership is in ruins.`,
  };
}

/** In opposition (or a minor party), the player moves against their own party
 *  leader — the mirror of calling on the PM to resign, for a leader who is not in
 *  No. 10. A frontbencher resigns first; a backbencher submits a letter. */
export function callForLeaderResignationCore(state: GameState, rng: Rng): { text: string } {
  const leaderId = getRelationship(state, 'leader')?.characterId;
  if (
    !state.player.hasSeat || playerIsLeader(state) ||
    playerInGovernment(state) || !leaderId || leaderId === 'player'
  ) {
    return { text: 'There is no leader of your party to move against right now.' };
  }
  const tier = playerTier(state);
  const frontbench = tier >= 1;
  const leaderName = characterName(state, leaderId);

  if (frontbench) stripOffice(state, rng, 'resigned');

  adjustRelationship(state, 'leader', -(10 + tier * 5));
  adjustRelationship(state, 'chiefWhip', -(8 + tier * 4));
  gainStat(state, 'partyStanding', -(6 + tier * 2));
  gainStat(state, 'profile', 3 + tier * 2);
  gainStat(state, 'integrity', 2);

  const weight = 4 + tier * 6;
  const prior = state.government.oppLeaderPressure ?? 0;
  state.government.oppLeaderPressure = prior + weight;

  // a leader who can't lift the party in the polls is more vulnerable to a heave
  const pollsPct = (state.polling.shares[state.player.partyId] ?? 0) * 100;
  let weakness = 0;
  if (pollsPct < 32) weakness += (32 - pollsPct) * 0.01;
  weakness += prior / 200;
  const p = clamp(0.05 + weight / 120 + weakness, 0.03, 0.85);

  state.history.push({
    kind: 'event', date: state.day,
    headline: frontbench
      ? `${state.player.name} resigns from the front bench and calls on ${leaderName} to go`
      : `${state.player.name} submits a letter of no confidence in ${leaderName}`,
  });

  if (rng.chance(p)) {
    state.government.oppLeaderPressure = 0;
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${leaderName} resigns as ${PARTIES[state.player.partyId].name} leader under pressure`,
    });
    openLeadershipVacancy(state, rng, state.player.partyId);
    return {
      text: `Your move lands. Within days ${leaderName} accepts the position is hopeless and resigns. The leadership is open — and you are free to stand.`,
    };
  }
  return {
    text: `${leaderName} faces you down and survives — for now. The whips mark your card, and your standing with the party leadership is in ruins.`,
  };
}

/** the player (as PM or LO) sacks the NPC holding a given cabinet/shadow post */
export function sackMinisterCore(state: GameState, rng: Rng, officeId: OfficeId): void {
  if (!playerIsLeader(state)) return;
  // only the PM controls the government cabinet; only the official Leader of the
  // Opposition controls the shadow cabinet. A minor-party / junior-coalition
  // leader controls neither bench.
  let side: 'cabinet' | 'shadowCabinet';
  let benchParty: PartyId;
  if (playerIsPM(state)) { side = 'cabinet'; benchParty = state.government.governingParty; }
  else if (state.player.partyId === state.government.oppositionParty) { side = 'shadowCabinet'; benchParty = state.government.oppositionParty; }
  else return;
  const post = state.government[side].find((p) => p.officeId === officeId);
  if (!post || post.characterId === 'player') return;
  const old = state.characters[post.characterId];
  if (old) { old.officeId = null; old.active = true; }
  const fresh = newFrontbencher(state, rng, benchParty, officeId);
  post.characterId = fresh.id;
  const title = side === 'cabinet' ? OFFICES[officeId].title : OFFICES[officeId].shadowTitle;
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${state.player.name} sacks ${old?.name ?? 'a minister'}; ${fresh.name} appointed ${title}`,
  });
  // a sacking spends capital: the sacked camp resents you, a small polling cost
  adjustRelationship(state, 'rival', -3);
  applyPollingShock(state, state.player.partyId, -0.15);
}

// ---------- crossing the floor ----------

function partyLeaderId(state: GameState, rng: Rng, party: PartyId): string {
  if (party === state.government.governingParty) return state.government.pmId;
  if (party === state.government.oppositionParty) return state.government.loId;
  const existing = Object.values(state.characters).find(
    (c) => c.active && c.partyId === party && c.officeId === 'leader'
  );
  if (existing) return existing.id;
  const fresh = generateCharacter(rng, usedNamesOf(state), {
    partyId: party, officeId: 'leader', minAge: 42, maxAge: 64,
    competenceMean: 58, traitBias: ['ambitious'],
  }, npcIdCounter(state));
  state.characters[fresh.id] = fresh;
  return fresh.id;
}

function partyWhipId(state: GameState, rng: Rng, party: PartyId): string {
  if (party === state.government.governingParty) {
    return state.government.cabinet.find((p) => p.officeId === 'chiefWhip')!.characterId;
  }
  if (party === state.government.oppositionParty) {
    return state.government.shadowCabinet.find((p) => p.officeId === 'chiefWhip')!.characterId;
  }
  const fresh = generateCharacter(rng, usedNamesOf(state), {
    partyId: party, officeId: 'chiefWhip', competenceMean: 55,
    traitBias: ['fixer', 'ruthless'],
  }, npcIdCounter(state));
  state.characters[fresh.id] = fresh;
  return fresh.id;
}

// ---------- continue as protégé ----------

/** archive the retiring player as a viewable "mentor" record. Their own career
 *  entries are lifted out of the shared history feed and stored here. */
function snapshotMentor(state: GameState): Mentor {
  const career: HistoryEntry[] = state.history.filter((h) =>
    h.kind === 'roleChange' || h.kind === 'leadershipContest' ||
    h.kind === 'enteredParliament' || h.kind === 'election');
  const pmTenures: PmTenure[] = (state.pmHistory ?? [])
    .filter((t) => t.characterId === 'player')
    .map((t) => ({ ...t }));
  const p = state.player;
  return {
    id: `mentor_${(state.mentors?.length ?? 0) + 1}`,
    name: p.name, gender: p.gender, age: p.age, partyId: p.partyId,
    background: p.background, avatar: p.avatar, causes: [...p.causes],
    stats: { ...p.stats },
    career, pmTenures,
    retiredDay: state.day,
    legacy: state.gameOver?.legacy ?? buildLegacy(state),
  };
}

/** an active non-player leader for a party, generating one if the seat is empty
 *  (the player held the leadership and is now leaving the stage). */
function npcSuccessorLeader(state: GameState, rng: Rng, party: PartyId): string {
  const existing = Object.values(state.characters).find(
    (c) => c.active && c.partyId === party && c.id !== 'player' && c.officeId === 'leader'
  );
  if (existing) return existing.id;
  const fresh = generateCharacter(rng, usedNamesOf(state), {
    partyId: party, officeId: 'leader', minAge: 45, maxAge: 64,
    competenceMean: 60, traitBias: ['ambitious'],
  }, npcIdCounter(state));
  state.characters[fresh.id] = fresh;
  return fresh.id;
}

/** strip every world reference to the outgoing 'player' so a fresh backbencher can
 *  take their place: hand off the premiership / opposition leadership to NPCs and
 *  refill any front-bench seat the player occupied. */
function vacatePlayerRoles(state: GameState, rng: Rng): void {
  const g = state.government;
  if (g.pmId === 'player') {
    const succ = npcSuccessorLeader(state, rng, g.governingParty);
    g.pmId = succ;
    g.pmSinceDay = state.day;
    recordPmChange(state, succ);
    const c = state.characters[succ];
    if (c) { c.officeId = 'leader'; c.active = true; }
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${c?.name ?? 'A new leader'} becomes Prime Minister`,
    });
  }
  if (g.loId === 'player') {
    const succ = npcSuccessorLeader(state, rng, g.oppositionParty);
    g.loId = succ;
    recordLoChange(state, succ);
    const c = state.characters[succ];
    if (c) { c.officeId = 'leader'; c.active = true; }
  }
  for (const bench of [g.cabinet, g.shadowCabinet]) {
    for (const post of bench) {
      if (post.characterId === 'player') {
        const party = bench === g.cabinet ? g.governingParty : g.oppositionParty;
        post.characterId = newFrontbencher(state, rng, party, post.officeId).id;
      }
    }
  }
}

/** seat the new protégé and rebuild their personal circle in the existing world. */
function installProtege(state: GameState, rng: Rng, input: CreationInput, oldSeatId: string): Player {
  const party = input.partyId;
  const mods = BACKGROUNDS[input.background].statMods;
  // the by-election is fought in the mentor's vacated seat when possible, else a
  // comfortable seat the party already holds
  let seatId = oldSeatId;
  if (!state.seatMap.some((s) => s.id === seatId)) {
    const held = state.seatMap.filter((s) => s.winner === party);
    seatId = (held[0] ?? state.seatMap[0]).id;
  }
  // the protégé inherits the mentor's seat, so their home nation must follow that
  // seat — NOT the region picker's default (the protégé flow skips the Party step,
  // leaving region at contestsRegions[0] = 'scotland' for GB-wide parties, which
  // would wrongly make a non-Scottish-seat protégé eligible for Scotland Secretary)
  const seatRegion = state.seatMap.find((s) => s.id === seatId)?.region ?? input.region;

  const player: Player = {
    name: input.name, gender: input.gender, age: input.age, partyId: party,
    background: input.background, region: seatRegion, avatar: input.avatar,
    stats: {
      profile: clamp(20 + (mods.profile ?? 0), 0, 100),
      partyStanding: clamp(40 + (mods.partyStanding ?? 0), 0, 100),
      competence: clamp(42 + (mods.competence ?? 0), 0, 100),
      constituencyApproval: clamp(52 + (mods.constituencyApproval ?? 0), 0, 100),
      integrity: clamp(55 + (mods.integrity ?? 0), 0, 100),
    },
    officeId: null, officeSinceDay: null, rebellionCount: 0, flags: {},
    seatId, hasSeat: true, enteredParliament: state.day,
    causes: (input.causes ?? []).slice(0, 3), favours: [],
  };
  state.player = player;

  // a fresh personal circle, reusing the sitting leader / whip of the chosen party
  const rels: Relationship[] = [];
  const leaderId = partyLeaderId(state, rng, party);
  if (leaderId && leaderId !== 'player') rels.push({ characterId: leaderId, kind: 'leader', value: rng.int(-5, 15) });
  const whipId = partyWhipId(state, rng, party);
  if (whipId && whipId !== 'player') rels.push({ characterId: whipId, kind: 'chiefWhip', value: rng.int(-5, 10) });
  const mentorChar = generateCharacter(rng, usedNamesOf(state), {
    partyId: party, minAge: 55, maxAge: 72, competenceMean: 60,
    traitBias: ['principled', 'loyal'], region: input.region,
  }, npcIdCounter(state));
  state.characters[mentorChar.id] = mentorChar;
  rels.push({ characterId: mentorChar.id, kind: 'mentor', value: rng.int(25, 45) });
  const ally = generateCharacter(rng, usedNamesOf(state), {
    partyId: party, minAge: Math.max(28, input.age - 6), maxAge: input.age + 6,
    competenceMean: 52, traitBias: ['charming', 'loyal'],
  }, npcIdCounter(state));
  state.characters[ally.id] = ally;
  rels.push({ characterId: ally.id, kind: 'ally', value: rng.int(30, 50) });
  const rival = generateCharacter(rng, usedNamesOf(state), {
    partyId: party, minAge: Math.max(28, input.age - 6), maxAge: input.age + 8,
    competenceMean: 58, traitBias: ['ambitious', 'ruthless'],
  }, npcIdCounter(state));
  state.characters[rival.id] = rival;
  rels.push({ characterId: rival.id, kind: 'rival', value: rng.int(-30, -10) });
  const journalist = generateCharacter(rng, usedNamesOf(state), {
    partyId: 'ind', minAge: 32, maxAge: 58, competenceMean: 60,
    traitBias: ['ruthless', 'charming'],
  }, npcIdCounter(state));
  state.characters[journalist.id] = journalist;
  rels.push({ characterId: journalist.id, kind: 'journalist', value: rng.int(-10, 10) });
  state.relationships = rels;

  return player;
}

/** Carry on a finished world as the retired player's protégé: a brand-new player
 *  character of the same party enters at a by-election; the old player is archived
 *  as a viewable mentor. Party and era are locked to the mentor's by the UI. */
export function continueAsProtegeCore(state: GameState, rng: Rng, input: CreationInput): void {
  const oldSeatId = state.player.seatId;
  // 1. archive the retiree (reads their career entries before we prune them)
  state.mentors = [...(state.mentors ?? []), snapshotMentor(state)];
  // 1b. re-attribute the retiree's PM/LO tenures from 'player' to the mentor: the world
  // chronicle keeps them (under the mentor's name), and the protégé's end-screen stats no
  // longer agglomerate the mentor's time/spells as PM (buildLegacy filters by 'player')
  const mentorId = state.mentors[state.mentors.length - 1].id;
  for (const t of state.pmHistory ?? []) if (t.characterId === 'player') t.characterId = mentorId;
  for (const t of state.loHistory ?? []) if (t.characterId === 'player') t.characterId = mentorId;
  // 2. keep only the world chronicle; the retiree's personal career lives in the mentor
  state.history = state.history.filter((h) => h.kind === 'event');
  // 3. hand the retiree's offices to NPCs and clear every 'player' reference
  vacatePlayerRoles(state, rng);
  // 4. install the fresh backbencher via a by-election in the mentor's old seat
  installProtege(state, rng, input, oldSeatId);
  state.history.push({
    kind: 'enteredParliament', date: state.day,
    seatName: state.seatMap.find((s) => s.id === state.player.seatId)?.name ?? 'a by-election',
  });
  state.history.push({
    kind: 'event', date: state.day,
    headline: `${input.name} wins a by-election and enters Parliament for the ${PARTIES[input.partyId].name}`,
  });
  // 5. reset all player-specific transient state and resume play
  state.gameOver = null;
  state.currentCard = null;
  state.forcedQueue = [];
  state.cardHistory = {};
  state.calendarDone = {};
  state.lastCardId = null;
}

/** the player crosses the floor to a new party */
export function changeParty(state: GameState, rng: Rng, newParty: PartyId): void {
  const oldParty = state.player.partyId;
  if (newParty === oldParty || playerIsLeader(state)) return;

  if (state.player.officeId) {
    stripOffice(state, rng, 'leftOffice');
  }
  state.player.partyId = newParty;
  state.player.rebellionCount = 0;

  // a defector starts near the bottom of the new pecking order
  state.player.stats.partyStanding = clamp(30 + rng.int(-4, 4), 0, 100);
  gainStat(state, 'constituencyApproval', -8);
  gainStat(state, 'integrity', -4);

  // old friendships cool; old rivals gloat
  adjustRelationship(state, 'mentor', -15);
  adjustRelationship(state, 'ally', -15);
  adjustRelationship(state, 'rival', -10);

  // new leader and whips, starting lukewarm at best — an Independent has neither
  if (newParty !== 'ind') {
    replaceLeader(state, partyLeaderId(state, rng, newParty), rng.int(-5, 5));
    const whipRel = state.relationships.find((r) => r.kind === 'chiefWhip');
    if (whipRel) {
      whipRel.characterId = partyWhipId(state, rng, newParty);
      whipRel.value = rng.int(-5, 5);
    }
  }

  // part of your personal mandate follows you — weakened
  const seat = state.seatMap.find((s) => s.id === state.player.seatId);
  if (seat) {
    const oldShare = seat.shares[oldParty] ?? 0;
    const moved = oldShare * 0.55;
    seat.shares[oldParty] = oldShare - moved;
    seat.shares[newParty] = (seat.shares[newParty] ?? 0) + moved;
  }
  state.player.flags.defected = 1;

  state.history.push({
    kind: 'event', date: state.day,
    headline: newParty === 'ind'
      ? `${state.player.name} resigns the whip to sit as an Independent`
      : `${state.player.name} crosses the floor to join the ${PARTIES[newParty].name}`,
  });
}

// ---------- the leader's election campaign ----------

/** five make-or-break stages; choices genuinely move national polling */
function resolveLeaderCampaignChoice(
  state: GameState,
  rng: Rng,
  card: DrawnCard,
  choiceIndex: number,
  deltas: StatDelta[],
  push: (label: string, delta: number) => void
): { text: string; deltas: StatDelta[] } {
  const step = (card.payload?.step as number) ?? 1;
  const party = state.player.partyId;
  // leader campaigns run ~10% harder: good days help a little less, bad days
  // hurt a little more, so a strong campaign can rescue a close race but a
  // careless one is punished.
  const shock = (pts: number) => {
    const adjusted = pts >= 0 ? pts * 0.9 : pts * 1.1;
    applyPollingShock(state, party, adjusted);
    push('National polls', Math.round(adjusted * 10) / 10);
  };
  const stat = (k: keyof GameState['player']['stats'], d: number, label: string) => {
    const applied = gainStat(state, k, d);
    if (applied !== 0) push(label, applied);
  };

  switch (step) {
    case 1: // the grid
      if (choiceIndex === 0) {
        shock(0.6);
        return { text: 'Message discipline it is: three words, repeated until your own team begs for mercy and the public starts finishing your sentences. Dull, proven, effective.', deltas };
      }
      if (choiceIndex === 1) {
        if (rng.chance(0.5)) {
          shock(1.6);
          stat('profile', 3, 'Profile');
          return { text: 'The rallies are enormous from day one. The footage of crowds spilling out of halls reframes the whole contest as a movement. Momentum is a real and dangerous thing, and right now it is yours.', deltas };
        }
        shock(-1.2);
        return { text: 'The rallies look great and move nothing: you are talking to people who already agree with you while the swing voters watch someone else. "Vanity campaign," mutters a strategist, off the record but loudly.', deltas };
      }
      shock(rng.chance(0.55) ? 0.9 : -0.6);
      return { text: 'Rapid rebuttal: a war room that never sleeps and a leader who is always, exhaustingly, on. Some days you set the agenda; some days you only chase it.', deltas };

    case 2: // manifesto
      if (choiceIndex === 0) {
        if (rng.chance(0.5)) {
          shock(1.4);
          return { text: 'The bold offer detonates across the front pages — and, against the strategists\' every instinct, it lands. "Finally, something to vote FOR," says the vox pop that gets replayed all week.', deltas };
        }
        shock(-1.1);
        return { text: 'Bold, yes. Costed? The IFS has questions by lunchtime and your Treasury team has answers by — well, they\'re still working on it. The launch week is spent defending arithmetic.', deltas };
      }
      if (choiceIndex === 1) {
        shock(0.3);
        return { text: 'A manifesto with no hostages to fortune: every promise pre-tested, every number triple-checked. Bulletproof and slightly beige. Nobody is excited; nobody is alarmed. You can work with that.', deltas };
      }
      if (choiceIndex === 2) {
        shock(0.8);
        stat('integrity', -3, 'Integrity');
        return { text: 'You lift the other side\'s most popular policy wholesale and dare them to complain. They do, at length, which means a week of coverage explaining that you now own their best idea.', deltas };
      }
      // choice 3 — the uncosted megabet: occasionally electrifying, usually a trap
      if (rng.chance(0.3)) {
        shock(2.4);
        stat('profile', 2, 'Profile');
        return { text: 'The giant, uncosted pledge is reckless and magnificent and it catches fire. The country, it turns out, was desperate for someone to promise something enormous. The strategists exhale; the bond markets do not.', deltas };
      }
      shock(-2.4);
      stat('integrity', -2, 'Integrity');
      return { text: 'The eye-catching promise unravels on contact with a calculator. "How will you pay for it?" becomes the only question of the week, and you have no answer that survives a follow-up. The number eats the campaign.', deltas };

    case 3: // tv debate
      if (choiceIndex === 0) {
        if (rng.chance(0.45)) {
          shock(1.9);
          stat('profile', 3, 'Profile');
          return { text: 'You go for them from the opening answer and never let go. By the third exchange they are visibly rattled; the snap poll gives the night to you by twenty points. Campaigns turn on nights like this. This one just did.', deltas };
        }
        shock(-1.5);
        return { text: 'The aggression reads as desperation under the studio lights. Their calm, sad shake of the head — rehearsed, obviously, but effective — becomes the clip. The snap poll stings.', deltas };
      }
      if (choiceIndex === 1) {
        shock(0.6);
        return { text: 'You rise above the bait, answer the questions, and talk to the camera like an adult addressing adults. No fireworks, no disasters. The pundits score it a draw; the focus groups quietly score it to you.', deltas };
      }
      if (choiceIndex === 2) {
        if (rng.chance(0.55)) {
          shock(1.7);
          stat('profile', 3, 'Profile');
          return { text: 'The zinger lands so perfectly the studio audience breaks the no-applause rule. It is the headline, the meme, and the moment. Your team watches it seventeen times on the bus home.', deltas };
        }
        shock(-1.3);
        return { text: 'You deploy the rehearsed line a beat too early, into the wrong context, and it dies in the silence. Their counter — clearly also rehearsed — does not. The internet is unkind.', deltas };
      }
      // choice 3 — go personal: a nasty gamble that usually rebounds on you
      if (rng.chance(0.3)) {
        shock(1.8);
        stat('integrity', -3, 'Integrity');
        return { text: 'The character assault is brutal and it works: rattled and wounded, they never recover their footing. You win the night and lose a little of yourself doing it.', deltas };
      }
      shock(-2.2);
      stat('integrity', -4, 'Integrity');
      return { text: 'The personal attack curdles in the room. "That was beneath the office," they say quietly, and eight million people agree. You look like a bully; the sympathy — and the polls — swing to them.', deltas };

    case 4: // the wobble
      if (choiceIndex === 0) {
        shock(0.7);
        stat('integrity', 2, 'Integrity');
        return { text: 'Candidate suspended by 8am, corrected costings by noon, and you take every question until the room runs dry. "Grip" is the word in the write-ups. The wobble becomes a footnote.', deltas };
      }
      if (choiceIndex === 1) {
        if (rng.chance(0.5)) {
          shock(0.4);
          return { text: 'You announce something enormous and shiny at 9am and the press pack, magpies all, chases it. By Thursday nobody remembers the wobble. Cynical, effective, noted.', deltas };
        }
        shock(-1.6);
        return { text: 'The dead cat fails to bounce. Now there are two stories: the wobble, and the transparent attempt to bury it. The campaign loses three days it did not have.', deltas };
      }
      if (choiceIndex === 2) {
        stat('integrity', -3, 'Integrity');
        if (rng.chance(0.5)) {
          shock(1.0);
          return { text: 'Your opposition research lands like a depth charge — suddenly it is their candidates, their costings, their crisis. Brutal stuff. The gap moves your way while everyone\'s hands get dirty.', deltas };
        }
        shock(-1.0);
        return { text: 'The counter-attack misfires: your dossier has a factual error in paragraph two, and the story becomes your campaign\'s methods. The phrase "gutter politics" attaches itself to your lapel.', deltas };
      }
      // choice 3 — blame the media and stonewall: looks evasive, usually backfires
      if (rng.chance(0.25)) {
        shock(0.4);
        return { text: 'You refuse to play, attack the framing, and — just this once — the press tires of the story before you do. A narrow escape that emboldens entirely the wrong instincts.', deltas };
      }
      shock(-1.9);
      stat('integrity', -2, 'Integrity');
      return { text: 'Refusing to engage reads as guilt. The empty podium, the cancelled interviews, the "leader in hiding" chyron — the silence becomes a louder story than the wobble ever was.', deltas };

    case 5: // battleground blitz
      if (choiceIndex === 0) {
        shock(0.5);
        stat('partyStanding', 2, 'Standing');
        return { text: 'You spend the week in the heartlands, shoring up the wall. Less glamorous than raiding enemy territory, but the candidates there will remember who came when it mattered — and their seats hold the line.', deltas };
      }
      if (choiceIndex === 1) {
        if (rng.chance(0.5)) {
          shock(1.3);
          return { text: 'The raid into their marginals is audacious and the local coverage is rapturous — a leader who turns up where they\'re "not supposed to win" makes everyone recalculate the map.', deltas };
        }
        shock(-0.7);
        return { text: 'The marginals raid stretches the machine thin, and the heartland candidates mutter to journalists about being abandoned. The map was a gamble; the gamble was noticed.', deltas };
      }
      if (choiceIndex === 2) {
        if (rng.chance(0.35)) {
          shock(2.0);
          stat('profile', 3, 'Profile');
          return { text: 'The unlikely coalition turns out to exist. The rallies swell, the registration numbers spike, and the pollsters start muttering about turnout models being wrong. Something is happening out there.', deltas };
        }
        shock(-1.0);
        return { text: 'The new coalition fails to materialise where it counts. The rallies were real; the votes, the data people gently explain, were not where the bus went. A week the campaign won\'t get back.', deltas };
      }
      // choice 3 — coast on the lead: complacency the voters tend to punish
      if (rng.chance(0.25)) {
        shock(0.3);
        return { text: 'You ease off, project the serene confidence of a winner, and the lead — miraculously — holds. You will never admit how close you came to throwing it away with a fortnight of nothing.', deltas };
      }
      shock(-1.6);
      stat('partyStanding', -2, 'Standing');
      return { text: 'Coasting was a mistake. The lead was soft, the other side never stopped running, and "complacent" becomes the word that follows you to polling day. Your own MPs watch the tightening polls and remember who eased off.', deltas };

    case 6: // final broadcast
      if (choiceIndex === 0) {
        shock(0.8);
        stat('integrity', -2, 'Integrity');
        return { text: 'Fear works — it always has. The final broadcast paints the other morning in convincing grey, and the late deciders break the way frightened people break. You sleep badly and poll well.', deltas };
      }
      if (choiceIndex === 1) {
        shock(0.6);
        stat('profile', 2, 'Profile');
        return { text: 'You close on hope: the better country, the morning after. Whatever happens tomorrow, it is the broadcast people will quote when they talk about this campaign.', deltas };
      }
      shock(0.5);
      stat('competence', 2, 'Competence');
      return { text: 'Boring, reliable, ready: the closing message is a firm handshake of a broadcast. No poetry, no risk. In nervous times, the dull candidate is the comfort food of democracies.', deltas };

    default: // step 7 — get out the vote
      if (choiceIndex === 0) {
        shock(rng.chance(0.6) ? 1.2 : 0.3);
        stat('partyStanding', 2, 'Standing');
        return { text: 'Every door, every marginal, until your activists\' knuckles ache. Ground game doesn\'t trend on the news, but it turns soft leads into seats. Now there is nothing left to do but count.', deltas };
      }
      if (choiceIndex === 1) {
        shock(rng.chance(0.5) ? 1.0 : -0.4);
        return { text: 'A dawn-to-dusk media marathon: every sofa, every phone-in, every drive-time slot. You are hoarse by lunch and ubiquitous by dusk. High-risk, high-visibility.', deltas };
      }
      shock(0.4);
      return { text: 'You trust the machine, project serene confidence, and let the operation do its work. Calm is contagious. Polls close at ten.', deltas };
  }
}

// ---------- legacy ----------

/** who was governing on a given day (reconstructed from election history) */
export function governingPartyAt(state: GameState, date: number): PartyId {
  let gov = PARLIAMENTS[state.startEra].governingParty;
  for (const e of Object.values(state.elections).sort((a, b) => a.date - b.date)) {
    if (e.date <= date) gov = e.governingParty;
  }
  return gov;
}

// ---------- prime-ministerial succession ----------

function pmNameAndParty(state: GameState, characterId: string): { name: string; partyId: PartyId } {
  if (characterId === 'player') {
    return { name: state.player.name, partyId: state.player.partyId };
  }
  const c = state.characters[characterId];
  return {
    name: c?.name ?? 'the Prime Minister',
    partyId: c?.partyId ?? state.government.governingParty,
  };
}

/** record a change of Prime Minister: close out the outgoing spell and open a new
 *  one. No-op if the same person is already the open incumbent. */
export function recordPmChange(state: GameState, characterId: string): void {
  if (!state.pmHistory) state.pmHistory = [];
  const last = state.pmHistory[state.pmHistory.length - 1];
  if (last && last.endDay === null) {
    if (last.characterId === characterId) return; // already serving
    last.endDay = state.day;
  }
  const { name, partyId } = pmNameAndParty(state, characterId);
  state.pmHistory.push({ characterId, name, partyId, startDay: state.day, endDay: null });
}

/** record a change of Leader of the Opposition: close out the outgoing spell and
 *  open a new one. No-op if the same person is already the open incumbent, or if
 *  no real LO is named yet (empty id). */
export function recordLoChange(state: GameState, characterId: string): void {
  if (!characterId) return;
  if (!state.loHistory) state.loHistory = [];
  const last = state.loHistory[state.loHistory.length - 1];
  if (last && last.endDay === null) {
    if (last.characterId === characterId) return; // already serving
    last.endDay = state.day;
  }
  // the LO belongs to the opposition party, not the governing one
  const name = characterId === 'player'
    ? state.player.name
    : (state.characters[characterId]?.name ?? 'the Leader of the Opposition');
  const partyId = characterId === 'player'
    ? state.player.partyId
    : (state.characters[characterId]?.partyId ?? state.government.oppositionParty);
  state.loHistory.push({ characterId, name, partyId, startDay: state.day, endDay: null });
}

/** rebuild pmHistory for a pre-v6 save from the existing history feed */
export function reconstructPmHistory(state: GameState): PmTenure[] {
  const out: PmTenure[] = [];
  const push = (rec: PmTenure) => {
    const prev = out[out.length - 1];
    if (prev && prev.endDay === null) prev.endDay = rec.startDay;
    out.push(rec);
  };
  const charByName = (name: string) =>
    Object.values(state.characters).find((c) => c.name === name);
  for (const h of state.history) {
    if (h.kind === 'roleChange' && h.how === 'becamePM') {
      push({
        characterId: 'player', name: state.player.name,
        partyId: h.partyId ?? state.player.partyId, startDay: h.date, endDay: null,
      });
    } else if (h.kind === 'event' && / becomes Prime Minister$/.test(h.headline)) {
      const name = h.headline.replace(/ becomes Prime Minister$/, '');
      const c = charByName(name);
      push({
        characterId: c?.id ?? name, name,
        partyId: c?.partyId ?? state.government.governingParty, startDay: h.date, endDay: null,
      });
    }
  }
  const cur = state.government.pmId;
  const last = out[out.length - 1];
  if (!last || last.characterId !== cur) {
    const { name, partyId } = pmNameAndParty(state, cur);
    push({ characterId: cur, name, partyId, startDay: state.government.pmSinceDay, endDay: null });
  }
  if (out.length === 0) {
    const { name, partyId } = pmNameAndParty(state, cur);
    out.push({ characterId: cur, name, partyId, startDay: state.parliamentStart, endDay: null });
  }
  return out;
}

/** one-word rating + a one-line characterisation of the whole career */
function careerVerdict(
  level: number, everSpeaker: boolean, everDeputyPM: boolean,
  everGreatOffice: boolean, everMinister: boolean, everChiefRole: boolean, chiefNoun: string,
  stats: PlayerStats, rebellions: number, years: number, everCommitteeChair = false
): { rating: string; verdict: string } {
  // only an actual Minister of State (tier 3+) earns the "Minister" rating; a
  // PPS / parliamentary aide / Whip falls through to the backbencher ratings
  const realMinister = level === 1 && everMinister;
  let rating: string;
  if (level === 4) {
    rating = stats.integrity >= 68 && years >= 12 ? 'Colossus' : 'Statesman';
  } else if (everSpeaker) {
    rating = 'Speaker';
  } else if (level === 3) {
    rating = 'Contender';
  } else if (everDeputyPM || level === 2) {
    rating = 'Heavyweight';
  } else if (everChiefRole) {
    // Chief Whip / Chief Secretary: senior, but below the full cabinet
    rating = 'Senior Minister';
  } else if (realMinister) {
    rating = 'Minister';
  } else if (everCommitteeChair) {
    rating = 'Committee Chair';
  } else {
    rating = years >= 15 ? 'Stalwart' : 'Footnote';
  }

  // characterise the style of the career: adjectives modify the office directly,
  // noun-phrases ("a household name") are appended as a clause so the grammar
  // never reads "A a household name …"
  const adjectives: string[] = [];
  const nouns: string[] = [];
  if (stats.integrity >= 70) adjectives.push('principled');
  else if (stats.integrity <= 35) adjectives.push('unscrupulous');
  if (rebellions >= 4) adjectives.push('rebellious');
  if (stats.profile <= 30) adjectives.push('low-profile');
  // a "household name" only for those who reached a top office: a great office of
  // state, a party leader (PM / LO / minor-party), the Deputy PM, or the Speaker
  const topOffice = everGreatOffice || level >= 3 || everDeputyPM || everSpeaker;
  if (stats.profile >= 75 && topOffice) nouns.push('a household name');
  if (stats.competence >= 75) nouns.push('a safe pair of hands');

  const office =
    level === 4 ? 'Prime Minister'
    : everSpeaker ? 'Speaker of the House'
    : level === 3 ? 'party leader'
    : everDeputyPM ? 'Deputy Prime Minister'
    : level === 2 ? 'cabinet minister'
    : everChiefRole ? chiefNoun
    : realMinister ? 'junior minister'
    : everCommitteeChair ? 'select committee chair'
    : 'backbencher';
  const adj = adjectives.slice(0, 2).join(', ');
  let phrase = adj ? `a ${adj} ${office}` : `a ${office}`;
  if (nouns.length) phrase += ` and ${nouns[0]}`;
  return { rating, verdict: `${titleCase(phrase)}.` };
}

export function buildLegacy(state: GameState): LegacySummary {
  // career levels: 0 backbencher, 1 minister, 2 cabinet, 3 party leader, 4 PM
  let level = 0;
  // keep the *best* same-level title, not the last: prefer government framing,
  // then great offices of state over other cabinet seats, then seniority
  let cabinetTitle = '';
  let cabinetScore = -1;
  let ministerTitle = '';
  let ministerScore = -1;
  let everSpeaker = !!state.player.flags._wasSpeaker;
  let everGreatOffice = false; // held a great office of state (Chancellor/Home/Foreign)
  let everMinister = false;    // held an actual Minister-of-State+ post (tier 3+)
  // Chief Whip / Chief Secretary are senior but NOT full cabinet — their own rung,
  // ranked above a minister and below a real cabinet seat
  let everChiefRole = false;
  let chiefTitle = '';   // full side title, e.g. "Chief Secretary to the Treasury"
  let chiefNoun = '';    // short verdict noun, e.g. "chief whip"
  let chiefScore = -1;
  for (const entry of state.history) {
    if (entry.kind !== 'roleChange') continue;
    if (entry.officeId === 'speaker') everSpeaker = true;
    if (entry.how === 'becamePM') {
      level = Math.max(level, 4);
    } else if (entry.how === 'electedLeader') {
      level = Math.max(level, 3);
    } else if (entry.officeId && entry.officeId !== 'speaker') {
      const office = OFFICES[entry.officeId];
      // use the framing recorded at the time; fall back for pre-v5 entries
      const inGov = entry.roleSide
        ? entry.roleSide === 'gov'
        : governingPartyAt(state, entry.date) === state.player.partyId;
      const sideTitle = inGov ? office.title : office.shadowTitle;
      if (office.tier === 4 && (office.id === 'chief_sec' || office.id === 'chiefWhip')) {
        // a senior post, but not a full cabinet seat — its own rung below cabinet
        level = Math.max(level, 1);
        everChiefRole = true;
        const score = (inGov ? 1000 : 0) + (office.id === 'chiefWhip' ? 5 : 0);
        if (score > chiefScore) {
          chiefScore = score;
          chiefTitle = sideTitle;
          chiefNoun = office.id === 'chiefWhip' ? 'chief whip' : 'chief secretary';
        }
      } else if (office.tier === 4) {
        level = Math.max(level, 2);
        if (GREAT_OFFICES.includes(office.id)) everGreatOffice = true;
        const score = (inGov ? 1000 : 0) + (GREAT_OFFICES.includes(office.id) ? 100 : 50);
        // the Leader of the House carries the formal Lord President title on the
        // end screen (the shadow keeps the short title — there is no shadow LPC)
        const legacyTitle = (office.id === 'leader_house' && inGov)
          ? 'Leader of the House of Commons and Lord President of the Council'
          : sideTitle;
        if (score > cabinetScore) { cabinetScore = score; cabinetTitle = legacyTitle; }
      } else if (office.tier >= 1 && office.tier <= 3) {
        level = Math.max(level, 1);
        if (office.tier >= 3) everMinister = true; // a real ministerial post, not PPS/Whip
        const score = (inGov ? 1000 : 0) + office.tier * 10 + (office.rank ?? 0);
        if (score > ministerScore) { ministerScore = score; ministerTitle = sideTitle; }
      }
    }
  }
  const everDeputyPM = !!state.player.flags._everDeputyPM;
  const everCommitteeChair = !!state.player.flags._wasCommitteeChair;
  // the Speaker's Chair is a distinct top-tier honour; Deputy PM ranks just below
  // a party leader. Both outrank a plain cabinet seat. A select-committee chair is
  // a notable backbench honour — above a plain MP, below any ministerial office.
  const bestTitle =
    level === 4 ? 'Prime Minister'
    : everSpeaker ? 'Speaker of the House of Commons'
    : level === 3 ? 'Party Leader'
    : everDeputyPM ? 'Deputy Prime Minister'
    : level === 2 ? `Cabinet — ${cabinetTitle}`
    : everChiefRole ? chiefTitle
    : level === 1 ? ministerTitle
    : everCommitteeChair ? 'Select Committee Chair'
    : 'Backbench MP';
  // count only THIS character's own elections — a protégé must not inherit the
  // mentor's wins (state.elections spans the whole dynasty/world)
  const elections = Object.values(state.elections)
    .filter((e) => e.date >= state.player.enteredParliament);
  const electionsWon = elections.filter((e) => e.playerHeldSeat).length;
  const electionsContested = elections.filter((e) => e.playerResult !== null).length;
  const headlines = state.history
    .filter((h) => h.kind === 'event')
    .slice(-10)
    .map((h) => (h as { headline: string }).headline);
  const yearsServed = Math.max(1, Math.round((state.day - state.player.enteredParliament) / 365));
  const playerPmSpells = (state.pmHistory ?? []).filter((t) => t.characterId === 'player');
  const pmStints = playerPmSpells.length;
  const yearsAsPM = Math.floor(
    playerPmSpells.reduce((a, t) => a + ((t.endDay ?? state.day) - t.startDay), 0) / 365
  );
  const leadershipContestsFought = state.history.filter((h) => h.kind === 'leadershipContest').length;
  const leadershipContestsWon = state.history.filter((h) => h.kind === 'leadershipContest' && h.won).length;
  const electionsWonAsLeader = (state.player.flags._electionsWonAsLeader as number) ?? 0;
  const { rating, verdict } = careerVerdict(
    level, everSpeaker, everDeputyPM, everGreatOffice, everMinister, everChiefRole, chiefNoun,
    state.player.stats, state.player.rebellionCount, yearsServed, everCommitteeChair
  );
  return {
    yearsServed,
    highestOfficeTitle: bestTitle,
    electionsWon,
    headlines,
    electionsContested,
    rebellions: state.player.rebellionCount,
    becamePM: level === 4,
    becameLeader: level >= 3,
    wasSpeaker: everSpeaker,
    wasDeputyPM: everDeputyPM,
    pmStints,
    yearsAsPM,
    electionsWonAsLeader,
    leadershipContestsWon,
    leadershipContestsFought,
    finalStats: { ...state.player.stats },
    causes: [...(state.player.causes ?? [])],
    rating,
    verdict,
  };
}
