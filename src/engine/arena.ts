import {
  ArenaId, ArenaSnapshot, CabinetPost, Character, DevolvedArenaId, Era, GameDay, GameState,
  ElectionResult, GovernmentState, PartyId, RegionId, Relationship, RelationshipKind,
  SyntheticSeat,
} from '../types/game';
import {
  CHAMBERS, chamberOf, DEVOLVED_ARENAS, isDevolved, nextFixedElectionDay, seatSystemAt,
} from '../data/chambers';
import { cabinetOfficesFor, OFFICES } from '../data/offices';
import {
  PARTIES, counterpartParty, isMajorIn, partyNameIn, playablePartiesForEra, polledPartiesForEra,
} from '../data/parties';
import { legislatureAt } from '../data/devolved';
import { PARLIAMENTS } from '../data/parliaments';
import {
  countSeats, generateDevolvedSeatMap, normalisedShares, pickDevolvedPlayerSeat,
} from '../generation/constituency';
import { generateCharacter } from '../generation/characters';
import { Rng, clamp } from './rng';
import { isoToDay } from './clock';
import { updatePolling } from './polling';
import { resignationPressure, runElection } from './election';
import { votingSeats, workingMajority } from './seats';
import { playerListRank } from './listSeats';

// ---------------------------------------------------------------------------
// freeze / thaw
// ---------------------------------------------------------------------------

/** Lift the chamber-shaped fields of GameState into a snapshot. Those fields
 *  stay at the top level of GameState while a chamber is live precisely so that
 *  career.ts and scheduler.ts need no changes; this is the only place that
 *  knows the list. Keep it in sync with ArenaSnapshot. */
export function freezeArena(state: GameState): ArenaSnapshot {
  return {
    arena: state.arena ?? 'uk',
    frozenDay: state.day,
    seats: state.seats,
    seatMap: state.seatMap,
    government: state.government,
    polling: state.polling,
    pollHistory: state.pollHistory,
    parliamentStart: state.parliamentStart,
    nextElectionBy: state.nextElectionBy,
    calendarDone: state.calendarDone,
    pendingContests: state.pendingContests ?? [],
    characters: state.characters,
    pmHistory: state.pmHistory,
    loHistory: state.loHistory ?? [],
    anchorShares: state.anchorShares
      ?? PARLIAMENTS[state.startEra].baselineShares,
    polledParties: state.polledParties ?? polledPartiesForEra(state.startEra),
    playerSeatId: state.player.seatId,
  };
}

/** Write a snapshot back into the live chamber fields. Does NOT touch the
 *  player — they are the one thing that crosses chambers. */
export function thawArena(state: GameState, snap: ArenaSnapshot): void {
  state.arena = snap.arena;
  state.seats = snap.seats;
  state.seatMap = snap.seatMap;
  state.government = snap.government;
  state.polling = snap.polling;
  state.pollHistory = snap.pollHistory;
  state.parliamentStart = snap.parliamentStart;
  state.nextElectionBy = snap.nextElectionBy;
  state.calendarDone = snap.calendarDone;
  state.pendingContests = snap.pendingContests;
  state.characters = snap.characters;
  state.pmHistory = snap.pmHistory;
  state.loHistory = snap.loHistory;
  state.anchorShares = snap.anchorShares;
  state.polledParties = snap.polledParties;
}

/** every npc id in play, live and dormant, so a new chamber's cast cannot
 *  collide with one the player has left behind */
function globalIdCounter(state: GameState): { value: number } {
  let max = 0;
  const scan = (chars: Record<string, Character>) => {
    for (const id of Object.keys(chars)) {
      const n = Number(id.replace('npc_', ''));
      if (!Number.isNaN(n) && n >= max) max = n + 1;
    }
  };
  scan(state.characters);
  for (const snap of Object.values(state.dormant ?? {})) scan(snap.characters);
  return { value: max };
}

function globalUsedNames(state: GameState): Set<string> {
  const used = new Set<string>([state.player.name]);
  for (const c of Object.values(state.characters)) used.add(c.name);
  for (const snap of Object.values(state.dormant ?? {})) {
    for (const c of Object.values(snap.characters)) used.add(c.name);
  }
  return used;
}

// ---------------------------------------------------------------------------
// building a devolved chamber
// ---------------------------------------------------------------------------

/** Generate a devolved legislature as it stood after its most recent real
 *  election on or before the current day: the real composition, a synthetic
 *  constituency and list map to match, a First Minister, an opposition leader
 *  and a cabinet. If that election is more than a term ago the caller catches
 *  the chamber up, which fights the elections since. */
