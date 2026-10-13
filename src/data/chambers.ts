import { ArenaId, DevolvedArenaId, GameDay, OfficeId, PartyId, RegionId } from '../types/game';
import { isoToDay } from '../engine/clock';
import { HOLYROOD_REGIONS, SENEDD_2026_CONSTITUENCIES, SENEDD_REGIONS } from './devolvedSeats';
import { NI_CONSTITUENCIES, niConstituencyName } from './niWestminster';

/** the nouns the chamber's voice substitutes for Westminster's in generated
 *  prose. Data, so a new chamber never falls through to another's words. */
export interface VoiceProfile {
  /** Whitehall and the Cabinet Office */
  civilService: string;
  /** the Treasury */
  treasury: string;
  /** the Parliamentary Private Secretary rung's words; a chamber without the
   *  rung (`hasPps` false) still needs a word for the prose that mentions it */
  pps: { singular: string; plural: string; abbr: string; abbrPlural: string };
  /** the Chief Whip, as the government's business manager is called */
  chiefWhip: string;
  /** Portcullis House: where members have their offices */
  lobby: string;
  /** does "Parliament" stay as a word for this chamber (the Scottish Parliament
   *  is one; the Senedd and the Assembly are not) */
  keepsParliamentWord: boolean;
  /** what a "parliament" (a term) is called when the word does not stay */
  termNoun: string;
  /** what Prime Minister's Questions becomes */
  questions: string;
  /** prefix the UK parties with the place adjective ("Scottish Labour"); false
   *  where the chamber's parties are its own */
  partyPrefixes: boolean;
  /** the Green party's name here, where it is a separate party */
  greenParty?: string;
}

/** Everything about a chamber that differs from every other chamber and is DATA
 *  rather than logic. The alternative — `if (arena === 'uk')` branches scattered
 *  through career.ts — is how this feature would rot, so the nouns, the term, the
 *  seat system and the party list all live here instead. */
export interface ChamberProfile {
  arena: ArenaId;
  /** the place, for headlines: "Westminster", "Holyrood", "Cardiff Bay" */
  seat: string;
  /** the formal name of the chamber */
  house: string;
  /** "the Commons" / "the Chamber" — used mid-sentence with the article */
  houseThe: string;
  /** what a member is called: MP, MSP, MS */
  member: string;
  members: string;
  /** the head of government's title */
  head: string;
  /** the head of government's office or residence: "Number 10", "Bute House" */
  headOffice: string;
  /** the government: "the Government", "the Scottish Government" */
  government: string;
  /** the jurisdiction, for prose: "the country", "Scotland" */
  place: string;
  placeAdjective: string;
  /** the Chair: Speaker, Presiding Officer, Llywydd */
  speakerTitle: string;
  /** the region(s) this chamber's seats sit in */
  regions: RegionId[];
  /** how long a full term runs. The Commons is five years but governments go
   *  early; Holyrood and the Senedd are fixed five-year terms. */
  termDays: number;
  /** true where the head of government cannot call an early election */
  fixedTerm: boolean;
  /** the shared office ids for the apex rung and the Chair */
  leaderOffice: OfficeId;
  speakerOffice: OfficeId;
  /** every party that has sat in the chamber across the eras on offer */
  parties: PartyId[];
  /** the parties that alternate in government here: their polling reverts to
   *  their last result rather than being pulled toward a structural baseline */
  majorParties: PartyId[];
  /** true where every large party sits in the government by right, led by a
   *  First and deputy First Minister from different communities (Stormont) */
  jointExecutive: boolean;
  /** 'twoTier': Cabinet Secretaries over Ministers; 'singleTier': one rank of
   *  Minister, with junior posts only in the head of government's office */
  ladder: 'twoTier' | 'singleTier';
  /** the deputy head of government's title */
  deputyHead: string;
  /** the ministerial rank nouns, before any brief: "Secretary of State for",
   *  "Cabinet Secretary for", "Minister" (the NI brief carries its own preposition) */
  ranks: { senior: string; junior: string };
  /** does the chamber have a Parliamentary Private Secretary rung to offer (the
   *  Commons and Holyrood do; the Senedd and the Assembly do not) */
  hasPps: boolean;
  /** the calendar set-pieces this chamber holds, by `CALENDAR` key */
  calendarKeys: string[];
  /** the polling level the chamber's pressure thresholds are calibrated at,
   *  relative to Westminster's: a Stormont First Minister polls under 30% by
   *  design and is not in crisis for it */
  pressureScale: number;
  /** how the chamber names and fills its scrutiny committees: who presides
   *  (a Convener at Holyrood, a Chair elsewhere), how the committee is named
   *  from its brief ("Treasury Select Committee", "Finance Committee",
   *  "Committee for Finance"), and whether the chairs are elected by a ballot
   *  of the whole House (the Commons) or shared out among the parties */
  committee: { chair: string; name: 'Select Committee' | 'Committee' | 'Committee for'; houseBallot: boolean };
  voice: VoiceProfile;
}

