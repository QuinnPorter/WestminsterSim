import { DrawnCard, GameState } from '../types/game';
import { DecisionCard } from '../types/content';
import { DEPARTMENTS, OFFICES } from '../data/offices';
import { PARTIES } from '../data/parties';
import { getRelationship, relationshipName } from './relationships';
import { playerInGovernment, playerTier, playerIsLeader } from './career';
import { Rng } from './rng';

// ---------- key moments ----------

/** cards that represent a high-stakes, attention-worthy event */
export function isKeyMoment(card: DrawnCard | null | undefined): boolean {
  if (!card) return false;
  return (
    card.kind === 'campaign' ||
    card.kind === 'leadershipStand' ||
    card.kind === 'leadershipBallot' ||
    card.kind === 'pmPressure'
  );
}

/** short label for the key-moment banner */
export function keyMomentLabel(card: DrawnCard): string {
  if (card.kind === 'campaign') return 'General election';
  if (card.kind === 'leadershipStand' || card.kind === 'leadershipBallot') return 'Leadership contest';
  if (card.kind === 'pmPressure') return 'Crisis in Number 10';
  return 'Key moment';
}

// ---------- tokens ----------

export function resolveTokens(state: GameState, text: string): string {
  const seat = state.seatMap.find((s) => s.id === state.player.seatId);
  const dept = state.player.officeId
    ? OFFICES[state.player.officeId].department
    : undefined;
  const map: Record<string, string> = {
    leader: relationshipName(state, 'leader'),
    pm: state.government.pmId === 'player' ? state.player.name
      : state.characters[state.government.pmId]?.name ?? 'the Prime Minister',
    lo: state.government.loId === 'player' ? state.player.name
      : state.characters[state.government.loId]?.name ?? 'the Leader of the Opposition',
    whip: relationshipName(state, 'chiefWhip'),
    rival: relationshipName(state, 'rival'),
    ally: relationshipName(state, 'ally'),
    mentor: relationshipName(state, 'mentor'),
    journalist: relationshipName(state, 'journalist'),
    constituency: seat?.name ?? 'your constituency',
    department: dept ? DEPARTMENTS[dept].casual : 'the department',
    party: PARTIES[state.player.partyId].name,
    govparty: PARTIES[state.government.governingParty].name,
    oppparty: PARTIES[state.government.oppositionParty].name,
  };
  return text.replace(/\{(\w+)\}/g, (m, key) => map[key] ?? m);
}

// ---------- eligibility ----------

export function cardEligible(state: GameState, card: DecisionCard): boolean {
  const req = card.requires;
  if (card.oncePerCareer && state.cardHistory[card.id] !== undefined) return false;
  if (state.cardHistory[card.id] !== undefined &&
      state.day - state.cardHistory[card.id] < card.cooldownDays) {
    return false;
  }
  if (!req) return true;

  const tier = playerTier(state);
  if (req.minTier !== undefined && tier < req.minTier) return false;
  if (req.maxTier !== undefined && tier > req.maxTier) return false;
  if (req.inGovernment !== undefined && playerInGovernment(state) !== req.inGovernment) return false;
  if (req.era && !req.era.includes(state.startEra)) return false;
  if (req.partyIn && !req.partyIn.includes(state.player.partyId)) return false;
  if (req.department) {
    const dept = state.player.officeId ? OFFICES[state.player.officeId].department : undefined;
    if (!dept || !req.department.includes(dept)) return false;
  }
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
      w *= 0.1;
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