export function buildDevolvedArena(
  state: GameState, rng: Rng, arena: DevolvedArenaId, playerParty: PartyId
): { snapshot: ArenaSnapshot; playerSeatId: string } {
  const chamber = CHAMBERS[arena];
  const region = chamber.regions[0];
  const snap = legislatureAt(arena, state.day);
  const electionDay = isoToDay(snap.election);
  const system = seatSystemAt(arena, electionDay);
  if (system.kind !== 'ams') throw new Error(`no snapshot map for ${arena} on ${snap.election}`);

  // the published list vote excludes the parties that won nothing; polling, the
  // swing anchor and the per-seat climate all have to be on one normalised scale
  const shares = normalisedShares(snap.shares, snap.parties);

  const { seatMap, playerSeatId } = generateDevolvedSeatMap(
    rng, arena, snap, system.regions, playerParty, state.startEra
  );
  const seats = countSeats(seatMap);

  const usedNames = globalUsedNames(state);
  const idCounter = globalIdCounter(state);
  const characters: Record<string, Character> = {};
  const add = (c: Character) => { characters[c.id] = c; return c; };

  const gov = snap.governing;
  const opp = snap.opposition;

  const fm = add(generateCharacter(rng, usedNames, {
    partyId: gov, officeId: chamber.leaderOffice, minAge: 44, maxAge: 63,
    competenceMean: 60, traitBias: ['ambitious', 'charming'], region,
  }, idCounter));
  const oppLeader = add(generateCharacter(rng, usedNames, {
    partyId: opp, officeId: chamber.leaderOffice, minAge: 42, maxAge: 62,
    competenceMean: 57, traitBias: ['ambitious'], region,
  }, idCounter));

  const cabinet: CabinetPost[] = [];
  const shadowCabinet: CabinetPost[] = [];
  for (const officeId of cabinetOfficesFor(arena)) {
    cabinet.push({
      officeId,
      characterId: add(generateCharacter(rng, usedNames, {
        partyId: gov, officeId, competenceMean: 55, region,
      }, idCounter)).id,
    });
    shadowCabinet.push({
      officeId,
      characterId: add(generateCharacter(rng, usedNames, {
        partyId: opp, officeId, competenceMean: 53, region,
      }, idCounter)).id,
    });
  }

  const startDay = state.day;
  const government: GovernmentState = {
    governingParty: gov,
    oppositionParty: opp,
    pmId: fm.id,
    loId: oppLeader.id,
    cabinet,
    shadowCabinet,
    majority: workingMajority(seats, gov),
    pmSinceDay: electionDay <= startDay ? electionDay : startDay,
    arrangement: snap.arrangement,
    ...(snap.coalitionPartner ? { coalitionPartner: snap.coalitionPartner } : {}),
    ...(snap.confidencePartner ? { confidencePartner: snap.confidencePartner } : {}),
    termsInPower: 1,
    loInheritedPolls: (shares[opp] ?? 0) * 100,
  };

  // a fixed-term chamber's next polling day follows from the last one, even when
  // that lands in the past: catchUpArena then fights the elections in the gap
  const nextElectionBy = electionDay <= startDay
    ? nextFixedElectionDay(electionDay)
    : nextFixedElectionDay(startDay);

  return {
    playerSeatId,
    snapshot: {
      arena,
      frozenDay: startDay,
      seats,
      seatMap,
      government,
      polling: { shares: { ...shares }, lastUpdated: Math.min(startDay, electionDay) },
      pollHistory: [{ day: Math.min(startDay, electionDay), shares: { ...shares } }],
      parliamentStart: Math.min(startDay, electionDay),
      nextElectionBy,
      calendarDone: {},
      pendingContests: [],
      characters,
      pmHistory: [{
        characterId: fm.id, name: fm.name, partyId: gov,
        startDay: Math.min(startDay, electionDay), endDay: null,
      }],
      loHistory: [{
        characterId: oppLeader.id, name: oppLeader.name, partyId: opp,
        startDay: Math.min(startDay, electionDay), endDay: null,
      }],
      anchorShares: { ...shares },
      polledParties: snap.parties,
      playerSeatId,
    },
  };
}

// ---------------------------------------------------------------------------
// catching a dormant chamber up
// ---------------------------------------------------------------------------

/** the parties contesting the live chamber */
function arenaParties(state: GameState): PartyId[] {
  return state.polledParties ?? CHAMBERS[state.arena ?? 'uk']?.parties ?? [];
}

/** the party that should lead the opposition given a seat result */
function pickOpposition(
  seats: Partial<Record<PartyId, number>>, governing: PartyId
): PartyId {
  const ranked = (Object.entries(seats) as [PartyId, number][])
    .filter(([p]) => p !== governing && p !== 'spk' && p !== 'ind' && p !== 'sf')
    .sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? governing;
}

const POPULISTS: PartyId[] = ['ukip', 'brexit', 'reform'];

/** A partner for a caught-up minority in a chamber where minorities are the
 *  norm: the nearest party by ideology that gets the government over the line,
 *  as the Greens did for the SNP in 2021 and the Lib Dems for Labour at Holyrood
 *  before 2007. Returns null when nobody fits, and the minority governs alone. */
function devolvedPartner(
  state: GameState, rng: Rng, governing: PartyId
): { party: PartyId; kind: 'coalition' | 'supplyConfidence' } | null {
  const seats = state.seats;
  const short = Math.max(0, -workingMajority(seats, governing));
  if (short === 0) return null;
  const gov = PARTIES[governing];
  const candidates = (Object.keys(seats) as PartyId[])
    .filter((p) => p !== governing && PARTIES[p] && (seats[p] ?? 0) >= short)
    .filter((p) => p !== 'spk' && p !== 'ind' && !POPULISTS.includes(p))
    // the Conservatives and the nationalists have never governed together
    .filter((p) => !((governing === 'con' && (p === 'snp' || p === 'pc' || p === 'sgp'))
      || (p === 'con' && (governing === 'snp' || governing === 'pc'))))
    .map((p) => ({ p, d: Math.abs(PARTIES[p].ideology - gov.ideology) }))
    .filter((x) => x.d <= 45)
    .sort((a, b) => a.d - b.d);
  if (candidates.length === 0) return null;
  // a deal is struck a little over half the time; a formal coalition is the
  // rarer form, and more likely when the partner is close
  if (!rng.chance(0.55)) return null;
  const pick = candidates[0];
  return { party: pick.p, kind: pick.d <= 20 && rng.chance(0.5) ? 'coalition' : 'supplyConfidence' };
}

/** install an all-NPC government after a dormant chamber's election. The
 *  player-facing `applyElectionAftermath` is deliberately NOT used — it is
 *  entirely about the player's own career, and the player is not here. */
