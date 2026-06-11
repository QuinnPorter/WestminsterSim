import {
  Character, DrawnCard, ElectionResult, ForcedEvent, GameState, OfficeId,
  PartyId, StatDelta,
} from '../types/game';
import { CABINET_OFFICES, DEPARTMENTS, OFFICES, officeTitle, officeTitleFor } from '../data/offices';
import { BACKGROUNDS } from '../data/backgrounds';
import { PARTIES } from '../data/parties';
import { PARLIAMENTS } from '../data/parliaments';
import { generateCharacter } from '../generation/characters';
import {
  adjustRelationship, averageColleagueWarmth, characterName, getRelationship,
  relationshipValue, replaceLeader,
} from './relationships';
import { applyPollingShock, gainStat } from './effects';
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

/** the full party name, when the player is on the minor-party track */
function minorPartyNameOf(state: GameState): string | undefined {
  return onMinorPartyTrack(state) ? PARTIES[state.player.partyId].name : undefined;
}

export function playerOfficeTitle(state: GameState): string {
  return officeTitleFor(state.player.officeId, {
    inGovernment: playerInGovernment(state),
    minorPartyName: minorPartyNameOf(state),
  });
}

/** label an office the player held, for the history/career timeline. Uses the
 *  governing party at `date` for the gov/shadow distinction; minor-party
 *  spokesperson naming is applied when the player currently sits with one. */