/** a Holyrood or (pre-2026) Senedd electoral region: FPTP constituencies plus
 *  additional-member list seats allocated by d'Hondt */
export interface ListRegion {
  id: string;
  name: string;
  constituencies: number;
  listSeats: number;
}

/** how a chamber turns votes into seats */
export type SeatSystem =
  | { kind: 'fptp' }
  /** the Additional Member System: constituencies plus regional top-up lists */
  | { kind: 'ams'; regions: ListRegion[] }
  /** closed-list proportional representation in multi-member constituencies.
   *  `changeHeadline` is what the history says when a chamber first fights an
   *  election under it after another system. */
  | { kind: 'listPr'; districts: { id: string; name: string }[]; seatsPer: number; changeHeadline?: string };

const DAY = 1;
const YEAR = 365 * DAY;

export const CHAMBERS: Record<ArenaId, ChamberProfile> = {
  uk: {
    arena: 'uk',
    seat: 'Westminster',
    house: 'the House of Commons',
    houseThe: 'the Commons',
    member: 'MP',
    members: 'MPs',
    head: 'Prime Minister',
    headOffice: 'Number 10',
    government: 'the Government',
    place: 'the country',
    placeAdjective: 'British',
    speakerTitle: 'Speaker of the House of Commons',
    regions: [
      'scotland', 'wales', 'ni', 'london', 'southEast', 'southWest', 'east',
      'eastMidlands', 'westMidlands', 'northWest', 'northEast', 'yorkshire',
    ],
    // the engine's long-standing UK term: five years on paper, 4.75 in practice
    termDays: Math.round(4.75 * YEAR),
    fixedTerm: false,
    leaderOffice: 'leader',
    speakerOffice: 'speaker',
    parties: ['con', 'lab', 'ld', 'snp', 'green', 'reform', 'pc', 'ukip', 'brexit'],
    majorParties: ['con', 'lab'],
    jointExecutive: false,
    ladder: 'twoTier',
    deputyHead: 'Deputy Prime Minister',
    ranks: { senior: 'Secretary of State for', junior: 'Minister of State for' },
    hasPps: true,
    calendarKeys: ['pmqsWinter', 'budget', 'locals', 'pmqsSummer', 'recess', 'conference'],
    pressureScale: 1,
    // the Commons needs no voice: generated prose is written in its words
    committee: { chair: 'Chair', name: 'Select Committee', houseBallot: true },
    voice: {
      civilService: 'Whitehall', treasury: 'the Treasury',
      pps: { singular: 'Parliamentary Private Secretary', plural: 'Parliamentary Private Secretaries', abbr: 'PPS', abbrPlural: 'PPSs' },
      chiefWhip: 'Chief Whip', lobby: 'Portcullis House', keepsParliamentWord: true,
      termNoun: 'parliament', questions: 'PMQs', partyPrefixes: false,
    },
  },
  scotland: {
    arena: 'scotland',
    seat: 'Holyrood',
    house: 'the Scottish Parliament',
    houseThe: 'the Chamber',
    member: 'MSP',
    members: 'MSPs',
    head: 'First Minister',
    headOffice: 'Bute House',
    government: 'the Scottish Government',
    place: 'Scotland',
    placeAdjective: 'Scottish',
    speakerTitle: 'Presiding Officer',
    regions: ['scotland'],
    termDays: 5 * YEAR,
    fixedTerm: true,
    leaderOffice: 'leader',
    speakerOffice: 'speaker',
    parties: ['snp', 'lab', 'con', 'ld', 'sgp', 'alba', 'reform', 'ukip'],
    majorParties: ['snp', 'lab', 'con'],
    jointExecutive: false,
    ladder: 'twoTier',
    deputyHead: 'Deputy First Minister',
    ranks: { senior: 'Cabinet Secretary for', junior: 'Minister for' },
    hasPps: true,
    calendarKeys: ['pmqsWinter', 'budget', 'locals', 'pmqsSummer', 'recess', 'conference'],
    pressureScale: 1,
    committee: { chair: 'Convener', name: 'Committee', houseBallot: false },
    voice: {
      civilService: 'St Andrew’s House', treasury: 'the Scottish Government’s finance directorate',
      pps: { singular: 'Parliamentary Liaison Officer', plural: 'Parliamentary Liaison Officers', abbr: 'PLO', abbrPlural: 'PLOs' },
      chiefWhip: 'Minister for Parliamentary Business', lobby: 'the Garden Lobby',
      keepsParliamentWord: true, termNoun: 'parliament', questions: 'FMQs', partyPrefixes: true,
      greenParty: 'Scottish Greens',
    },
  },
  wales: {
    arena: 'wales',
    seat: 'Cardiff Bay',
    house: 'the Senedd',
    houseThe: 'the Senedd',
    member: 'MS',
    members: 'MSs',
    head: 'First Minister',
    // Wales has no official residence; the First Minister works from the Welsh
    // Government's headquarters in Cathays Park
    headOffice: 'Cathays Park',
    government: 'the Welsh Government',
    place: 'Wales',
    placeAdjective: 'Welsh',
    speakerTitle: 'Llywydd',
    regions: ['wales'],
    termDays: 5 * YEAR,
    fixedTerm: true,
    leaderOffice: 'leader',
    speakerOffice: 'speaker',
    parties: ['lab', 'pc', 'con', 'ld', 'green', 'reform', 'ukip'],
    majorParties: ['lab', 'con', 'pc'],
    jointExecutive: false,
    ladder: 'twoTier',
    deputyHead: 'Deputy First Minister',
    ranks: { senior: 'Cabinet Secretary for', junior: 'Minister for' },
    hasPps: false,
    calendarKeys: ['pmqsWinter', 'budget', 'locals', 'pmqsSummer', 'recess', 'conference'],
    pressureScale: 1,
    committee: { chair: 'Chair', name: 'Committee', houseBallot: false },
    voice: {
      civilService: 'Cathays Park', treasury: 'the Welsh Treasury',
      pps: { singular: 'parliamentary aide', plural: 'parliamentary aides', abbr: 'aide', abbrPlural: 'aides' },
      chiefWhip: 'Trefnydd', lobby: 'Tŷ Hywel',
      keepsParliamentWord: false, termNoun: 'Senedd term', questions: 'FMQs', partyPrefixes: true,
    },
  },
  ni: {
    arena: 'ni',
    seat: 'Stormont',
    house: 'the Northern Ireland Assembly',
    houseThe: 'the Assembly',
    member: 'MLA',
    members: 'MLAs',
    head: 'First Minister',
    headOffice: 'Stormont Castle',
    government: 'the Executive',
    place: 'Northern Ireland',
    // "Northern Irish" is avoided by half the place; the possessive is what the
    // Assembly's own documents use
    placeAdjective: 'Northern Ireland',
    speakerTitle: 'Speaker of the Assembly',
    regions: ['ni'],
    termDays: 5 * YEAR,
    fixedTerm: true,
    leaderOffice: 'leader',
    speakerOffice: 'speaker',
    parties: ['dup', 'sf', 'uup', 'sdlp', 'alliance', 'tuv', 'gpni', 'pbp'],
    majorParties: ['dup', 'sf', 'uup', 'sdlp', 'alliance'],
    jointExecutive: true,
    ladder: 'singleTier',
    // the lower-case d is the office's own style
    deputyHead: 'deputy First Minister',
    ranks: { senior: 'Minister', junior: 'Junior Minister' },
    hasPps: false,
    // no First Minister's Questions duel: the Executive answers as a body
    calendarKeys: ['budget', 'locals', 'recess', 'conference'],
    // the largest party polls under 30%, where a Westminster government would be in crisis
    pressureScale: 0.7,
    committee: { chair: 'Chair', name: 'Committee for', houseBallot: false },
    voice: {
      civilService: 'Stormont Castle', treasury: 'the Department of Finance',
      pps: { singular: 'special adviser', plural: 'special advisers', abbr: 'adviser', abbrPlural: 'advisers' },
      chiefWhip: 'Chief Whip', lobby: 'the Great Hall',
      keepsParliamentWord: false, termNoun: 'Assembly term', questions: 'Question Time',
      partyPrefixes: false,
    },
  },
};