function installNpcGovernment(
  state: GameState, rng: Rng, governing: PartyId,
  /** the standings this election replaced, for the performance gradient */
  prevSeats: Partial<Record<PartyId, number>> = {},
  /** did the incoming government win an outright majority */
  wonMajority = false
): void {
  const arena = state.arena ?? 'uk';
  const chamber = chamberOf(arena);
  const opposition = pickOpposition(state.seats, governing);
  const gv = state.government;
  const prevGoverning = gv.governingParty;

  const usedNames = globalUsedNames(state);
  const idCounter = globalIdCounter(state);
  const sittingLeader = (party: PartyId) => Object.values(state.characters).find(
    (c) => c.partyId === party && c.officeId === chamber.leaderOffice && c.active
  );
  const freshLeader = (party: PartyId): string => {
    const c = generateCharacter(rng, usedNames, {
      partyId: party, officeId: chamber.leaderOffice, minAge: 42, maxAge: 63,
      competenceMean: 58, traitBias: ['ambitious'], region: chamber.regions[0],
    }, idCounter);
    state.characters[c.id] = c;
    return c.id;
  };
  const leaderOf = (party: PartyId): string => sittingLeader(party)?.id ?? freshLeader(party);

  // A leader who has just lost usually goes. Without this a dormant chamber
  // keeps the same two or three people at the top for the whole game: nothing
  // ever removed them, so forty years and ten elections produced exactly one
  // leader per party, alternating. Losing is what ends most leaderships.
  const LOSS_RESIGNS = 0.7;      // led the party out of government
  const FAILED_AGAIN = 0.45;     // another go from opposition, still not in
  const WON_ANYWAY = 0.12;       // ill health, scandal, or a long enough innings
  for (const party of arenaParties(state)) {
    const leader = sittingLeader(party);
    if (!leader) continue;
    const wasGoverning = party === prevGoverning;
    const nowGoverning = party === governing;
    const base = wasGoverning && !nowGoverning ? LOSS_RESIGNS
      : !nowGoverning ? FAILED_AGAIN
        : WON_ANYWAY;
    const chance = base * resignationPressure(
      state.seats[party] ?? 0,
      prevSeats[party] ?? 0,
      nowGoverning && wonMajority
    );
    if (!rng.chance(Math.min(chance, 0.95))) continue;
    leader.officeId = null;
    leader.active = false;
    const heir = state.characters[freshLeader(party)];
    state.history.push({
      kind: 'event', date: state.day,
      headline: nowGoverning
        ? `${leader.name} steps down; ${heir.name} takes over as ${partyNameIn(party, arena)} leader`
        : `${leader.name} resigns as ${partyNameIn(party, arena)} leader after the ${chamber.place === 'the country' ? 'general' : chamber.place} election`,
    });
  }

  const pmId = leaderOf(governing);
  const loId = leaderOf(opposition);
  const majority = workingMajority(state.seats, governing);

  if (gv.pmId !== pmId) {
    const open = state.pmHistory.find((t) => t.endDay === null);
    if (open) open.endDay = state.day;
    const pm = state.characters[pmId];
    state.pmHistory.push({
      characterId: pmId, name: pm?.name ?? chamber.head, partyId: governing,
      startDay: state.day, endDay: null,
    });
    gv.pmSinceDay = state.day;
  }
  if (gv.loId !== loId) {
    const open = (state.loHistory ?? []).find((t) => t.endDay === null);
    if (open) open.endDay = state.day;
    const lo = state.characters[loId];
    state.loHistory = [...(state.loHistory ?? []), {
      characterId: loId, name: lo?.name ?? 'the Leader of the Opposition',
      partyId: opposition, startDay: state.day, endDay: null,
    }];
  }

  gv.governingParty = governing;
  gv.oppositionParty = opposition;
  gv.pmId = pmId;
  gv.loId = loId;
  // the benches change hands with the government. Without this a dormant
  // chamber kept the OLD government's ministers in post.
  rebuildBenches(state, rng, governing, opposition);
  gv.majority = majority;
  delete gv.coalitionPartner;
  delete gv.confidencePartner;
  delete gv.deputyPmId;
  if (majority > 0) {
    gv.arrangement = 'majority';
  } else {
    gv.arrangement = 'minority';
    const deal = isDevolved(arena) ? devolvedPartner(state, rng, governing) : null;
    if (deal) {
      gv.arrangement = deal.kind;
      if (deal.kind === 'coalition') gv.coalitionPartner = deal.party;
      else gv.confidencePartner = deal.party;
      state.history.push({
        kind: 'event', date: state.day,
        headline: deal.kind === 'coalition'
          ? `${partyNameIn(governing, arena)} and ${partyNameIn(deal.party, arena)} agree a coalition at ${chamber.seat}`
          : `${partyNameIn(governing, arena)} strikes a co-operation agreement with ${partyNameIn(deal.party, arena)}`,
      });
    }
  }
  gv.termsInPower = governing === prevGoverning ? (gv.termsInPower ?? 1) + 1 : 1;
  gv.loInheritedPolls = (state.polling.shares[opposition] ?? 0) * 100;
}

/** Hand every frontbench post to somebody from the party that now holds it,
 *  keeping anyone already of the right party in place so a re-elected government
 *  does not churn its whole cabinet. */
function rebuildBenches(
  state: GameState, rng: Rng, governing: PartyId, opposition: PartyId
): void {
  const usedNames = globalUsedNames(state);
  const idCounter = globalIdCounter(state);
  const sides: [('cabinet' | 'shadowCabinet'), PartyId][] = [
    ['cabinet', governing],
    ['shadowCabinet', opposition],
  ];
  for (const [side, party] of sides) {
    for (const post of state.government[side]) {
      const sitting = state.characters[post.characterId];
      if (sitting && sitting.active && sitting.partyId === party) continue;
      // the outgoing holder keeps their seat but loses the title, so they never
      // linger as a minister of a department they no longer run
      if (sitting && sitting.officeId === post.officeId) sitting.officeId = null;
      const fresh = generateCharacter(rng, usedNames, {
        partyId: party, officeId: post.officeId, competenceMean: 55,
        region: chamberOf(state.arena).regions[0],
      }, idCounter);
      state.characters[fresh.id] = fresh;
      post.characterId = fresh.id;
    }
  }
}

