import { DrawnCard, GameState } from '../types/game';
import { DecisionCard } from '../types/content';
import { departmentInfo, OFFICES } from '../data/offices';
import { chamberAt } from '../data/chambers';
import { partyNameIn } from '../data/parties';
import { COMMITTEE_NAMES } from '../data/committees';

import { getRelationship, relationshipName } from './relationships';
import {
  playerInGovernmentBloc, playerTier, playerIsLeader, playerLeaderRole, onMinorPartyTrack,
} from './career';
import { Rng } from './rng';

// ---------- key moments ----------

/** cards that represent a high-stakes, attention-worthy event */
export function isKeyMoment(card: DrawnCard | null | undefined): boolean {
  if (!card) return false;
  return (
    card.kind === 'campaign' ||
    card.kind === 'leadershipStand' ||
    card.kind === 'leadershipBallot' ||
    card.kind === 'leadershipBacking' ||
    card.kind === 'leadershipEpisode' ||
    card.kind === 'leadershipNomination' ||
    card.kind === 'pmPressure' ||
    card.kind === 'resignPledge' ||
    card.kind === 'confidenceVote' ||
    card.kind === 'partyCoup' ||
    card.kind === 'coalitionTalks' ||
    card.kind === 'coalitionOffer'
  );
}

/** short label for the key-moment banner */
export function keyMomentLabel(card: DrawnCard): string {
  if (card.kind === 'campaign') return 'General election';
  if (card.kind === 'leadershipStand' || card.kind === 'leadershipBallot' || card.kind === 'leadershipBacking' || card.kind === 'leadershipEpisode' || card.kind === 'leadershipNomination') return 'Leadership contest';
  if (card.kind === 'pmPressure') return 'Crisis in Number 10';
  if (card.kind === 'confidenceVote') return 'Confidence vote';
  if (card.kind === 'partyCoup') return 'Leadership challenge';
  if (card.kind === 'resignPledge') return 'Pressure to resign';
  if (card.kind === 'coalitionTalks' || card.kind === 'coalitionOffer') return 'Coalition talks';
  return 'Key moment';
}

// ---------- tokens ----------

export function resolveTokens(state: GameState, text: string): string {
  const seat = state.seatMap.find((s) => s.id === state.player.seatId);
  const dept = state.player.officeId
    ? OFFICES[state.player.officeId]?.department
    : undefined;
  const arena = state.arena ?? 'uk';
  const chamber = chamberAt(arena, state.day);
  // the OTHER government, for the two-chair conflict cards: at Westminster the
  // devolved administration of the player's nation; in a devolved chamber, the UK
  // government. Both are simulated, so they have a real leader and a real party.
  const other = otherGovernment(state);
  const map: Record<string, string> = {
    leader: relationshipName(state, 'leader'),
    pm: state.government.pmId === 'player' ? state.player.name
      : state.characters[state.government.pmId]?.name ?? `the ${chamber.head}`,
    lo: state.government.loId === 'player' ? state.player.name
      : state.characters[state.government.loId]?.name ?? 'the Leader of the Opposition',
    whip: relationshipName(state, 'chiefWhip'),
    rival: relationshipName(state, 'rival'),
    ally: relationshipName(state, 'ally'),
    mentor: relationshipName(state, 'mentor'),
    journalist: relationshipName(state, 'journalist'),
    constituency: seat?.name ?? 'your constituency',
    department: dept ? departmentInfo(dept).casual : 'the department',
    committee: state.player.committeeChair ? COMMITTEE_NAMES[state.player.committeeChair] : 'your committee',
    cmtdept: state.player.committeeChair ? departmentInfo(state.player.committeeChair).casual : 'the department',
    party: partyNameIn(state.player.partyId, arena),
    govparty: partyNameIn(state.government.governingParty, arena),
    oppparty: partyNameIn(state.government.oppositionParty, arena),
    // chamber nouns, so one line of prose can serve every legislature
    house: chamber.houseThe,
    housefull: chamber.house,
    hill: chamber.seat,
    member: chamber.member,
    members: chamber.members,
    head: chamber.head,
    headoffice: chamber.headOffice,
    government: chamber.government,
    nation: chamber.place,
    speaker: chamber.speakerTitle,
    // the other government
    otherleader: other.leader,
    otherparty: other.party,
    othergov: other.government,
  };
  return text.replace(/\{(\w+)\}/g, (m, key) => map[key] ?? m);
}

/** the leader, party and name of the government the player is NOT part of: the
 *  devolved administration of their nation while they sit at Westminster, and
 *  the UK Government while they sit in a devolved chamber */
function otherGovernment(state: GameState): { leader: string; party: string; government: string } {
  const arena = state.arena ?? 'uk';
  if (arena === 'uk') {
    const nation = state.player.region === 'scotland' || state.player.region === 'wales'
      ? state.player.region : null;
    const snap = nation ? state.dormant?.[nation] : undefined;
    const chamber = chamberAt(nation ?? 'scotland', state.day);
    if (snap) {
      const fm = snap.characters[snap.government.pmId];
      return {
        leader: fm?.name ?? `the ${chamber.head}`,
        party: partyNameIn(snap.government.governingParty, nation ?? 'scotland'),
        government: chamber.government,
      };
    }
    return { leader: `the ${chamber.head}`, party: 'the devolved government', government: chamber.government };
  }
  const uk = state.dormant?.uk;
  const pm = uk ? uk.characters[uk.government.pmId] : undefined;
  return {
    leader: pm?.name ?? 'the Prime Minister',
    party: uk ? partyNameIn(uk.government.governingParty, 'uk') : 'the UK government',
    government: 'the UK Government',
  };
}

