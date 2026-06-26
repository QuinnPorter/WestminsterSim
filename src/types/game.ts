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
  | 'justice' | 'transport' | 'environment' | 'business' | 'dwp' | 'culture'
  | 'housing' | 'energy' | 'scienceTech';

/** Days since 2019-01-01 (UTC). clock.ts converts to dates. */
export type GameDay = number;

export type Era = '2010' | '2015' | '2017' | '2019' | '2024';

/** broad political causes the player champions — see data/causes.ts */
export type CauseId =
  | 'economy' | 'inequality' | 'publicServices' | 'environment'
  | 'immigration' | 'defence' | 'foreignAffairs' | 'housing'
  | 'lawAndOrder' | 'education';

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
  /** the latest election's vote shares (for display/UI), sum ≈ 1 */
  shares: Partial<Record<PartyId, number>>;
  /** the IMMUTABLE build-time baseline shares — every election swings from this,
   *  so the map never compounds/drifts on its own amplified results */
  base?: Partial<Record<PartyId, number>>;
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
  /** within-tier seniority (higher = more senior); used for the Treasury
   *  sub-ladder and end-screen highest-office ordering. Default 0. */
  rank?: number;
  /** territorial offices (Scotland/Wales/NI Secretary) only offered to a player
   *  whose seat is in this region */
  region?: RegionId;
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

/** a banked debt the player can call in at a high-stakes moment */
export interface Favour {
  kind: RelationshipKind;
  characterId: string;
  /** short description of why they owe you, shown when spending it */
  note: string;
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
  /** department of the select committee the player chairs (a backbench role held
   *  alongside being an MP); null/undefined when they chair none */
  committeeChair?: DepartmentId | null;
  /** rebellions in the current parliament */
  rebellionCount: number;
  /** story flags set by cards */
  flags: Record<string, boolean | number>;
  seatId: string;
  /** false → lost seat, in the wilderness */
  hasSeat: boolean;
  /** day the player first entered parliament */
  enteredParliament: GameDay;
  /** broad causes chosen at career start (0–3) — mostly aesthetic + light weighting */
  causes: CauseId[];
  /** banked favours the player can spend at key moments */
  favours: Favour[];
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
  /** accumulated pressure on the player's (NPC) opposition/minor-party leader to go */
  oppLeaderPressure?: number;
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

/** one person's continuous spell as Prime Minister */
export interface PmTenure {
  characterId: string;
  name: string;
  partyId: PartyId;
  startDay: GameDay;
  /** null while still serving */
  endDay: GameDay | null;
}

/** one person's continuous spell as Leader of the Opposition (same shape as PmTenure) */
export interface LoTenure {
  characterId: string;
  name: string;
  partyId: PartyId;
  startDay: GameDay;
  /** null while still serving */
  endDay: GameDay | null;
}

/** a retired player whose world was carried on by a protégé — an archived career
 *  record, viewable from the Profile, not an active NPC in the world */
export interface Mentor {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  partyId: PartyId;
  background: BackgroundId;
  avatar: AvatarConfig;
  causes: CauseId[];
  /** career-end stats snapshot */
  stats: PlayerStats;
  /** the retiree's own career entries (roleChange / leadershipContest / enteredParliament / election) */
  career: HistoryEntry[];
  /** their spells as Prime Minister (slice of pmHistory with characterId 'player') */
  pmTenures: PmTenure[];
  retiredDay: GameDay;
  legacy: LegacySummary;
}

export type HistoryEntry =
  | { kind: 'roleChange'; date: GameDay; officeId: OfficeId | null;
      how: 'appointed' | 'promoted' | 'reshuffled' | 'dismissed' | 'resigned' | 'electedLeader' | 'becamePM' | 'leftOffice' | 'continued';
      /** the gov/opposition/minor framing and party AT THE TIME the role was held,
       *  so the career timeline stays correct after the player crosses the floor */
      roleSide?: 'gov' | 'opp' | 'minor'; partyId?: PartyId;
      /** an explicit timeline label, for composite roles the office id can't express
       *  on its own (e.g. a junior-coalition-partner "Deputy Prime Minister and X") */
      label?: string }
  | { kind: 'election'; date: GameDay; resultId: string; heldSeat: boolean }
  | { kind: 'event'; date: GameDay; headline: string }
  /** the Deputy-PM / First-Secretary overlay held ON TOP of a brief — a separate,
   *  concurrent timeline track (paired start→end), so it shows alongside the office */
  | { kind: 'deputyOverlay'; date: GameDay; action: 'start' | 'end'; title?: 'dpm' | 'firstSec'; label?: string }
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
  | 'leadershipStand' | 'leadershipBallot' | 'leadershipBacking' | 'pmReshuffle' | 'pmPressure'
  | 'resignPledge' | 'confidenceVote' | 'partyCoup'
  | 'coalitionTalks' | 'coalitionOffer' | 'pmHeave'
  | 'deputyPmOffer' | 'deputyRemoval' | 'speakerContest'
  | 'committeeChairContest'
  | 'budget' | 'pmqs' | 'conference'
  | 'calendar';

export interface DrawnCard {
  /** source card id, or synthetic id for forced/calendar cards */
  cardId: string;
  kind: 'normal' | ForcedKind;
  title: string;
  body: string;
  /** character id rendered on the card */
  speakerId?: string;
  /** `sublabel` is an optional muted second line (e.g. a candidate's current office) */
  choices: { label: string; sublabel?: string }[];
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
  /** richer scoring — all optional so pre-v6 saved legacies still render */
  electionsContested?: number;
  rebellions?: number;
  becamePM?: boolean;
  becameLeader?: boolean;
  wasSpeaker?: boolean;
  wasDeputyPM?: boolean;
  pmStints?: number;
  /** whole years the player spent as Prime Minister (summed across spells) */
  yearsAsPM?: number;
  /** general elections the player led their party to government */
  electionsWonAsLeader?: number;
  /** leadership contests won / fought (shown as "won of fought") */
  leadershipContestsWon?: number;
  leadershipContestsFought?: number;
  finalStats?: PlayerStats;
  causes?: CauseId[];
  /** one-line characterisation of the career, e.g. "Principled premier" */
  verdict?: string;
  /** single-word rating, e.g. "Footnote" → "Colossus" */
  rating?: string;
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
  /** succession of Prime Ministers (player and NPC), oldest first */
  pmHistory: PmTenure[];
  /** succession of Leaders of the Opposition (player and NPC), oldest first */
  loHistory?: LoTenure[];
  /** retired player characters whose worlds were carried on as a protégé, oldest first */
  mentors?: Mentor[];

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