/** A "ghost player" for running an election in a chamber the player is not in.
 *  Every personal term in the seat model reads zero for them: hasSeat false
 *  kills the incumbency bonus, approval of exactly 50 kills the personal vote,
 *  and no `defected` flag kills the defection penalty. So a dormant election
 *  perturbs no seat, and the result is the same one the world would have had. */
function ghostPlayer(state: GameState): GameState['player'] {
  return {
    ...state.player,
    partyId: 'ind',
    hasSeat: false,
    officeId: null,
    officeSinceDay: null,
    // deliberately matches NO seat in this map
    seatId: '',
    stats: { ...state.player.stats, constituencyApproval: 50 },
    flags: {},
  };
}

/** Run a dormant chamber's clock forward to `toDay`: polling drift, and a
 *  general election on every fixed date that falls in the gap. Headlines are
 *  dated to when they happened, so the History screen reads correctly even
 *  though the work was deferred to the moment the player looked. */
export function catchUpArena(state: GameState, rng: Rng, toDay: number): void {
  const arena = state.arena ?? 'uk';
  const chamber = chamberOf(arena);
  const realPlayer = state.player;
  const realDay = state.day;
  state.player = ghostPlayer(state);

  // Any leadership contest that was in flight when the player walked out has
  // long since concluded. Settle it now rather than leaving it frozen in the
  // snapshot to fire years later and overwrite a government two elections newer.
  for (const contest of state.pendingContests ?? []) {
    if (contest.resolveDay > toDay) continue;
    const winner = state.characters[contest.winnerId];
    if (winner) {
      for (const c of Object.values(state.characters)) {
        if (c.partyId === contest.party && c.officeId === 'leader') c.officeId = null;
      }
      winner.officeId = 'leader';
      if (state.government.governingParty === contest.party) {
        state.government.pmId = winner.id;
      } else if (state.government.oppositionParty === contest.party) {
        state.government.loId = winner.id;
      }
      state.history.push({
        kind: 'event', date: contest.resolveDay,
        headline: `${winner.name} wins the ${partyNameIn(contest.party, arena)} leadership`,
      });
    }
  }
  state.pendingContests = (state.pendingContests ?? []).filter((c) => c.resolveDay > toDay);

  try {
    let guard = 0;
    while (state.nextElectionBy <= toDay && guard++ < 40) {
      const pollDay = state.nextElectionBy;
      state.day = pollDay;
      updatePolling(state, rng, pollDay);
      const prevSeats = { ...state.seats };
      const { result } = runElection(state, rng);
      // the ghost's own "result" is meaningless — drop it before it is stored
      result.playerResult = null;
      result.playerHeldSeat = false;
      installNpcGovernment(
        state, rng, result.governingParty, prevSeats, result.outcome === 'majority'
      );
      state.parliamentStart = pollDay;
      state.nextElectionBy = chamber.fixedTerm
        ? nextFixedElectionDay(pollDay)
        : pollDay + chamber.termDays;
      state.pollHistory = [{ day: pollDay, shares: { ...state.polling.shares } }];
      state.history.push({
        kind: 'event', date: pollDay,
        headline: `${partyNameIn(result.governingParty, arena)} ${
          result.outcome === 'majority' ? 'wins a majority' : 'forms a minority government'
        } ${arena === 'uk' ? 'at the general election' : `at ${chamber.seat}`}`,
      });
    }
    state.day = toDay;
    updatePolling(state, rng, toDay);
  } finally {
    state.player = realPlayer;
    state.day = realDay;
  }
  // keep the chronicle readable after a long absence
  state.history.sort((a, b) => a.date - b.date);
}

// ---------------------------------------------------------------------------
// incoming seniority
// ---------------------------------------------------------------------------

/** the eligibility bonus a newcomer's previous career is worth, by the peak
 *  tier they held in the chamber they left. A low party-standing transfer is
 *  right — a new group does not know you — but on its own it would make a
 *  former Prime Minister a nobody at Holyrood, which is not how it works. Your
 *  reputation arrives even though your standing does not. */
const INCOMING_BONUS: Record<number, number> = {
  0: 0, 1: 2, 2: 3, 3: 7, 4: 11, 5: 17,
};
/** years the bonus holds at full strength, and the years it then fades over */
const SENIORITY_FULL_YEARS = 3;
const SENIORITY_FADE_YEARS = 3;

/** the live value of the player's incoming-seniority bonus, decaying to nothing
 *  once they have had time to build a record of their own here */
export function incomingSeniorityBonus(state: GameState): number {
  const tier = Number(state.player.flags._incomingTier ?? 0);
  const since = Number(state.player.flags._incomingDay ?? 0);
  if (!tier || !since) return 0;
  const years = (state.day - since) / 365;
  if (years <= SENIORITY_FULL_YEARS) return INCOMING_BONUS[tier] ?? 0;
  const fade = 1 - (years - SENIORITY_FULL_YEARS) / SENIORITY_FADE_YEARS;
  return fade <= 0 ? 0 : (INCOMING_BONUS[tier] ?? 0) * fade;
}

// ---------------------------------------------------------------------------
// the jump
// ---------------------------------------------------------------------------

/** How much of each stat survives the move. Everything you are travels whole —
 *  your record, your name, your ability, and the reputation as a constituency
 *  member that got you re-elected. The one exception is standing with the
 *  group, because a group you have never sat with does not owe you anything:
 *  that is the cost of the move, and the incoming-seniority bonus is what stops
 *  it being crippling. */
const STANDING_MIN = 0.55;
const STANDING_MAX = 0.62;
function standingFloor(tier: number): number {
  return 32 + 3 * tier;
}
/** the relationships that follow you. A journalist covers whatever you do; an
 *  old mentor still takes your call. Your leader, whip, ally and rival all sit
 *  in a chamber you have left. */
const PORTABLE: RelationshipKind[] = ['mentor', 'journalist'];

