import { DecisionCard } from '../../types/content';
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

/** the fallback pool: always-eligible cards that keep the engine from stalling */
export const FALLBACK_POOL: DecisionCard[] = PERSONAL_CARDS;

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
];

export function validateCards(cards: DecisionCard[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const card of cards) {
    if (seen.has(card.id)) errors.push(`duplicate card id: ${card.id}`);
    seen.add(card.id);
    if (card.weight <= 0) errors.push(`${card.id}: weight must be > 0`);
    if (card.choices.length < 2 || card.choices.length > 4) {
      errors.push(`${card.id}: must have 2-4 choices`);
    }
    if (card.tags.length === 0) errors.push(`${card.id}: needs at least one tag`);
    for (const choice of card.choices) {
      if (Array.isArray(choice.outcomeText)) {
        if (choice.outcomeText.length === 0) {
          errors.push(`${card.id}: weighted outcome list is empty`);
        }
        for (const o of choice.outcomeText) {
          if (o.weight <= 0) errors.push(`${card.id}: outcome weight must be > 0`);
        }
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
