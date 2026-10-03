import { ArenaId, DevolvedArenaId, GameDay, OfficeId, PartyId, RegionId } from '../types/game';
import { isoToDay } from '../engine/clock';
import { HOLYROOD_REGIONS, SENEDD_2026_CONSTITUENCIES, SENEDD_REGIONS } from './devolvedSeats';

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
  /** closed-list proportional representation in multi-member constituencies */
  | { kind: 'listPr'; districts: { id: string; name: string }[]; seatsPer: number };

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
  },
};

export const DEVOLVED_ARENAS: DevolvedArenaId[] = ['scotland', 'wales'];

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

/** the ministerial rank nouns in a devolved chamber on a given day */
export function ministerialTitlesAt(
  arena: ArenaId, day: GameDay
): { senior: string; junior: string } {
  if (arena === 'wales' && day < WELSH_CABSEC_DAY) {
    return { senior: 'Minister for', junior: 'Deputy Minister for' };
  }
  if (arena === 'uk') return { senior: 'Secretary of State for', junior: 'Minister of State for' };
  return { senior: 'Cabinet Secretary for', junior: 'Minister for' };
}

// ---------------------------------------------------------------------------
// seat systems
// ---------------------------------------------------------------------------

/** how the chamber elects its members on a given polling day. The Senedd's is the
 *  one that changes: AMS (40 + 20) until the 2026 election, then sixteen
 *  six-member constituencies by closed-list d'Hondt. */
export function seatSystemAt(arena: ArenaId | undefined, day: GameDay): SeatSystem {
  if (arena === 'scotland') return { kind: 'ams', regions: HOLYROOD_REGIONS };
  if (arena === 'wales') {
    if (day >= SENEDD_EXPANSION_DAY) {
      return { kind: 'listPr', districts: SENEDD_2026_CONSTITUENCIES, seatsPer: 6 };
    }
    return { kind: 'ams', regions: SENEDD_REGIONS };
  }
  return { kind: 'fptp' };
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