/** the minimum public profile at which another chamber comes recruiting */
export const JUMP_MIN_PROFILE = 45;
/** you cannot jump twice in quick succession — carpetbagging has a smell */
export const JUMP_COOLDOWN_DAYS = 365 * 3;

/** can the player move chambers at all right now */
export function canJump(state: GameState): boolean {
  if (state.gameOver || !state.player.hasSeat) return false;
  if (state.player.partyId === 'ind' || state.player.flags._isSpeaker) return false;
  if (state.player.stats.profile < JUMP_MIN_PROFILE) return false;
  const last = Number(state.player.flags._lastJumpDay ?? 0);
  if (last && state.day - last < JUMP_COOLDOWN_DAYS) return false;
  return jumpTargets(state).length > 0;
}

/** The nation a career belongs to, once it has one. A member who has sat at
 *  Holyrood is a politician OF Scotland; the whole point of the seniority they
 *  carry is that people there know who they are. Recorded the first time they sit
 *  in a devolved chamber. */
export function homeNation(state: GameState): DevolvedArenaId | null {
  const flag = state.player.flags._homeNation;
  if (typeof flag === 'string' && DEVOLVED_ARENAS.includes(flag as DevolvedArenaId)) {
    return flag as DevolvedArenaId;
  }
  const arena = state.arena ?? 'uk';
  return arena === 'uk' ? null : (arena as DevolvedArenaId);
}

/** The chambers the player could move to: the Commons, and the legislature of
 *  their own nation — the one their career is already locked to, or failing
 *  that the one their constituency sits in. A member for a Glasgow seat standing
 *  for Holyrood is a career move; the same member standing in Cardiff is not. */
export function jumpTargets(state: GameState): ArenaId[] {
  const own = homeNation(state) ?? regionArena(state.player.region);
  const all: ArenaId[] = own ? ['uk', own] : ['uk'];
  return all.filter((a) => a !== (state.arena ?? 'uk'));
}

/** the devolved chamber of a region, if one is built */
function regionArena(region: RegionId): DevolvedArenaId | null {
  return DEVOLVED_ARENAS.includes(region as DevolvedArenaId)
    ? (region as DevolvedArenaId)
    : null;
}

/** The parties the player may join in `target`, their own first. For the
 *  Commons that is the era's playable parties that contest their nation; for a
 *  devolved chamber it is the parliament's ballot. */
export function jumpPartyOptions(state: GameState, target: ArenaId): PartyId[] {
  const natural = counterpartParty(state.player.partyId, target);
  const nation = homeNation(state) ?? regionArena(state.player.region) ?? 'scotland';
  const all = target === 'uk'
    ? playablePartiesForEra(state.startEra).filter((p) => PARTIES[p].contestsRegions.includes(nation))
    : ballotOf(state, target as DevolvedArenaId);
  return [...all].sort((a, b) => (b === natural ? 1 : 0) - (a === natural ? 1 : 0));
}

/** the parties contesting a chamber right now: the frozen state if the player
 *  has been there before, else the legislature they would walk into today */
function ballotOf(state: GameState, arena: DevolvedArenaId): PartyId[] {
  const dormant = state.dormant?.[arena];
  if (dormant) return dormant.polledParties;
  return legislatureAt(arena, state.day).parties;
}

export interface JumpOutcome {
  from: ArenaId;
  to: ArenaId;
  party: PartyId;
  seatName: string;
  /** the peak tier carried in from the chamber just left */
  carriedTier: number;
  /** true when the chosen party is not their political family's counterpart */
  switchedFamily: boolean;
}

/** Move the player to another chamber. One-way for JUMP_COOLDOWN_DAYS: they
 *  resign their seat and any office, choose a party, and are returned for a
 *  seat in the new House. The seat is guaranteed — nobody gives up a safe seat
 *  without a nomination sewn up — but WHICH seat is drawn from the chamber, and
 *  may well be a marginal, or a list place. */
