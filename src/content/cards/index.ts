import { DecisionCard } from '../../types/content';
import { CARD_TOKEN_KEYS } from '../tokens';
import { CHAMBERS } from '../../data/chambers';
import { PERSONAL_CARDS } from './personal';
import { BACKBENCHER_CARDS } from './backbencher';
import { CONSTITUENCY_CARDS } from './constituency';
import { WHIP_PPS_CARDS } from './whipPps';
import { JUNIOR_MINISTER_CARDS } from './juniorMinister';
import { SOS_CARDS } from './secretaryOfState';
import { SHADOW_CARDS } from './shadow';
import { SHADOW_PORTFOLIO_CARDS } from './shadowPortfolio';
import { LEADERSHIP_CARDS } from './leadership';
import { LEADER_EXTRA_CARDS } from './leaderExtra';
import { CRISIS_CARDS } from './crisis';
import { PORTFOLIO_CARDS } from './portfolio';
import { PORTFOLIO_EXTRA_CARDS } from './portfolioExtra';
import { THIRD_PARTY_CARDS } from './thirdParty';
import { ROLE_CARDS } from './roles';
import { ERA_CARDS } from './era';
import { WHIP_CARDS } from './whips';
import { MINISTRY_FOCUS_CARDS } from './ministryFocus';
import { SCIENCE_TECH_CARDS } from './scienceTech';
import { LEADER_HOUSE_CARDS } from './leaderHouse';
import { COMMITTEE_CARDS } from './committee';
import { EXTRA_ONE_OFF_CARDS } from './extraOneOffs';
import { FAVOUR_SPEND_CARDS } from './favourSpend';
import { CAUSE_DELIVERY_CARDS } from './causeDelivery';
import { CAUSE_COLLISION_CARDS } from './causeCollision';
import { REGION_CARDS } from './regionCards';
import { DEVOLVED_SCENERY_CARDS } from './devolvedScenery';
import { EVENTS_EXTRA_CARDS } from './eventsExtra';

import { DEVOLVED_CARDS } from './devolved';
import { SCOTLAND_CARDS } from './nations/scotland';
import { WALES_CARDS } from './nations/wales';
import { NI_CARDS } from './nations/ni';
import { NI_COLLAPSE_CARDS } from './nations/niCollapse';
import { MAYOR_CARDS } from './mayor';
export { MAYOR_CARDS } from './mayor';
import { OUTSIDE_LEADER_CARDS } from './outsideLeader';
export { OUTSIDE_LEADER_CARDS } from './outsideLeader';

/** the fallback pool: always-eligible cards that keep the engine from stalling.
 *  Per-chamber, because the last-resort branch of `drawCard` ignores eligibility
 *  entirely — a shared fallback would put Commons cards in a devolved chamber. */
export const FALLBACK_POOL: DecisionCard[] = PERSONAL_CARDS;
export const DEVOLVED_FALLBACK: DecisionCard[] = DEVOLVED_CARDS;

export function fallbackPoolFor(arena: string): DecisionCard[] {
  if (arena === 'uk') return FALLBACK_POOL;
  // the Assembly's own deck: the shared devolved deck is only partly written
  // for a chamber with no First Minister's Questions and no minority government
  if (arena === 'ni') return NI_CARDS;
  return DEVOLVED_FALLBACK;
}

export const ALL_CARDS: DecisionCard[] = [
  ...PERSONAL_CARDS,
  ...BACKBENCHER_CARDS,
  ...CONSTITUENCY_CARDS,
  ...WHIP_PPS_CARDS,
  ...JUNIOR_MINISTER_CARDS,
  ...SOS_CARDS,
  ...SHADOW_CARDS,
  ...SHADOW_PORTFOLIO_CARDS,
  ...LEADERSHIP_CARDS,
  ...LEADER_EXTRA_CARDS,
  ...CRISIS_CARDS,
  ...PORTFOLIO_CARDS,
  ...PORTFOLIO_EXTRA_CARDS,
  ...THIRD_PARTY_CARDS,
  ...ROLE_CARDS,
  ...ERA_CARDS,
  ...WHIP_CARDS,
  ...MINISTRY_FOCUS_CARDS,
  ...SCIENCE_TECH_CARDS,
  ...LEADER_HOUSE_CARDS,
  ...COMMITTEE_CARDS,
  ...EXTRA_ONE_OFF_CARDS,
  ...FAVOUR_SPEND_CARDS,
  ...CAUSE_DELIVERY_CARDS,
  ...CAUSE_COLLISION_CARDS,
  ...REGION_CARDS,
  ...DEVOLVED_SCENERY_CARDS,
  ...EVENTS_EXTRA_CARDS,
  ...DEVOLVED_CARDS,
  ...SCOTLAND_CARDS,
  ...WALES_CARDS,
  ...NI_CARDS,
  ...NI_COLLAPSE_CARDS,
  // out of the chamber: eligible only while the player is a sitting mayor, or
  // leads the party with no seat
  ...MAYOR_CARDS,
  ...OUTSIDE_LEADER_CARDS,
];

/** every `{token}` a card may use (the resolver in engine/cardEngine.ts is typed against the same list) */
export const CARD_TOKENS = new Set<string>(CARD_TOKEN_KEYS);
const ARENAS = new Set(Object.keys(CHAMBERS));

export function validateCards(cards: DecisionCard[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const checkTokens = (id: string, text: string) => {
    for (const m of text.matchAll(/\{(\w+)\}/g)) {
      if (!CARD_TOKENS.has(m[1])) errors.push(`${id}: unknown token {${m[1]}}`);
    }
  };
  for (const card of cards) {
    if (seen.has(card.id)) errors.push(`duplicate card id: ${card.id}`);
    seen.add(card.id);
    checkTokens(card.id, card.title);
    checkTokens(card.id, card.body);
    for (const a of card.requires?.arena ?? []) {
      if (!ARENAS.has(a)) errors.push(`${card.id}: unknown arena ${a}`);
    }
    if (card.weight <= 0) errors.push(`${card.id}: weight must be > 0`);
    if (card.choices.length < 2 || card.choices.length > 4) {
      errors.push(`${card.id}: must have 2-4 choices`);
    }
    if (card.tags.length === 0) errors.push(`${card.id}: needs at least one tag`);
    for (const choice of card.choices) {
      checkTokens(card.id, choice.label);
      if (Array.isArray(choice.outcomeText)) {
        if (choice.outcomeText.length === 0) {
          errors.push(`${card.id}: weighted outcome list is empty`);
        }
        for (const o of choice.outcomeText) {
          if (o.weight <= 0) errors.push(`${card.id}: outcome weight must be > 0`);
          checkTokens(card.id, o.text);
        }
      } else {
        checkTokens(card.id, choice.outcomeText);
      }
    }
  }
  return errors;
}

// fail fast in dev if content is malformed
const errors = validateCards(ALL_CARDS);
if (errors.length > 0) {
  throw new Error(`Card validation failed:\n${errors.join('\n')}`);
}
