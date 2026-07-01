import {
  BackgroundId, CauseId, DepartmentId, Era, OfficeId, OfficeTier, PartyId, PlayerStats,
  RegionId, RelationshipKind,
} from './game';

export type CardTag =
  | 'westminster' | 'constituency' | 'media' | 'personal' | 'party'
  | 'policy' | 'scandal' | 'crisis' | 'campaign' | 'funny' | 'serious';

export interface Requirement {
  minTier?: OfficeTier;
  maxTier?: OfficeTier;
  inGovernment?: boolean;
  department?: DepartmentId[];
  /** only fire when the player holds one of these specific offices (e.g. a
   *  non-departmental cabinet role like Leader of the House) */
  office?: OfficeId[];
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
  /** true → only before the first general election (the game's ORIGINAL government,
   *  e.g. the 2010 coalition before it ever faces the country) */
  firstParliament?: boolean;
  /** only fire when the player champions at least one of these causes */
  causeIn?: CauseId[];
  /** only fire when the player holds a banked favour of one of these kinds (any-of) */
  hasFavour?: RelationshipKind[];
  /** only fire when the player's seat is in one of these regions */
  region?: RegionId[];
  /** only fire when the player is at least this old (years) */
  minAge?: number;
  /** only fire when the player has one of these career backgrounds */
  background?: BackgroundId[];
  /** only fire when the player champions ALL of these causes (for collisions) */
  causesAll?: CauseId[];
}

export type CardTrigger =
  | 'resignOffice' | 'leadershipChallenge' | 'rebel'
  /** accept a scandal and face the resign-or-cling-on reckoning */
  | 'resignScandal'
  /** the coalition partner walks — break the coalition into a minority */
  | 'coalitionBreak';

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
  /** spend (consume) one banked favour of this kind */
  spendFavour?: { kind: RelationshipKind };
  /** bump the hidden "champion of X" tally for this cause */
  bumpCause?: CauseId;
  /** bump the hidden "champion of X" tally for EVERY cause the player holds — for
   *  recurring "stood up for your cause" beats (no-op if the player has no causes) */
  bumpHeldCauses?: boolean;
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