export function jumpToArena(
  state: GameState, rng: Rng, target: ArenaId, party: PartyId,
  opts: { seatRegion?: RegionId; byPartyStrength?: boolean; asDraftedLeader?: boolean } = {}
): JumpOutcome {
  const from = state.arena ?? 'uk';
  const carriedTier = Math.max(
    Number(state.player.flags._peakTier ?? 0),
    state.player.officeId ? OFFICES[state.player.officeId]?.tier ?? 0 : 0
  );
  const natural = counterpartParty(state.player.partyId, target);
  const switchedFamily = natural !== null && party !== natural;

  // 1. leave: vacate the office, keep the career record. The bench seat has to
  // be handed to somebody — otherwise the chamber freezes with 'player' still
  // sitting in its cabinet.
  vacatePlayerBench(state, rng);
  state.player.officeId = null;
  state.player.officeSinceDay = null;
  state.player.committeeChair = null;
  state.player.hasSeat = false;
  state.history.push({
    kind: 'roleChange', date: state.day, officeId: null, how: 'resigned', arena: from,
  });

  // 2. freeze the chamber being left
  state.dormant = { ...(state.dormant ?? {}), [from]: freezeArena(state) };

  // 3. thaw or build the destination, catching it up to today
  const existing = state.dormant?.[target];
  let seatId: string;
  if (existing) {
    thawArena(state, existing);
    delete state.dormant[target];
    catchUpArena(state, rng, state.day);
    seatId = pickSeatFor(state, rng, party, existing.playerSeatId, {
      region: opts.seatRegion,
      byPartyStrength: opts.byPartyStrength,
      safest: opts.asDraftedLeader,
    });
  } else {
    const built = buildDevolvedArena(state, rng, target as DevolvedArenaId, party);
    thawArena(state, built.snapshot);
    delete state.dormant[target];
    if (state.nextElectionBy <= state.day) {
      // the real result on record is more than a term old: fight the elections since
      catchUpArena(state, rng, state.day);
      seatId = pickSeatFor(state, rng, party, null, { safest: opts.asDraftedLeader });
    } else {
      seatId = opts.asDraftedLeader
        ? pickSeatFor(state, rng, party, built.playerSeatId, { safest: true })
        : built.playerSeatId;
    }
  }

  // 4. carry the person across
  const portable = state.relationships.filter((r) => PORTABLE.includes(r.kind));
  const carried: Relationship[] = [];
  const oldChars = state.dormant[from]?.characters ?? {};
  for (const rel of portable) {
    const c = oldChars[rel.characterId];
    if (!c) continue;
    if (!state.characters[c.id]) {
      state.characters[c.id] = { ...c, officeId: null };
    }
    carried.push({ ...rel });
  }
  state.relationships = carried;
  seatPersonalCast(state, rng, party, carried);

  // profile, competence, integrity and constituency approval all carry unchanged
  const s = state.player.stats;
  const rate = STANDING_MIN + rng.next() * (STANDING_MAX - STANDING_MIN);
  // the floor lifts a former big beast toward respectability, but it cannot
  // erase a genuine collapse — otherwise a leader about to be couped could
  // launder a standing of 5 into 43 by moving chambers. A leader the members
  // have just chosen arrives with a mandate; an ordinary arrival does not.
  const baseFloor = opts.asDraftedLeader ? 58 : standingFloor(carriedTier);
  const floor = Math.min(baseFloor, s.partyStanding + (opts.asDraftedLeader ? 40 : 15));
  const penalty = switchedFamily ? 6 : 0;
  s.partyStanding = clamp(
    Math.round(Math.max(s.partyStanding * rate - penalty, floor - penalty)),
    0, 100
  );
  if (switchedFamily) s.integrity = clamp(s.integrity - 5, 0, 100);

  state.player.partyId = party;
  state.player.seatId = seatId;
  state.player.hasSeat = true;
  state.player.rebellionCount = 0;
  const seat = state.seatMap.find((x) => x.id === seatId);
  if (seat) {
    for (const x of state.seatMap) if (x.isPlayerSeat && x.id !== seatId) delete x.isPlayerSeat;
    seat.isPlayerSeat = true;
    state.player.region = seat.region;
  }

  // 5. the seniority you arrive with, and the clock it decays on
  state.player.flags._incomingTier = carriedTier;
  state.player.flags._incomingDay = state.day;
  state.player.flags._lastJumpDay = state.day;
  // the first devolved chamber they sit in is the one they belong to from now on
  if (target !== 'uk') state.player.flags._homeNation = target;
  // the anti-incumbency clock is about THIS seat, which has never seen you.
  // enteredParliament stays career-long, for years-served.
  state.player.flags._seatSinceDay = state.day;
  // favours and pledges are owed by people in a chamber you have left
  state.player.favours = [];
  state.player.promises = [];
  delete state.player.flags.defected;
  delete state.player.flags._isSpeaker;
  delete state.player.flags._isDeputyPM;
  delete state.player.flags._govOverlayOpen;
  delete state.player.flags._sackExileUntil;
  delete state.player.flags._passedOverUntil;
  delete state.player.flags._lastReshuffleOfferDay;
  delete state.player.flags.scandal;

  // 6. transient per-chamber play state
  state.currentCard = null;
  state.forcedQueue = [];
  state.cardHistory = {};
  state.lastCardId = null;

  const chamber = chamberOf(target);
  const seatName = seat?.name ?? chamber.place;
  state.history.push({
    kind: 'arenaChange', date: state.day, from, to: target, partyId: party,
  });
  state.history.push({
    kind: 'enteredParliament', date: state.day, seatName, arena: target,
  });
  state.history.push({
    kind: 'event', date: state.day,
    headline: seat?.kind === 'list'
      ? `${state.player.name} returned as a ${partyNameIn(party, target)} list ${chamber.member} for ${seatName.replace(' (regional list)', '')}`
      : `${state.player.name} wins ${seatName} for ${partyNameIn(party, target)}`,
  });

  return { from, to: target, party, seatName, carriedTier, switchedFamily };
}

/** hand the player's frontbench post to a new NPC before the chamber is frozen */
function vacatePlayerBench(state: GameState, rng: Rng): void {
  const usedNames = globalUsedNames(state);
  const idCounter = globalIdCounter(state);
  for (const side of ['cabinet', 'shadowCabinet'] as const) {
    for (const post of state.government[side]) {
      if (post.characterId !== 'player') continue;
      const c = generateCharacter(rng, usedNames, {
        partyId: side === 'cabinet' ? state.government.governingParty : state.government.oppositionParty,
        officeId: post.officeId, competenceMean: 55,
      }, idCounter);
      state.characters[c.id] = c;
      post.characterId = c.id;
    }
  }
  if (state.government.pmId === 'player') {
    const open = state.pmHistory.find((t) => t.endDay === null);
    if (open) open.endDay = state.day;
  }
  if (state.government.loId === 'player') {
    const open = (state.loHistory ?? []).find((t) => t.endDay === null);
    if (open) open.endDay = state.day;
  }
  if (state.government.deputyPmId === 'player') state.government.deputyPmId = undefined;
}

/** a seat for a returning or arriving member: their old one if their new party
 *  can still plausibly hold it, else one the party holds, else the most winnable
 *  flipped. In a devolved chamber a party with no constituencies hands out a list
 *  place instead. */