// ---------- eligibility ----------

export function cardEligible(state: GameState, card: DecisionCard): boolean {
  const req = card.requires;
  if (card.oncePerCareer && state.cardHistory[card.id] !== undefined) return false;
  if (state.cardHistory[card.id] !== undefined &&
      state.day - state.cardHistory[card.id] < card.cooldownDays) {
    return false;
  }
  // an unmarked card belongs to the Commons. The corpus predates the devolved
  // chambers and is written throughout in Westminster language, so a card must
  // opt IN to a legislature rather than leak into one by omission.
  const arena = state.arena ?? 'uk';
  if ((req?.arena ?? ['uk']).indexOf(arena) === -1) return false;
  if (!req) return true;

  const tier = playerTier(state);
  if (req.minTier !== undefined && tier < req.minTier) return false;
  if (req.maxTier !== undefined && tier > req.maxTier) return false;
  // a coalition junior partner holds real government office, so counts as
  // "in government" for governing-vs-opposition card gating
  if (req.inGovernment !== undefined && playerInGovernmentBloc(state) !== req.inGovernment) return false;
  if (req.leaderRole) {
    const role = playerLeaderRole(state);
    if (!role || !req.leaderRole.includes(role)) return false;
  }
  if (req.arrangementIn && !req.arrangementIn.includes(state.government.arrangement)) return false;
  if (req.firstParliament !== undefined &&
      (Object.keys(state.elections).length === 0) !== req.firstParliament) return false;
  if (req.minorParty !== undefined && onMinorPartyTrack(state) !== req.minorParty) return false;
  if (req.era && !req.era.includes(state.startEra)) return false;
  if (req.causeIn && !req.causeIn.some((c) => state.player.causes?.includes(c))) return false;
  if (req.causesAll && !req.causesAll.every((c) => state.player.causes?.includes(c))) return false;
  // any banked favour counts — favours are one currency; kind records who owes you
  if (req.hasFavour && !(state.player.favours ?? []).length) return false;
  if (req.region && !req.region.includes(state.player.region)) return false;
  if (req.minAge !== undefined && state.player.age < req.minAge) return false;
  if (req.background && !req.background.includes(state.player.background)) return false;
  if (req.partyIn && !req.partyIn.includes(state.player.partyId)) return false;
  if (req.department) {
    const dept = state.player.officeId ? OFFICES[state.player.officeId].department : undefined;
    if (!dept || !req.department.includes(dept)) return false;
  }
  if (req.office && (!state.player.officeId || !req.office.includes(state.player.officeId))) return false;
  if (req.stats) {
    for (const [key, range] of Object.entries(req.stats)) {
      const v = state.player.stats[key as keyof typeof state.player.stats];
      if (range?.min !== undefined && v < range.min) return false;
      if (range?.max !== undefined && v > range.max) return false;
    }
  }
  if (req.flags) {
    for (const [flag, want] of Object.entries(req.flags)) {
      const have = state.player.flags[flag];
      if (want === false) {
        if (have) return false;
      } else if (have !== want) {
        return false;
      }
    }
  }
  return true;
}

// ---------- drawing ----------

const SAME_TAG_PENALTY = 0.3;
/** ministers still get the odd constituency/personal card — just fewer */
const SENIOR_LOCAL_PENALTY = 0.45;

export function drawCard(
  state: GameState,
  rng: Rng,
  pool: DecisionCard[],
  fallback: DecisionCard[]
): DecisionCard {
  let eligible = pool.filter((c) => cardEligible(state, c));
  if (eligible.length === 0) {
    eligible = fallback.filter((c) => cardEligible(state, c));
  }
  if (eligible.length === 0) {
    // last resort: ignore cooldowns on the fallback pool so we never stall
    eligible = fallback.length > 0 ? fallback : pool;
  }
  const lastCard = state.lastCardId
    ? pool.find((c) => c.id === state.lastCardId) ?? fallback.find((c) => c.id === state.lastCardId)
    : undefined;
  const lastPrimaryTag = lastCard?.tags[0];
  const senior = playerTier(state) >= 3;
  const leader = playerIsLeader(state);
  return rng.pickWeighted(eligible, (c) => {
    let w = c.weight;
    if (lastPrimaryTag && c.tags[0] === lastPrimaryTag) w *= SAME_TAG_PENALTY;
    if (senior && (c.tags[0] === 'constituency' || c.tags[0] === 'personal')) {
      w *= SENIOR_LOCAL_PENALTY;
    }
    // as leader/PM, governance dominates: heavily down-weight any card that
    // isn't a leader-tier (minTier 5) governance card
    if (leader && (c.requires?.minTier ?? 0) < 5) {
      w *= 0.04;
    }
    // and bias the draw toward cards written for this specific leader role
    if (leader && c.requires?.leaderRole?.includes(playerLeaderRole(state) ?? 'pm')) {
      w *= 1.5;
    }
    return w;
  });
}

export function makeDrawnCard(state: GameState, rng: Rng, card: DecisionCard): DrawnCard {
  return {
    cardId: card.id,
    kind: 'normal',
    title: resolveTokens(state, card.title),
    body: resolveTokens(state, card.body),
    speakerId: card.speaker
      ? getRelationship(state, card.speaker)?.characterId
      : undefined,
    choices: card.choices.map((c) => ({ label: resolveTokens(state, c.label) })),
    // ordinary cadence: one or two months per decision (50/50)
    payload: { advance: rng.chance(0.5) ? 30 : 60 },
  };
}
