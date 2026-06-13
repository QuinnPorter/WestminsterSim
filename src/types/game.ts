// ---- core ids ----

export type PartyId =
  | 'con' | 'lab' | 'ld' | 'snp' | 'green' | 'reform' | 'pc' | 'ukip' | 'brexit'
  | 'dup' | 'sf' | 'sdlp' | 'alliance' | 'uup' | 'spk' | 'ind';

export type RegionId =
  | 'scotland' | 'wales' | 'ni' | 'london' | 'southEast' | 'southWest'
  | 'east' | 'eastMidlands' | 'westMidlands' | 'northWest' | 'northEast'
  | 'yorkshire';

export type DepartmentId =
  | 'treasury' | 'home' | 'foreign' | 'health' | 'education' | 'defence'
  | 'justice' | 'transport' | 'environment' | 'business' | 'dwp' | 'culture';

/** Days since 2019-01-01 (UTC). clock.ts converts to dates. */
export type GameDay = number;

export type Era = '2015' | '2017' | '2019' | '2024';

// ---- parties / parliament ----

export interface Party {
  id: PartyId;
  name: string;
  shortName: string;
  colour: string;
  /** colour readable as text on white, where the main colour is too pale */
  textColour?: string;
  /** -100 left .. +100 right */
  ideology: number;
  contestsRegions: RegionId[];
  /** Sinn Féin: excluded from majority maths */
  abstentionist?: boolean;
  /** can this party plausibly govern / lead the opposition */
  major?: boolean;
}

export interface SyntheticSeat {
  id: string;
  name: string;
  region: RegionId;
  /** baseline vote shares at game start, sum ≈ 1 */
  shares: Partial<Record<PartyId, number>>;
  winner: PartyId;
  isPlayerSeat?: boolean;
}

// ---- offices ----

/** 0 backbench, 1 PPS, 2 whip, 3 junior minister, 4 secretary of state, 5 leader/PM */
export type OfficeTier = 0 | 1 | 2 | 3 | 4 | 5;

export type OfficeId = string; // e.g. 'pps', 'whip', 'min_health', 'sos_treasury', 'leader'

export interface Office {
  id: OfficeId;
  /** in-government title */
  title: string;
  /** in-opposition title */
  shadowTitle: string;
  tier: OfficeTier;
  department?: DepartmentId;
}

// ---- people ----

export interface AvatarConfig {
  skin: number;
  hairStyle: number;
  hairColour: number;
  eyes: number;
  brows: number;
  outfit: number;
  outfitColour: number;
  accessory: number;
  bg: number;
}

export type TraitId =
  | 'ambitious' | 'loyal' | 'ruthless' | 'principled'
  | 'charming' | 'dull' | 'maverick' | 'fixer';

export type Gender = 'm' | 'f' | 'nb';

export interface Character {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  partyId: PartyId;
  officeId: OfficeId | null;
  traits: TraitId[];
  /** 0-100 */
  competence: number;
  avatar: AvatarConfig;
  /** false → retired/left politics, kept for history */
  active: boolean;
}

export type RelationshipKind =
  | 'leader' | 'chiefWhip' | 'mentor' | 'rival' | 'ally' | 'journalist' | 'colleague';

export interface Relationship {
  characterId: string;
  kind: RelationshipKind;
  /** -100..100 */
  value: number;
}

// ---- player ----

export type BackgroundId =
  | 'advisor' | 'lawyer' | 'business' | 'foreignService' | 'manualLabour'
  | 'teacher' | 'doctor' | 'journalist' | 'military' | 'councillor' | 'mayor'
  | 'tradeUnionist' | 'academic' | 'police';

export interface PlayerStats {
  /** public/media profile */
  profile: number;
  /** standing with the parliamentary party */
  partyStanding: number;
  /** how good you actually are at the job */
  competence: number;
  /** approval back home in the seat */
  constituencyApproval: number;
  /** personal integrity / principle record */
  integrity: number;
}

export interface Player {
  name: string;
  gender: Gender;
  age: number;
  partyId: PartyId;
  background: BackgroundId;
  region: RegionId;
  avatar: AvatarConfig;
  stats: PlayerStats;
  officeId: OfficeId | null;
  /** day the player took their current office (null while a backbencher) */
  officeSinceDay: GameDay | null;
  /** rebellions in the current parliament */
  rebellionCount: number;
  /** story flags set by cards */
  flags: Record<string, boolean | number>;
  seatId: string;
  /** false → lost seat, in the wilderness */
  hasSeat: boolean;
  /** day the player first entered parliament */
  enteredParliament: GameDay;
}

// ---- politics state ----

export interface PollingState {
  /** GB-wide shares, 0..1, sum ≈ 1 (NI parties excluded) */
  shares: Partial<Record<PartyId, number>>;
  lastUpdated: GameDay;
}

export interface PollSnapshot {
  day: GameDay;
  shares: Partial<Record<PartyId, number>>;
}

export interface CabinetPost {
  officeId: OfficeId;
  characterId: string; // 'player' refers to the player
}

