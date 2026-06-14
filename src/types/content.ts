import {
  CauseId, DepartmentId, Era, OfficeTier, PartyId, PlayerStats, RelationshipKind,
} from './game';

export type CardTag =
  | 'westminster' | 'constituency' | 'media' | 'personal' | 'party'
  | 'policy' | 'scandal' | 'crisis' | 'campaign' | 'funny' | 'serious';

export interface Requirement {
  minTier?: OfficeTier;
  maxTier?: OfficeTier;
  inGovernment?: boolean;
  department?: DepartmentId[];
  era?: Era[];
  stats?: Partial<Record<keyof PlayerStats, { min?: number; max?: number }>>;
  /** flag -> required value; `false` means "must be unset or false" */
  flags?: Record<string, boolean | number>;
  partyIn?: PartyId[];
  /** only fire when the player-leader is in this role (pm/lo/minorLeader) */
  leaderRole?: ('pm' | 'lo' | 'minorLeader')[];
  /** true → only minor/third-party MPs; false → only frontbench-track (gov or
   *  official opposition). Distinguishes third-party scrutiny from shadow cards. */
  minorParty?: boolean;
  /** only fire under these government arrangements (coalition-life cards) */
  arrangementIn?: ('majority' | 'minority' | 'supplyConfidence' | 'coalition')[];
  /** only fire when the player champions at least one of these causes */
  causeIn?: CauseId[];
}

export type CardTrigger =
  | 'resignOffice' | 'leadershipChallenge' | 'rebel';

export interface EffectSpec {
  stats?: Partial<Record<keyof PlayerStats, number>>;
  relationships?: { kind: RelationshipKind; delta: number }[];
  /** percentage points, applied to GB polling then renormalised */
  pollingShock?: { party: 'own' | 'gov' | PartyId; delta: number };
  setFlags?: Record<string, boolean | number>;
  addHeadline?: string;
  trigger?: CardTrigger;
  /** bank a favour owed by the current holder of this relationship */
  grantFavour?: { kind: RelationshipKind; note?: string };
}

export interface WeightedOutcome {
  weight: number;
  text: string;
  extra?: EffectSpec;
}

export interface CardChoice {
  label: string;
  effects: EffectSpec;
  outcomeText: string | WeightedOutcome[];
}

export interface DecisionCard {
  id: string;
  title: string;
  /** supports {leader} {pm} {whip} {rival} {ally} {mentor} {journalist}
   *  {constituency} {department} {party} {govparty} tokens */
  body: string;
  /** render this relationship's NPC on the card */
  speaker?: RelationshipKind;
  tags: CardTag[];
  requires?: Requirement;
  weight: number;
  cooldownDays: number;
  oncePerCareer?: boolean;
  /** [min, max] days the clock advances after this card; default [21, 42] */
  advanceDays?: [number, number];
  choices: CardChoice[];
}