function pickSeatFor(
  state: GameState, rng: Rng, party: PartyId, previousSeatId: string | null,
  opts: { region?: RegionId; byPartyStrength?: boolean; safest?: boolean } = {}
): string {
  for (const s of state.seatMap) delete s.isPlayerSeat;
  const arena = state.arena ?? 'uk';
  const margin = (seat: SyntheticSeat) => {
    const mine = seat.shares[party] ?? 0;
    const best = Math.max(0, ...Object.entries(seat.shares)
      .filter(([p]) => p !== party).map(([, v]) => v ?? 0));
    return mine - best;
  };

  if (isDevolved(arena)) {
    const constituencies = state.seatMap.filter((x) => x.kind !== 'list');
    const held = constituencies.filter((x) => x.winner === party);
    if (opts.safest && held.length > 0) {
      const best = [...held].sort((a, b) => margin(b) - margin(a))[0];
      best.isPlayerSeat = true;
      return best.id;
    }
    const previous = previousSeatId ? state.seatMap.find((s) => s.id === previousSeatId) : undefined;
    if (previous && previous.winner === party && previous.kind !== 'list') {
      previous.isPlayerSeat = true;
      return previous.id;
    }
    return pickDevolvedPlayerSeat(rng, state.seatMap, party, opts.safest ? 1 : playerListRank(state));
  }

  // A politician stands where they are from. Every branch below prefers the
  // player's own nation and only widens the search when the party holds
  // nothing there.
  const home = opts.region ?? state.player.region;
  const atHome = state.seatMap.filter((x) => x.region === home && x.winner !== 'spk');
  const heldHere = atHome.filter((x) => x.winner === party);
  const held = heldHere.length > 0
    ? heldHere
    : (atHome.length > 0 ? [] : state.seatMap.filter((x) => x.winner === party));

  const finish = (seat: SyntheticSeat): string => { seat.isPlayerSeat = true; return seat.id; };

  if (opts.safest && held.length > 0) {
    return finish([...held].sort((a, b) => margin(b) - margin(a))[0]);
  }

  const previous = previousSeatId
    ? state.seatMap.find((s) => s.id === previousSeatId)
    : undefined;
  if (previous && previous.winner === party) return finish(previous);

  // A recruited candidate does not choose their seat, and the association can
  // only offer what it holds. Where the party is strong locally that is a safe
  // seat; where it is weak it is whatever is going.
  if (opts.byPartyStrength && held.length > 0) {
    const ranked = [...held].sort((a, b) => margin(a) - margin(b));
    const strength = clamp((state.polling.shares[party] ?? 0.2) / 0.45, 0, 1);
    const idx = Math.min(ranked.length - 1, Math.floor(strength * (ranked.length - 1)));
    const jitter = rng.int(-1, 1);
    return finish(ranked[clamp(idx + jitter, 0, ranked.length - 1)]);
  }

  if (held.length > 0) return finish(rng.pick(held));

  // the party holds nothing at home: take the seat where it runs strongest there
  // and flip it — still at home, and still a marginal they have to defend
  const best = [...(atHome.length > 0 ? atHome : state.seatMap.filter((x) => x.winner !== 'spk'))].sort(
    (a, b) => (b.shares[party] ?? 0) - (a.shares[party] ?? 0)
  )[0];
  const loser = best.winner;
  const loserShare = best.shares[loser] ?? 0.4;
  const flipMargin = 0.01 + rng.next() * 0.03;
  best.shares[party] = loserShare + flipMargin / 2;
  best.shares[loser] = loserShare - flipMargin / 2;
  best.winner = party;
  best.base = { ...best.shares };
  state.seats = countSeats(state.seatMap);
  return finish(best);
}

/** give the player a leader, a whip, an ally and a rival in the new chamber */
function seatPersonalCast(
  state: GameState, rng: Rng, party: PartyId, existing: Relationship[]
): void {
  const chamber = chamberOf(state.arena);
  const usedNames = globalUsedNames(state);
  const idCounter = globalIdCounter(state);
  const has = (kind: RelationshipKind) => existing.some((r) => r.kind === kind);

  const find = (officeId: string): string | null =>
    Object.values(state.characters).find(
      (c) => c.partyId === party && c.officeId === officeId && c.active
    )?.id ?? null;

  const make = (opts: Parameters<typeof generateCharacter>[2]): string => {
    const c = generateCharacter(rng, usedNames, opts, idCounter);
    state.characters[c.id] = c;
    return c.id;
  };

  const region = chamber.regions[0];
  const leaderId = find(chamber.leaderOffice) ?? make({
    partyId: party, officeId: chamber.leaderOffice, minAge: 42, maxAge: 63,
    competenceMean: 58, traitBias: ['ambitious'], region,
  });
  // a newcomer with a national reputation is met with interest, not warmth
  state.relationships.push({ characterId: leaderId, kind: 'leader', value: rng.int(-5, 12) });

  const whipId = find('chiefWhip') ?? make({
    partyId: party, officeId: 'chiefWhip', competenceMean: 55,
    traitBias: ['fixer', 'ruthless'], region,
  });
  state.relationships.push({ characterId: whipId, kind: 'chiefWhip', value: rng.int(-8, 6) });

  state.relationships.push({
    characterId: make({
      partyId: party, minAge: Math.max(28, state.player.age - 8),
      maxAge: state.player.age + 6, competenceMean: 52,
      traitBias: ['charming', 'loyal'], region,
    }),
    kind: 'ally', value: rng.int(18, 38),
  });
  // an outsider parachuting in over the heads of the locals makes an enemy
  state.relationships.push({
    characterId: make({
      partyId: party, minAge: Math.max(28, state.player.age - 8),
      maxAge: state.player.age + 8, competenceMean: 58,
      traitBias: ['ambitious', 'ruthless'], region,
    }),
    kind: 'rival', value: rng.int(-38, -18),
  });

  if (!has('mentor')) {
    state.relationships.push({
      characterId: make({
        partyId: party, minAge: 56, maxAge: 72, competenceMean: 58,
        traitBias: ['principled', 'loyal'], region,
      }),
      kind: 'mentor', value: rng.int(10, 28),
    });
  }
  if (!has('journalist')) {
    state.relationships.push({
      characterId: make({
        partyId: 'ind', minAge: 32, maxAge: 58, competenceMean: 60,
        traitBias: ['ruthless', 'charming'], region,
      }),
      kind: 'journalist', value: rng.int(-10, 10),
    });
  }
}