export function playerOfficeLabel(state: GameState, officeId: OfficeId | null, date: number): string {
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
  return playerInGovernment(state) ? 'cabinet' : 'shadowCabinet';
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

// ---------- eligibility ----------

export function eligibilityScore(state: GameState, targetOffice: OfficeId): number {
  const s = state.player.stats;
  const office = OFFICES[targetOffice];
  const bg = BACKGROUNDS[state.player.background];
  const deptBonus =
    office.department && bg.deptAffinity.includes(office.department) ? bg.deptBonus : 0;
  const scandalPenalty = state.player.flags.scandal ? 18 : 0;
  return (
    0.3 * s.competence +
    0.25 * (50 + relationshipValue(state, 'leader') / 2) +
    0.2 * s.partyStanding +
    0.15 * s.profile +
    0.1 * (50 + relationshipValue(state, 'chiefWhip') / 2) -
    4 * state.player.rebellionCount -
    scandalPenalty +
    deptBonus
  );
}

export const OFFER_THRESHOLDS: Record<number, number> = { 1: 41, 2: 47, 3: 52, 4: 59 };

function deptOfficeId(rng: Rng, bg: typeof BACKGROUNDS[keyof typeof BACKGROUNDS], tier: 3 | 4): OfficeId {
  const prefix = tier === 4 ? 'sos' : 'min';
  const dept = bg.deptAffinity.length > 0 && rng.chance(0.5)
    ? rng.pick(bg.deptAffinity)
    : rng.pick(Object.keys(DEPARTMENTS)) as keyof typeof DEPARTMENTS;
  return `${prefix}_${dept}`;
}

/** the next rung the player would plausibly be offered */
export function nextOfficeFor(state: GameState, rng: Rng): OfficeId | null {
  const tier = playerTier(state);
  const bg = BACKGROUNDS[state.player.background];

  // minor parties have a slim front bench: a backbencher is made a spokesperson
  // (min_*), a spokesperson is occasionally promoted to lead spokesperson (sos_*).
  if (onMinorPartyTrack(state)) {
    if (tier >= 4) return null; // next step up is the leadership, via a contest
    if (tier === 3) {
      return rng.chance(0.4) ? deptOfficeId(rng, bg, 4) : deptOfficeId(rng, bg, 3);
    }
    return deptOfficeId(rng, bg, 3); // tier 0/1/2 → a spokesperson brief
  }

  // career memory: a returning ex-minister on the backbenches isn't sent back
  // to PPS — bring them in near their peak (peak tier, or one below).
  const peak = (state.player.flags._peakTier as number) ?? 0;
  if (tier === 0 && peak >= 3) {
    const comebackTier = rng.chance(0.6) ? peak : peak - 1;
    if (comebackTier >= 4) return deptOfficeId(rng, bg, 4);
    if (comebackTier === 3) return deptOfficeId(rng, bg, 3);
    // peak was a whip/PPS — fall through to the normal ladder
  }

  if (tier === 0) return rng.chance(0.55) ? 'pps' : 'whip';
  if (tier === 1 || tier === 2) {
    const dept = bg.deptAffinity.length > 0 && rng.chance(0.5)
      ? rng.pick(bg.deptAffinity)
      : rng.pick(Object.keys(DEPARTMENTS)) as keyof typeof DEPARTMENTS;
    return `min_${dept}`;
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
      return `min_${dept}`;
    }
    const dept = current && rng.chance(0.45)
      ? current
      : bg.deptAffinity.length > 0 && rng.chance(0.4)
        ? rng.pick(bg.deptAffinity)
        : rng.pick(Object.keys(DEPARTMENTS)) as keyof typeof DEPARTMENTS;
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

export function giveOffice(state: GameState, rng: Rng, officeId: OfficeId, how: 'appointed' | 'promoted'): void {
  // vacate any cabinet-level post the player held
  removePlayerFromFrontbench(state, rng);
  state.player.officeId = officeId;
  recordPeakTier(state);
  // only government/opposition players occupy a tracked cabinet seat; minor-party
  // spokesperson roles are not part of any NPC bench
  if (onFrontbenchTrack(state) && CABINET_OFFICES.includes(officeId)) {
    // displace the NPC holder
    setFrontbenchPost(state, frontbenchSide(state), officeId, 'player');
  }
  state.history.push({ kind: 'roleChange', date: state.day, officeId, how });
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
  state.player.officeId = null;
  state.history.push({ kind: 'roleChange', date: state.day, officeId: null, how });
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

  // churn 1-2 NPC frontbench posts, with named winners and losers
  const side = frontbenchSide(state);
  const churnable = state.government[side].filter((p) => p.characterId !== 'player');
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

  // is the player for the chop?
  if (state.player.officeId && !playerIsLeader(state)) {
    const holdScore = eligibilityScore(state, state.player.officeId) + rng.normal(0, 5);
    const floor = 36 + tier * 3 + (emergency ? 4 : 0);
    if (holdScore < floor || (state.player.flags.scandal && rng.chance(0.6))) {
      state.forcedQueue.push({ kind: 'dismissal' });
      return;
    }
  }

  // due a promotion?
  const target = nextOfficeFor(state, rng);
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
  const posts = state.government[side].filter((p) => p.characterId !== 'player');
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
}

// ---------- leadership ----------

function leadershipBaseSupport(state: GameState): number {
  const s = state.player.stats;
  const pastLosses = (state.player.flags._contestLosses as number) ?? 0;
  return clamp(
    0.25 * s.partyStanding +
      0.2 * s.profile +
      0.15 * (50 + averageColleagueWarmth(state) / 2) +
      0.1 * s.competence +
      (playerTier(state) >= 4 ? 8 : 0) -
      2 * state.player.rebellionCount -
      6 * pastLosses,
    5, 90
  );
}

const LEADERSHIP_WIN_THRESHOLD = 59;

/** Any sitting MP may put their name forward when the leadership falls vacant —
 *  even a backbencher. Whether they get anywhere is decided by support in the
 *  ballots (a long-shot is usually eliminated in the early rounds), not here. */
export function playerCanStandForLeader(state: GameState): boolean {
  return state.player.hasSeat && !playerIsLeader(state);
}

/** assemble the named field for a leadership contest: 3-6 heavyweight rivals */
function pickContestCandidates(state: GameState, rng: Rng, party: PartyId): string[] {
  const fieldSize = rng.int(3, 6);
  const pool = Object.values(state.characters)
    .filter((c) => c.active && c.partyId === party && c.officeId && OFFICES[c.officeId].tier === 4)
    .sort((a, b) => b.competence - a.competence);
  const ids = pool.slice(0, fieldSize).map((c) => c.id);
  while (ids.length < fieldSize) {
    const c = generateCharacter(rng, usedNamesOf(state), {
      partyId: party, minAge: 40, maxAge: 60,
      competenceMean: 60, traitBias: ['ambitious'],
    }, npcIdCounter(state));
    state.characters[c.id] = c;
    ids.push(c.id);
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
  return 0.6 * c.competence + traitBonus + rng.normal(0, 5);
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
  // strongest available frontbencher of that party, else fresh blood
  const candidates = Object.values(state.characters).filter(
    (c) => c.active && c.partyId === party && c.officeId && OFFICES[c.officeId].tier === 4
  );
  let winner: Character;
  if (forcedWinnerId && state.characters[forcedWinnerId]) {
    winner = state.characters[forcedWinnerId];
    const oldOffice = winner.officeId;
    if (oldOffice && CABINET_OFFICES.includes(oldOffice)) {
      const side = party === state.government.governingParty ? 'cabinet' : 'shadowCabinet';
      const fresh = newFrontbencher(state, rng, party, oldOffice);
      setFrontbenchPost(state, side, oldOffice, fresh.id);
    }
  } else if (candidates.length > 0 && rng.chance(0.8)) {
    winner = candidates.reduce((a, b) =>
      a.competence + rng.normal(0, 8) > b.competence ? a : b
    );
    // their old post gets a new holder
    const oldOffice = winner.officeId!;
    const side = party === state.government.governingParty ? 'cabinet' : 'shadowCabinet';
    if (CABINET_OFFICES.includes(oldOffice)) {
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
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${winner.name} becomes Prime Minister`,
    });
  } else if (party === state.government.oppositionParty) {
    state.government.loId = winner.id;
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
  }
  return winner;
}

function makePlayerLeader(state: GameState, rng: Rng): void {
  const party = state.player.partyId;
  removePlayerFromFrontbench(state, rng);
  state.player.officeId = 'leader';
  recordPeakTier(state);
  state.history.push({
    kind: 'roleChange', date: state.day, officeId: 'leader', how: 'electedLeader',
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
    state.history.push({ kind: 'roleChange', date: state.day, officeId: 'leader', how: 'becamePM' });
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${state.player.name} enters Number 10`,
    });
  } else {
    // official opposition or a minor party — either way, "leader of the party"
    state.government.loId = party === state.government.oppositionParty
      ? 'player' : state.government.loId;
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
  const newGov = result.governingParty;

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

  // new opposition = largest non-governing major party
  const ranked = (Object.entries(result.seats) as [PartyId, number][])
    .filter(([p]) => p !== newGov && PARTIES[p].major)
    .sort((a, b) => b[1] - a[1]);
  const newOpp = ranked[0]?.[0] ?? (newGov === prevGov ? prevOpp : prevGov);

  const changeOfGovernment = newGov !== prevGov;
  if (changeOfGovernment) {
    // the frontbenches swap across the despatch box
    const oldCabinet = state.government.cabinet;
    state.government.cabinet = state.government.shadowCabinet;
    state.government.shadowCabinet = oldCabinet;
    const oldPmId = state.government.pmId;
    state.government.pmId = state.government.loId;
    state.government.loId = oldPmId;
    state.government.pmSinceDay = state.day;
    state.history.push({
      kind: 'event', date: state.day,
      headline: `${PARTIES[newGov].name} wins the general election`,
    });
    if (state.government.pmId === 'player') {
      state.history.push({
        kind: 'roleChange', date: state.day, officeId: 'leader', how: 'becamePM',
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
  const sfSeats = result.seats.sf ?? 0;
  const votingSeats = 650 - sfSeats - 1;
  const govSeats = result.seats[newGov] ?? 0;
  state.government.majority = govSeats - (votingSeats - govSeats);

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
    if (playerIsLeader(state)) {
      // losing your own seat as leader ends the leadership immediately
      state.player.officeId = null;
      resolveNpcLeadership(state, rng, state.player.partyId);
    } else if (state.player.officeId) {
      stripOffice(state, rng, 'leftOffice');
    }
    state.forcedQueue.push({ kind: 'lostSeat' });
    // any leadership fallout in other parties resolves quietly
    settleNpcLeaderships(state, rng, prevGov, newGov, prevOpp);
    return;
  }

  // ---- player kept their seat ----
  // if the player's party fell off the frontbench track, they lose office
  const onTrack =
    state.player.partyId === newGov || state.player.partyId === newOpp;
  if (state.player.officeId && !playerIsLeader(state) && !onTrack) {
    stripOffice(state, rng, 'leftOffice');
  }

  // a retained portfolio flips between government and shadow (or vice versa) on a
  // change of government — record it so the career timeline and history show the
  // correct current title (e.g. Health Secretary → Shadow Health Secretary, or a
  // shadow minister taking up the real brief after a win)
  if (
    changeOfGovernment &&
    onTrack &&
    state.player.officeId &&
    !playerIsLeader(state)
  ) {
    const nowInGov = state.player.partyId === newGov;
    const title = officeTitle(state.player.officeId, nowInGov);
    state.history.push({
      kind: 'roleChange', date: state.day, officeId: state.player.officeId, how: 'continued',
    });
    state.history.push({
      kind: 'event', date: state.day,
      headline: nowInGov
        ? `${state.player.name} takes office as ${title}`
        : `${state.player.name} becomes ${title}`,
    });
  }

  // defeated leaders usually resign
  if (playerIsLeader(state) && state.player.partyId === prevGov && changeOfGovernment) {
    state.forcedQueue.push({
      kind: 'resignPrompt',
      payload: { reason: 'electionDefeat' },
    });
  }
  settleNpcLeaderships(state, rng, prevGov, newGov, prevOpp);
}

function settleNpcLeaderships(
  state: GameState,
  rng: Rng,
  prevGov: PartyId,
  newGov: PartyId,
  prevOpp: PartyId
): void {
  // outgoing governing party that lost: leader resigns 85% of the time.
  // opposition that failed to gain ground: leader resigns 25% of the time.
  // openLeadershipVacancy builds a named field and lets the player stand if
  // it's their party (fixes the old bug where post-election contests had no
  // named opponents).
  if (newGov !== prevGov && state.government.loId !== 'player' && rng.chance(0.85)) {
    openLeadershipVacancy(state, rng, prevGov);
  } else if (newGov === prevGov && state.government.loId !== 'player' && rng.chance(0.25)) {
    openLeadershipVacancy(state, rng, prevOpp);
  }
}

// ---------- forced events: materialise & resolve ----------

export function materializeForced(state: GameState, rng: Rng, ev: ForcedEvent): DrawnCard {
  switch (ev.kind) {
    case 'reshuffleOffer': {
      const officeId = ev.payload?.officeId as OfficeId;
      const sideways = ev.payload?.sideways === true;
      const title = officeTitleFor(officeId, {
        inGovernment: playerInGovernment(state),
        minorPartyName: minorPartyNameOf(state),
      });
      const from = onMinorPartyTrack(state)
        ? `the ${PARTIES[state.player.partyId].shortName} leader's office`
        : playerInGovernment(state) ? 'Number 10' : "the Leader's office";
      return {
        cardId: `forced_offer_${state.day}`,
        kind: 'reshuffleOffer',
        title: sideways ? 'A sideways glance' : 'The call',
        body: sideways
          ? `${from === 'Number 10' ? 'Number 10' : 'The Leader\'s office'} rings with an unusual offer: same rank, new brief — ${title}. A fresh start, a fresh department to master, and a quiet test of your flexibility.`
          : `Your phone buzzes. It's ${from}. They want you as ${title}. The whips are waiting on your answer.`,
        choices: [{ label: 'Accept the job' }, { label: 'Politely decline' }],
        payload: { officeId, advance: rng.int(7, 14) },
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
      return {
        cardId: `forced_stand_${state.day}`,
        kind: 'leadershipStand',
        title: 'The leadership is vacant',
        body: `The ${PARTIES[state.player.partyId].name} needs a new leader. ${field}, and the tea room is a hive of arithmetic. More than one colleague has glanced your way. Nomination papers close on Friday.`,
        choices: [{ label: 'Stand for leader' }, { label: 'Sit this one out' }],
        payload: { candidateIds, advance: rng.int(7, 14) },
      };
    }
    case 'leadershipBallot': {
      const round = (ev.payload?.round as number) ?? 1;
      const pass = { ...ev.payload, advance: rng.int(8, 14) };
      const candidateIds = (ev.payload?.candidateIds as string[]) ?? [];
      const finalistName = characterName(state, ev.payload?.finalistId as string);
      const elimNames = ((ev.payload?.eliminatedIds as string[]) ?? [])
        .map((id) => characterName(state, id)).join(' and ');
      if (round === 1) {
        const rivals = candidateIds.map((id) => characterName(state, id)).join(', ');
        return {
          cardId: `forced_ballot1_${state.day}`, kind: 'leadershipBallot',
          title: 'First ballot',
          body: `The field is set: you against ${rivals}. Your launch is tonight — lecterns polished, journalists fed and watered. What is your pitch?`,
          choices: [
            { label: 'Unity — heal the party' },
            { label: 'Bold change — rip up the script' },
            { label: 'Court the grassroots' },
          ],
          payload: pass,
        };
      }
      if (round === 2) {
        return {
          cardId: `forced_ballot2_${state.day}`, kind: 'leadershipBallot',
          title: 'Second ballot',
          body: `${elimNames ? `${elimNames} fell at the first ballot. ` : ''}The field narrows and the arithmetic sharpens. Where do you put your energy this week?`,
          choices: [
            { label: 'Work the parliamentary party' },
            { label: 'Tour the membership' },
            { label: 'Dominate the airwaves' },
          ],
          payload: pass,
        };
      }
      if (round === 3) {
        return {
          cardId: `forced_ballot3_${state.day}`, kind: 'leadershipBallot',
          title: 'The hustings',
          body: `${elimNames ? `${elimNames} now eliminated. ` : ''}The set-piece hustings is tonight, the hall packed, the cameras live. ${finalistName} is the one to beat. How do you play it?`,
          choices: [
            { label: 'A barnstorming, emotional speech' },
            { label: 'Sober, detailed, prime-ministerial' },
            { label: 'Take the fight straight to ' + finalistName },
          ],
          payload: pass,
        };
      }
      if (round === 4) {
        return {
          cardId: `forced_ballot4_${state.day}`, kind: 'leadershipBallot',
          title: 'The endorsement round',
          body: `It is down to you and ${finalistName}. The eliminated candidates' backers are suddenly the most courted MPs in the building, and their votes will decide this.`,
          choices: [
            { label: 'Offer the kingmakers big jobs' },
            { label: 'Win them over on the argument' },
            { label: 'No deals — run on your own terms' },
          ],
          payload: pass,
        };
      }
      return {
        cardId: `forced_ballot5_${state.day}`, kind: 'leadershipBallot',
        title: `Final ballot — you vs ${finalistName}`,
        body: `The membership ballot closes at noon. ${finalistName} has run a serious campaign and the polls are within the margin of error. Your closing move?`,
        choices: [
          { label: 'Go for the jugular' },
          { label: 'Stay relentlessly positive' },
          { label: 'Quietly promise jobs to waverers' },
        ],
        payload: pass,
      };
    }
    case 'pmReshuffle': {
      const side = playerInGovernment(state) ? 'cabinet' : 'shadowCabinet';
      const posts = state.government[side].filter((p) => p.characterId !== 'player');
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
            choices: ['A bold, transformative offer', 'Safety first — small targets, no hostages', "Steal the other side's best clothes"],
          },
          {
            title: 'The TV debate',
            body: 'Tonight: the head-to-head debate, live, eight million watching. Your prep team offers three strategies and warns that campaigns have died on this stage.',
            choices: ['Attack from the first answer', 'Statesmanlike — rise above it', 'Land the rehearsed zinger'],
          },
          {
            title: 'The wobble',
            body: 'Mid-campaign crisis: a candidate suspended over old posts, a costing that doesn\'t add up, and a poll showing the gap moving the wrong way. The morning press conference is in nine hours. The room looks at you.',
            choices: ['Own it — apologise and act fast', 'Brazen it out, change the subject', 'Counter-attack with opposition research'],
          },
          {
            title: 'The battleground blitz',
            body: 'Ten days left. The bus can only be in one place at a time, and the spreadsheet people are fighting about where. Your call, leader.',
            choices: ['Shore up the heartlands', 'Raid their marginals', 'Gamble on the unlikely new coalition'],
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
    case 'wilderness':
      return {
        cardId: `forced_wilderness_${state.day}`,
        kind: 'wilderness',
        title: 'Life outside',
        body: 'Civilian life is quieter. The constituency association still invites you to things, and the local paper still takes your calls. The next election is the road back.',
        choices: [
          { label: 'Keep your profile up locally' },
          { label: 'Earn money and lie low' },
        ],
        payload: { advance: rng.int(150, 200) },
      };
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
        giveOffice(state, rng, officeId, promoted ? 'promoted' : 'appointed');
        gain('partyStanding', 6, 'Standing');
        gain('profile', 8, 'Profile');
        const title = officeTitleFor(officeId, {
          inGovernment: playerInGovernment(state),
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
      if (choiceIndex === 0) {
        state.player.flags._ldrSupport = Math.round(leadershipBaseSupport(state));
        // rank the field by seeded strength (weakest first); strongest is the finalist
        const ranked = candidateIds
          .map((id) => ({ id, strength: rivalStrengthOf(state.characters[id], rng) }))
          .filter((r) => state.characters[r.id])
          .sort((a, b) => a.strength - b.strength);
        const finalist = ranked[ranked.length - 1];
        const challengers = ranked.slice(0, -1); // everyone but the finalist
        // split the challengers across the three ballot rounds (weakest go first)
        const elim: string[][] = [[], [], []];
        challengers.forEach((c, i) => {
          const bucket = challengers.length > 0
            ? Math.min(2, Math.floor((i * 3) / challengers.length))
            : 0;
          elim[bucket].push(c.id);
        });
        const finalistId = finalist?.id;
        const finalistStrength = finalist?.strength ?? 35;
        const avgRivalStrength = ranked.length
          ? ranked.reduce((a, r) => a + r.strength, 0) / ranked.length
          : 40;
        const base = {
          candidateIds, finalistId, finalistStrength,
          fieldSize: candidateIds.length, avgRivalStrength,
        };
        state.forcedQueue.unshift(
          { kind: 'leadershipBallot', payload: { ...base, round: 1, eliminatedIds: elim[0] } },
          { kind: 'leadershipBallot', payload: { ...base, round: 2, eliminatedIds: elim[1] } },
          { kind: 'leadershipBallot', payload: { ...base, round: 3, eliminatedIds: elim[2] } },
          { kind: 'leadershipBallot', payload: { ...base, round: 4 } },
          { kind: 'leadershipBallot', payload: { ...base, round: 5 } }
        );
        gain('profile', 6, 'Profile');
        return {
          text: 'You declare outside Parliament with your allies arranged behind you like a protective wall. The longest fortnight in politics begins.',
          deltas,
        };
      }
      resolveNpcLeadership(state, rng, state.player.partyId);
      gain('partyStanding', 2, 'Standing');
      const newLeader = characterName(state, getRelationship(state, 'leader')?.characterId);
      return {
        text: `You stay out of it and quietly back the winner. ${newLeader} takes the crown — and notes who was helpful.`,
        deltas,
      };
    }

    case 'leadershipBallot': {
      const round = (card.payload?.round as number) ?? 1;
      const support = (state.player.flags._ldrSupport as number) ?? 50;
      const finalistName = characterName(state, card.payload?.finalistId as string);
      const addSupport = (n: number) => {
        state.player.flags._ldrSupport = support + n;
        if (n !== 0) push('Support', Math.round(n));
      };

      // In each field-thinning ballot (rounds 1-3) the lowest-polling candidate
      // is knocked out. A long-shot (a backbencher who stood on a whim) is
      // usually that candidate — the bar rises each round toward the field's
      // average strength. Returns an elimination outcome, or null to continue.
      const checkEliminated = (preface: string): { text: string; deltas: StatDelta[] } | null => {
        const avg = (card.payload?.avgRivalStrength as number) ?? 40;
        const bar = avg * [0.5, 0.7, 0.9][round - 1] + rng.normal(0, 4);
        const current = (state.player.flags._ldrSupport as number) ?? support;
        if (current >= bar) return null;
        // eliminated — the strongest survivor (the finalist) goes on to win
        delete state.player.flags._ldrSupport;
        state.forcedQueue = state.forcedQueue.filter((e) => e.kind !== 'leadershipBallot');
        state.history.push({
          kind: 'leadershipContest', date: state.day, won: false, partyId: state.player.partyId,
        });
        state.player.flags._contestLossDay = state.day;
        state.player.flags._contestLosses =
          (((state.player.flags._contestLosses as number) ?? 0) + 1);
        resolveNpcLeadership(state, rng, state.player.partyId, card.payload?.finalistId as string);
        gain('profile', 2, 'Profile');
        const winner = characterName(state, getRelationship(state, 'leader')?.characterId);
        return {
          text: `${preface} It is not enough: you are eliminated in round ${round}, your support draining to stronger names. ${winner} goes on to take the crown. You return to the benches, your moment noted if not seized.`,
          deltas,
        };
      };

      if (round === 1) {
        let change = 0; let flavour = '';
        if (choiceIndex === 0) { change = 5 + rng.int(0, 4); flavour = 'The unity pitch lands well with weary colleagues.'; }
        if (choiceIndex === 1) { change = rng.int(-7, 13); flavour = change > 3 ? 'The radical pitch electrifies the contest.' : 'The radical pitch alarms the cautious middle.'; }
        if (choiceIndex === 2) { change = 3 + rng.int(0, 7); flavour = 'The members love you; MPs grumble about populism.'; }
        addSupport(change);
        return checkEliminated(flavour) ?? { text: `${flavour} You clear the first ballot and the field thins.`, deltas };
      }

      if (round === 2) {
        let change = 0; let flavour = '';
        if (choiceIndex === 0) { change = 4 + rng.int(0, 6); flavour = 'You spend the week in Portcullis House tea rooms; colleagues feel courted.'; }
        if (choiceIndex === 1) { change = rng.int(-2, 10); flavour = change > 4 ? 'The membership halls are rapturous.' : 'The membership is warm but the MPs you skipped notice.'; }
        if (choiceIndex === 2) { change = rng.int(-4, 12); flavour = change > 4 ? 'A commanding media week — you look like the frontrunner.' : 'The relentless media blitz tips into overexposure.'; }
        addSupport(change);
        return checkEliminated(flavour) ?? { text: `${flavour} The second ballot narrows it further.`, deltas };
      }

      if (round === 3) {
        // the hustings: a performance with a real chance of a great or poor night
        let change = 0; let text = '';
        if (choiceIndex === 0) {
          change = rng.chance(0.55) ? 8 + rng.int(0, 6) : -4 - rng.int(0, 4);
          text = change > 0
            ? 'The barnstormer brings the hall to its feet — the clip leads every bulletin.'
            : 'The big swing reads as bluster on television; the panel is unkind.';
        } else if (choiceIndex === 1) {
          change = 3 + rng.int(0, 5);
          text = 'Measured and detailed: no fireworks, but you look ready for Number 10.';
        } else {
          change = rng.chance(0.5) ? 7 + rng.int(0, 6) : -6 - rng.int(0, 4);
          text = change > 0
            ? `You best ${finalistName} in a head-on clash and the room knows it.`
            : `The attack on ${finalistName} backfires — they look gracious, you look desperate.`;
        }
        addSupport(change);
        return checkEliminated(text) ?? { text: `${text} It is down to you and ${finalistName}.`, deltas };
      }

      if (round === 4) {
        let change = 0; let text = '';
        if (choiceIndex === 0) {
          change = 7 + rng.int(0, 5);
          gain('integrity', -4, 'Integrity');
          text = 'Over discreet breakfasts you promise the great offices around. By noon the kingmakers are calling you "the unity candidate". Politics is a market; you paid the asking price.';
        } else if (choiceIndex === 1) {
          change = rng.int(-2, 11);
          text = change > 5
            ? 'You win the eliminated camps on the merits — persuaded, not purchased. Those votes are the durable kind.'
            : 'You make the case on merit; the kingmakers listen politely and split down the middle.';
        } else {
          change = rng.int(-1, 5);
          gain('integrity', 3, 'Integrity');
          text = '"No deals" becomes your defining line. Some backers drift to you on principle; the rest call it arrogance.';
        }
        addSupport(change);
        return { text, deltas };
      }

      // round 5 — the final head-to-head
      let change = 0;
      if (choiceIndex === 0) change = rng.int(-8, 14);
      if (choiceIndex === 1) change = rng.int(0, 8);
      if (choiceIndex === 2) { change = rng.int(4, 12); gain('integrity', -4, 'Integrity'); }
      delete state.player.flags._ldrSupport;

      const finalist = state.characters[card.payload?.finalistId as string];
      const baseStrength = (card.payload?.finalistStrength as number) ?? 35;
      const fieldSize = (card.payload?.fieldSize as number) ?? 3;
      // a bigger field means a more fractured, unpredictable membership ballot,
      // and the runner-up gathers an "anyone-but-the-frontrunner" coalition that
      // grows with how strong the player looks — so contests stay hard to win
      const finalistFinal =
        baseStrength + (fieldSize - 3) * 2 + 0.38 * support + rng.normal(0, 7);
      const playerFinal = support + change + rng.normal(0, 6);

      if (playerFinal >= finalistFinal && support + change >= LEADERSHIP_WIN_THRESHOLD - 21) {
        makePlayerLeader(state, rng);
        gain('profile', 15, 'Profile');
        gain('partyStanding', 10, 'Standing');
        if (finalist) {
          const rivalRel = state.relationships.find((r) => r.kind === 'rival');
          if (rivalRel) { rivalRel.characterId = finalist.id; rivalRel.value = -15; }
        }
        const office = playerInGovernment(state) ? 'Prime Minister' : 'Leader of the Opposition';
        return {
          text: `The returning officer reads the numbers${finalist ? ` — and ${finalist.name}'s face tells the room before the words do` : ''}. You have won. You are the leader of the party — and ${office}.`,
          deltas,
        };
      }
      state.history.push({
        kind: 'leadershipContest', date: state.day, won: false, partyId: state.player.partyId,
      });
      state.player.flags._contestLossDay = state.day;
      state.player.flags._contestLosses =
        (((state.player.flags._contestLosses as number) ?? 0) + 1);
      resolveNpcLeadership(state, rng, state.player.partyId, finalist?.id);
      gain('profile', 8, 'Profile');
      gain('partyStanding', -6, 'Standing');
      const winner = characterName(state, getRelationship(state, 'leader')?.characterId);
      return {
        text: `So close. ${winner} edges it on the final ballot. You give a generous concession speech that everyone agrees was leadership material — which stings.`,
        deltas,
      };
    }

    case 'pmReshuffle': {
      const inGov = playerInGovernment(state);
      const side = inGov ? 'cabinet' : 'shadowCabinet';
      const party = state.player.partyId;
      const posts = state.government[side].filter((p) => p.characterId !== 'player');
      const titleOf = (officeId: OfficeId) =>
        inGov ? OFFICES[officeId].title : OFFICES[officeId].shadowTitle;
      const headline = (text: string) =>
        state.history.push({ kind: 'event', date: state.day, headline: text });

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
        return {
          text: 'The team around the table is now unmistakably yours — government by people who answer your texts. The sketch writers reach for "chumocracy"; the excluded factions retreat to the tearoom to begin the long, patient work of resenting you.',
          deltas,
        };
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
        return {
          text: 'You hand your critics serious jobs, on the ancient theory about tents and the direction of urination. The commentariat calls it confident; the appointees, disarmed and slightly suspicious, start being useful.',
          deltas,
        };
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
        return {
          text: `${weakest?.name ?? 'The departed minister'} does not go quietly: a wounded interview on the Sunday shows, a pointed resignation letter "released to friends". The refresh was right — the handling, the papers agree, was not.`,
          deltas,
        };
      }
      return {
        text: 'Ruthless, swift, and — crucially — correct. The commentators call it a government with renewed purpose, and the new appointment is hailed as inspired. Somewhere, your old mentor smiles at the headlines.',
        deltas,
      };
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

    case 'wilderness': {
      if (choiceIndex === 0) {
        gain('constituencyApproval', 4, 'Approval');
        return { text: 'Fetes, food banks, and the local radio breakfast show. People remember who shows up.', deltas };
      }
      gain('profile', -2, 'Profile');
      return { text: 'Consultancy pays better than Parliament ever did. You bank it and bide your time.', deltas };
    }

    default:
      return { text: 'Time passes.', deltas };
  }
}

// ---------- resign office / sack ministers (player-initiated, from the UI) ----------

/** the player resigns their current office and returns to the backbenches.
 *  As leader/PM this opens a succession (an NPC takes over). */
export function resignOfficeCore(state: GameState, rng: Rng): void {
  if (!state.player.officeId) return;
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

/** the player (as PM or LO) sacks the NPC holding a given cabinet/shadow post */
export function sackMinisterCore(state: GameState, rng: Rng, officeId: OfficeId): void {
  if (!playerIsLeader(state)) return;
  const side = playerInGovernment(state) ? 'cabinet' : 'shadowCabinet';
  const post = state.government[side].find((p) => p.officeId === officeId);
  if (!post || post.characterId === 'player') return;
  const old = state.characters[post.characterId];
  if (old) { old.officeId = null; old.active = true; }
  const fresh = newFrontbencher(state, rng, state.player.partyId, officeId);
  post.characterId = fresh.id;
  const title = playerInGovernment(state) ? OFFICES[officeId].title : OFFICES[officeId].shadowTitle;
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

  // new leader and whips, starting lukewarm at best
  replaceLeader(state, partyLeaderId(state, rng, newParty), rng.int(-5, 5));
  const whipRel = state.relationships.find((r) => r.kind === 'chiefWhip');
  if (whipRel) {
    whipRel.characterId = partyWhipId(state, rng, newParty);
    whipRel.value = rng.int(-5, 5);
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
    headline: `${state.player.name} crosses the floor to join the ${PARTIES[newParty].name}`,
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
      shock(0.8);
      stat('integrity', -3, 'Integrity');
      return { text: 'You lift the other side\'s most popular policy wholesale and dare them to complain. They do, at length, which means a week of coverage explaining that you now own their best idea.', deltas };

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
      if (rng.chance(0.55)) {
        shock(1.7);
        stat('profile', 3, 'Profile');
        return { text: 'The zinger lands so perfectly the studio audience breaks the no-applause rule. It is the headline, the meme, and the moment. Your team watches it seventeen times on the bus home.', deltas };
      }
      shock(-1.3);
      return { text: 'You deploy the rehearsed line a beat too early, into the wrong context, and it dies in the silence. Their counter — clearly also rehearsed — does not. The internet is unkind.', deltas };

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
      stat('integrity', -3, 'Integrity');
      if (rng.chance(0.5)) {
        shock(1.0);
        return { text: 'Your opposition research lands like a depth charge — suddenly it is their candidates, their costings, their crisis. Brutal stuff. The gap moves your way while everyone\'s hands get dirty.', deltas };
      }
      shock(-1.0);
      return { text: 'The counter-attack misfires: your dossier has a factual error in paragraph two, and the story becomes your campaign\'s methods. The phrase "gutter politics" attaches itself to your lapel.', deltas };

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
      if (rng.chance(0.35)) {
        shock(2.0);
        stat('profile', 3, 'Profile');
        return { text: 'The unlikely coalition turns out to exist. The rallies swell, the registration numbers spike, and the pollsters start muttering about turnout models being wrong. Something is happening out there.', deltas };
      }
      shock(-1.0);
      return { text: 'The new coalition fails to materialise where it counts. The rallies were real; the votes, the data people gently explain, were not where the bus went. A week the campaign won\'t get back.', deltas };

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

export function buildLegacy(state: GameState): {
  yearsServed: number;
  highestOfficeTitle: string;
  electionsWon: number;
  headlines: string[];
} {
  // career levels: 0 backbencher, 1 minister, 2 cabinet, 3 party leader, 4 PM
  let level = 0;
  let cabinetTitle = '';
  let ministerTitle = '';
  for (const entry of state.history) {
    if (entry.kind !== 'roleChange') continue;
    if (entry.how === 'becamePM') {
      level = Math.max(level, 4);
    } else if (entry.how === 'electedLeader') {
      level = Math.max(level, 3);
    } else if (entry.officeId) {
      const office = OFFICES[entry.officeId];
      const inGov = governingPartyAt(state, entry.date) === state.player.partyId;
      const sideTitle = inGov ? office.title : office.shadowTitle;
      if (office.tier === 4) {
        level = Math.max(level, 2);
        cabinetTitle = sideTitle;
      } else if (office.tier >= 1 && office.tier <= 3) {
        level = Math.max(level, 1);
        if (!ministerTitle || office.tier === 3) ministerTitle = sideTitle;
      }
    }
  }
  const bestTitle =
    level === 4 ? 'Prime Minister'
    : level === 3 ? 'Party Leader'
    : level === 2 ? `Cabinet — ${cabinetTitle}`
    : level === 1 ? ministerTitle
    : 'Backbench MP';
  const electionsWon = Object.values(state.elections).filter((e) => e.playerHeldSeat).length;
  const headlines = state.history
    .filter((h) => h.kind === 'event')
    .slice(-6)
    .map((h) => (h as { headline: string }).headline);
  return {
    yearsServed: Math.max(1, Math.round((state.day - state.player.enteredParliament) / 365)),
    highestOfficeTitle: bestTitle,
    electionsWon,
    headlines,
  };
}