export const DEVOLVED_ARENAS: DevolvedArenaId[] = ['scotland', 'wales', 'ni'];

/** the devolved chamber whose nation a region is, if that chamber is built.
 *  Northern Ireland returns null until the Assembly exists. */
export function nationOfRegion(region: RegionId): DevolvedArenaId | null {
  return DEVOLVED_ARENAS.includes(region as DevolvedArenaId)
    ? (region as DevolvedArenaId)
    : null;
}

export function chamberOf(arena: ArenaId | undefined): ChamberProfile {
  return CHAMBERS[arena ?? 'uk'] ?? CHAMBERS.uk;
}

export function isDevolved(arena: ArenaId | undefined): arena is DevolvedArenaId {
  return arena !== undefined && arena !== 'uk';
}

/** the chamber's name as a heading: "The House of Commons", but "Scottish
 *  Parliament" and "Senedd" — the devolved chambers do not take the article
 *  as a title */
export function houseHeading(arena: ArenaId | undefined, day?: GameDay): string {
  const c = day === undefined ? chamberOf(arena) : chamberAt(arena, day);
  if (c.arena === 'uk') return 'The House of Commons';
  const bare = c.house.replace(/^the /, '');
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

// ---------------------------------------------------------------------------
// the dates on which the Welsh institution renamed itself
// ---------------------------------------------------------------------------

/** the Senedd and Elections (Wales) Act 2020 took effect: the National Assembly
 *  for Wales became Senedd Cymru, and its Assembly Members became Members of the
 *  Senedd */
export const SENEDD_RENAME_DAY: GameDay = isoToDay('2020-05-06');
/** Welsh Ministers were restyled Cabinet Secretaries, and Deputy Ministers
 *  Ministers, when Vaughan Gething formed his government */
export const WELSH_CABSEC_DAY: GameDay = isoToDay('2024-03-21');
/** polling day for the first 96-member Senedd, elected by closed-list PR in
 *  sixteen six-member constituencies under the Senedd Cymru (Members and
 *  Elections) Act 2024 */
export const SENEDD_EXPANSION_DAY: GameDay = isoToDay('2026-05-07');

/** The chamber's nouns AS THEY WERE on a given day. Only Wales moves: before
 *  May 2020 it was the National Assembly for Wales and its members were AMs. */
export function chamberAt(arena: ArenaId | undefined, day: GameDay): ChamberProfile {
  const base = chamberOf(arena);
  if (base.arena === 'wales' && day < SENEDD_RENAME_DAY) {
    return {
      ...base,
      house: 'the National Assembly for Wales',
      houseThe: 'the Assembly',
      member: 'AM',
      members: 'AMs',
      speakerTitle: 'Presiding Officer',
    };
  }
  return base;
}

/** the ministerial rank nouns in a chamber on a given day: the profile's, except
 *  that Welsh ministers were "Minister for" and "Deputy Minister for" until
 *  March 2024 */
export function ministerialTitlesAt(
  arena: ArenaId, day: GameDay
): { senior: string; junior: string } {
  if (arena === 'wales' && day < WELSH_CABSEC_DAY) {
    return { senior: 'Minister for', junior: 'Deputy Minister for' };
  }
  return chamberOf(arena).ranks;
}

/** the Assembly Members (Reduction of Numbers) Act (Northern Ireland) 2016 received
 *  Royal Assent on 22 July 2016 and applied to the next election: every Assembly
 *  election from that day returns five members per constituency, not six (the
 *  first in fact was 2 March 2017) */
export const NI_FIVE_SEAT_DAY: GameDay = isoToDay('2016-07-22');

// ---------------------------------------------------------------------------
// seat systems
// ---------------------------------------------------------------------------

/** how the chamber elects its members on a given polling day. The Senedd's is the
 *  one that changes: AMS (40 + 20) until the 2026 election, then sixteen
 *  six-member constituencies by closed-list d'Hondt. */
export function seatSystemAt(arena: ArenaId | undefined, day: GameDay): SeatSystem {
  switch (arena ?? 'uk') {
    case 'scotland':
      return { kind: 'ams', regions: HOLYROOD_REGIONS };
    case 'wales':
      if (day >= SENEDD_EXPANSION_DAY) {
        return {
          kind: 'listPr', districts: SENEDD_2026_CONSTITUENCIES, seatsPer: 6,
          changeHeadline: 'The Senedd expands to ninety-six members, elected in sixteen six-member constituencies',
        };
      }
      return { kind: 'ams', regions: SENEDD_REGIONS };
    case 'ni':
      // the Assembly is elected by STV in the Westminster constituencies; until
      // the transfer count arrives each constituency is allocated by d'Hondt
      return {
        kind: 'listPr',
        districts: NI_CONSTITUENCIES.map((c) => ({ id: c.id, name: niConstituencyName(c, day) })),
        seatsPer: day >= NI_FIVE_SEAT_DAY ? 5 : 6,
        changeHeadline: 'The Assembly shrinks to ninety members, five for each constituency',
      };
    case 'uk':
      return { kind: 'fptp' };
  }
}

/** the total size of the House a seat system elects */
export function houseSizeOf(system: SeatSystem, fallback: number): number {
  if (system.kind === 'ams') {
    return system.regions.reduce((a, r) => a + r.constituencies + r.listSeats, 0);
  }
  if (system.kind === 'listPr') return system.districts.length * system.seatsPer;
  return fallback;
}

/** The next fixed polling day: the first Thursday in May, five years after the
 *  last one (Scottish Elections (Dates) Act 2016; Wales Act 2014). */
export function nextFixedElectionDay(lastElectionDay: GameDay): GameDay {
  const last = new Date(Date.UTC(2019, 0, 1) + lastElectionDay * 86_400_000);
  const year = last.getUTCFullYear() + 5;
  return firstThursdayInMay(year);
}

export function firstThursdayInMay(year: number): GameDay {
  const first = Date.UTC(year, 4, 1);
  const dow = new Date(first).getUTCDay(); // 0 Sunday … 4 Thursday
  const offset = (4 - dow + 7) % 7;
  return Math.round((first - Date.UTC(2019, 0, 1)) / 86_400_000) + offset;
}