/** Seat a BRAND NEW career in a devolved chamber rather than the Commons. The
 *  Commons has already been built and caught up to today by createNewGame; this
 *  freezes it behind the player and stands the devolved chamber up as the live
 *  one. Unlike `jumpToArena` there is nothing to transfer — they have no record
 *  yet — so no stat carry, no incoming seniority, and a wholly fresh cast. */
export function startInNation(
  state: GameState, rng: Rng, arena: DevolvedArenaId, party: PartyId
): void {
  state.dormant = { ...(state.dormant ?? {}), uk: freezeArena(state) };
  const built = buildDevolvedArena(state, rng, arena, party);
  thawArena(state, built.snapshot);

  state.relationships = [];
  seatPersonalCast(state, rng, party, []);

  state.player.partyId = party;
  state.player.seatId = built.playerSeatId;
  state.player.hasSeat = true;
  state.player.officeId = null;
  state.player.officeSinceDay = null;
  state.player.enteredParliament = state.day;
  state.player.flags._seatSinceDay = state.day;
  state.player.flags._homeNation = arena;
  const seat = state.seatMap.find((x) => x.id === built.playerSeatId);
  if (seat) {
    seat.isPlayerSeat = true;
    state.player.region = seat.region;
  }

  state.history = [{
    kind: 'enteredParliament', date: state.day,
    seatName: seat?.name ?? CHAMBERS[arena].place, arena,
  }];
}

/** the Westminster parliament a devolved career's world starts from: the most
 *  recent one sitting on or before that day, so a 2016 Holyrood start plays out
 *  against the 2015 Commons rather than one that does not exist yet */
export function ukEraFor(day: GameDay): Era {
  const eras = (Object.keys(PARLIAMENTS) as Era[])
    .sort((a, b) => isoToDay(PARLIAMENTS[a].firstSitting) - isoToDay(PARLIAMENTS[b].firstSitting));
  let best = eras[0];
  for (const era of eras) {
    if (isoToDay(PARLIAMENTS[era].firstSitting) <= day) best = era;
  }
  return best;
}

/** Install the player as leader of their party in the chamber they have just
 *  arrived in — the end of a successful draft.
 *
 *  Deliberately NOT `makePlayerLeader`: that settles pledges, reads polling the
 *  player inherited, and assumes they have been sitting in this group all along.
 *  A drafted outsider has none of that history. Whether they walk in as First
 *  Minister or as Leader of the Opposition is decided by where their new party
 *  already sits — winning a party's leadership does not win it an election. */
export function installPlayerAsLeader(state: GameState, rng: Rng): void {
  const party = state.player.partyId;
  const arena = state.arena ?? 'uk';
  const chamber = chamberOf(arena);

  for (const c of Object.values(state.characters)) {
    if (c.partyId === party && c.officeId === 'leader') {
      c.officeId = null;
      c.active = false;
    }
  }
  vacatePlayerBench(state, rng);
  state.player.officeId = 'leader';
  state.player.officeSinceDay = state.day;
  state.player.flags._leaderTookOverPolls = (state.polling.shares[party] ?? 0) * 100;
  const peak = Number(state.player.flags._peakTier ?? 0);
  if (peak < 5) state.player.flags._peakTier = 5;

  const inGovernment = party === state.government.governingParty;
  const isOpposition = party === state.government.oppositionParty;
  if (inGovernment) {
    const open = state.pmHistory.find((t) => t.endDay === null);
    if (open) open.endDay = state.day;
    state.government.pmId = 'player';
    state.government.pmSinceDay = state.day;
    state.pmHistory.push({
      characterId: 'player', name: state.player.name, partyId: party,
      startDay: state.day, endDay: null,
    });
  } else if (isOpposition) {
    const open = (state.loHistory ?? []).find((t) => t.endDay === null);
    if (open) open.endDay = state.day;
    state.government.loId = 'player';
    state.loHistory = [...(state.loHistory ?? []), {
      characterId: 'player', name: state.player.name, partyId: party,
      startDay: state.day, endDay: null,
    }];
  }
  state.history.push({
    kind: 'roleChange', arena, date: state.day, officeId: 'leader',
    how: inGovernment ? 'becamePM' : 'electedLeader',
    roleSide: inGovernment ? 'gov' : isOpposition ? 'opp' : 'minor', partyId: party,
  });
  state.history.push({
    kind: 'event', date: state.day,
    headline: inGovernment
      ? `${state.player.name} is sworn in as ${chamber.head} of ${chamber.place}`
      : `${state.player.name} takes over as ${partyNameIn(party, arena)} leader`,
  });
  state.relationships = state.relationships.filter((r) => r.kind !== 'leader');
  state.relationships.push({ characterId: 'player', kind: 'leader', value: 0 });
}

/** The elections fought in the chamber currently being looked at. `state.elections`
 *  spans every chamber a career has sat in, so any history surface has to filter,
 *  or it draws a 129-seat Holyrood result and a 650-seat Commons one on one axis. */
export function arenaElections(state: GameState): ElectionResult[] {
  const arena = state.arena ?? 'uk';
  return Object.values(state.elections)
    .filter((e) => (e.arena ?? 'uk') === arena)
    .sort((a, b) => a.date - b.date);
}

/** every spell as a head of government the player has served, across every
 *  chamber — the chronicles are chamber-scoped, so the end screen has to gather
 *  them back up */
export function allPlayerHeadTenures(state: GameState) {
  const out = [...(state.pmHistory ?? [])].map((t) => ({ tenure: t, arena: state.arena ?? 'uk' }));
  for (const snap of Object.values(state.dormant ?? {})) {
    for (const t of snap.pmHistory ?? []) out.push({ tenure: t, arena: snap.arena });
  }
  return out.filter((x) => x.tenure.characterId === 'player');
}

/** the live chamber's size, for the lines that used to say 650 */
export function houseSize(state: GameState): number {
  return votingSeats(state.seats) + (state.seats.spk ?? 0) + (state.seats.sf ?? 0);
}

export { isMajorIn };