export interface GovernmentState {
  governingParty: PartyId;
  oppositionParty: PartyId;
  /** 'player' if the player is PM */
  pmId: string;
  loId: string;
  cabinet: CabinetPost[];
  shadowCabinet: CabinetPost[];
  /** working majority (excl. SF + Speaker) */
  majority: number;
  /** day the current PM took office (for longevity resignations) */
  pmSinceDay: GameDay;
  /** how the current government holds power */
  arrangement: 'majority' | 'minority' | 'supplyConfidence' | 'coalition';
  /** formal junior coalition partner — sits in government */
  coalitionPartner?: PartyId;
  /** party propping up a minority on supply & confidence — NOT in government */
  confidencePartner?: PartyId;
  /** consecutive election terms the governing party has held power (incumbent fatigue) */
  termsInPower: number;
  /** accumulated backbench/frontbench pressure on a sitting (NPC) PM to go */
  pmHeavePressure?: number;
  /** the cabinet minister (or 'player') currently doubling as Deputy PM / First Secretary */
  deputyPmId?: string;
  /** which deputy title the current deputy holds */
  deputyTitle?: 'dpm' | 'firstSec';
}

// ---- elections & history ----

export interface CandidateResult {
  name: string;
  partyId: PartyId;
  share: number;
  votes: number;
}

export interface ConstituencyResult {
  seatId: string;
  seatName: string;
  candidates: CandidateResult[];
  winnerPartyId: PartyId;
  playerStood: boolean;
  /** percentage-point swing to/from the player's party */
  swing: number;
  turnout: number;
  majorityVotes: number;
}

export type ElectionOutcome = 'majority' | 'minority' | 'hung';

export interface ElectionResult {
  id: string;
  date: GameDay;
  seats: Partial<Record<PartyId, number>>;
  voteShares: Partial<Record<PartyId, number>>;
  playerResult: ConstituencyResult | null;
  outcome: ElectionOutcome;
  governingParty: PartyId;
  playerHeldSeat: boolean;
}

export type HistoryEntry =
  | { kind: 'roleChange'; date: GameDay; officeId: OfficeId | null;
      how: 'appointed' | 'promoted' | 'reshuffled' | 'dismissed' | 'resigned' | 'electedLeader' | 'becamePM' | 'leftOffice' | 'continued';
      /** the gov/opposition/minor framing and party AT THE TIME the role was held,
       *  so the career timeline stays correct after the player crosses the floor */
      roleSide?: 'gov' | 'opp' | 'minor'; partyId?: PartyId }
  | { kind: 'election'; date: GameDay; resultId: string; heldSeat: boolean }
  | { kind: 'event'; date: GameDay; headline: string }
  | { kind: 'leadershipContest'; date: GameDay; won: boolean; partyId: PartyId }
  | { kind: 'enteredParliament'; date: GameDay; seatName: string };

// ---- the running card ----

export interface StatDelta {
  label: string;
  delta: number;
}

export type ForcedKind =
  | 'reshuffleOffer' | 'dismissal' | 'resignPrompt'
  | 'campaign' | 'electionNight' | 'lostSeat' | 'wilderness'
  | 'leadershipStand' | 'leadershipBallot' | 'pmReshuffle' | 'pmPressure'
  | 'resignPledge' | 'confidenceVote' | 'partyCoup'
  | 'coalitionTalks' | 'coalitionOffer' | 'pmHeave'
  | 'deputyPmOffer' | 'speakerContest'
  | 'calendar';

export interface DrawnCard {
  /** source card id, or synthetic id for forced/calendar cards */
  cardId: string;
  kind: 'normal' | ForcedKind;
  title: string;
  body: string;
  /** character id rendered on the card */
  speakerId?: string;
  choices: { label: string }[];
  /** forced-event payload (e.g. offered officeId) */
  payload?: Record<string, unknown>;
  /** set once a choice is made; the card then shows the outcome + Continue */
  outcome?: { text: string; deltas: StatDelta[] };
}

export interface ForcedEvent {
  kind: ForcedKind;
  payload?: Record<string, unknown>;
}

export interface LegacySummary {
  yearsServed: number;
  highestOfficeTitle: string;
  electionsWon: number;
  headlines: string[];
}

// ---- top level ----

export interface GameState {
  version: number;
  rngState: number;
  day: GameDay;
  startEra: Era;
  startDay: GameDay;

  player: Player;
  characters: Record<string, Character>;
  relationships: Relationship[];

  /** current seat counts */
  seats: Partial<Record<PartyId, number>>;
  seatMap: SyntheticSeat[];
  government: GovernmentState;
  polling: PollingState;
  /** polling snapshots since the last election, for the tracker graph */
  pollHistory: PollSnapshot[];

  history: HistoryEntry[];
  elections: Record<string, ElectionResult>;

  currentCard: DrawnCard | null;
  /** election result waiting to be shown on the election-night screen */
  pendingElectionId: string | null;
  forcedQueue: ForcedEvent[];
  /** cardId -> day last played */
  cardHistory: Record<string, GameDay>;
  /** calendar event key -> year last fired */
  calendarDone: Record<string, number>;
  /** id of the last drawn normal card (anti-repetition) */
  lastCardId: string | null;

  parliamentStart: GameDay;
  nextElectionBy: GameDay;

  gameOver: null | { reason: 'retired' | 'lostSeat' | 'resigned'; legacy: LegacySummary };
}
