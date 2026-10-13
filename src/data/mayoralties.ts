import { GameDay, Player, RegionId } from '../types/game';
import { dayToDate, isoToDay } from '../engine/clock';

/**
 * England's directly elected "metro" mayors: the posts a sitting MP has
 * actually left the Commons to contest (Johnson, Khan, Burnham, Rotheram,
 * Brabin) or returned from (Johnson in 2015, Burnham in 2026). London's mayor
 * and the combined-authority mayors only; the game does not model council
 * mayors or police and crime commissioners.
 *
 * Verified 13 October 2026, two sources per polling day: London Elects, the
 * combined authorities' own results pages (GMCA, WMCA, WECA, SYMCA, WYCA, the
 * North East MCA, HEYCA, the Greater Lincolnshire CCA) and their constituent
 * councils' statements of results, GOV.UK (the 2020 postponement), the
 * Coronavirus Act 2020 s.60, legislation.gov.uk (SI 2024/414 bringing South
 * Yorkshire's 2026 poll forward to 2024; the Elections Act 2022 s.13, in force
 * for the May 2024 polls; the English Devolution and Community Empowerment Act
 * 2026, Sch. 30, commenced 29 June 2026), the Commons Library and the Institute
 * for Government. Where a next-election date is a four-year inference rather
 * than a published date it is noted on the entry.
 */
export interface Mayoralty {
  id: string;
  /** the office, as styled: "Mayor of Greater Manchester" */
  name: string;
  /** the place the office is spoken of by: "Manchester", "the West Midlands" */
  city: string;
  region: RegionId;
  /** polling days held so far, ISO */
  elections: string[];
  /** the day the authority ceased, where it did */
  abolished?: string;
  /** the mayoralty that took over its area */
  successor?: string;
}

export const MAYORALTIES: Mayoralty[] = [
  {
    id: 'london', name: 'Mayor of London', city: 'London', region: 'london',
    // 2004 fell with the European elections; the 2020 poll moved to 6 May 2021
    elections: ['2000-05-04', '2004-06-10', '2008-05-01', '2012-05-03', '2016-05-05', '2021-05-06', '2024-05-02'],
  },
  {
    id: 'greaterManchester', name: 'Mayor of Greater Manchester', city: 'Greater Manchester', region: 'northWest',
    elections: ['2017-05-04', '2021-05-06', '2024-05-02'],
  },
  {
    id: 'liverpoolCityRegion', name: 'Mayor of the Liverpool City Region', city: 'the Liverpool City Region', region: 'northWest',
    elections: ['2017-05-04', '2021-05-06', '2024-05-02'],
  },
  {
    id: 'westMidlands', name: 'Mayor of the West Midlands', city: 'the West Midlands', region: 'westMidlands',
    elections: ['2017-05-04', '2021-05-06', '2024-05-02'],
  },
  {
    id: 'teesValley', name: 'Mayor of the Tees Valley', city: 'the Tees Valley', region: 'northEast',
    elections: ['2017-05-04', '2021-05-06', '2024-05-02'],
  },
  {
    id: 'westOfEngland', name: 'Mayor of the West of England', city: 'the West of England', region: 'southWest',
    // not due in 2020, so untouched by the postponement
    elections: ['2017-05-04', '2021-05-06', '2025-05-01'],
  },
  {
    id: 'cambsPeterborough', name: 'Mayor of Cambridgeshire and Peterborough', city: 'Cambridgeshire and Peterborough', region: 'east',
    elections: ['2017-05-04', '2021-05-06', '2025-05-01'],
  },
  {
    id: 'southYorkshire', name: 'Mayor of South Yorkshire', city: 'South Yorkshire', region: 'yorkshire',
    // the Sheffield City Region until 2022; the 2026 poll was brought forward to
    // 2024 when the mayor took the police and crime commissioner's functions
    elections: ['2018-05-03', '2022-05-05', '2024-05-02'],
  },
  {
    id: 'northOfTyne', name: 'Mayor of the North of Tyne', city: 'the North of Tyne', region: 'northEast',
    // a single five-year term by design, then the North East took its area
    elections: ['2019-05-02'],
    abolished: '2024-05-07', successor: 'northEast',
  },
  {
    id: 'northEast', name: 'Mayor of the North East', city: 'the North East', region: 'northEast',
    elections: ['2024-05-02'],
  },
  {
    id: 'westYorkshire', name: 'Mayor of West Yorkshire', city: 'West Yorkshire', region: 'yorkshire',
    // a three-year first term, to join the 2024 cycle
    elections: ['2021-05-06', '2024-05-02'],
  },
  {
    id: 'eastMidlands', name: 'Mayor of the East Midlands', city: 'the East Midlands', region: 'eastMidlands',
    elections: ['2024-05-02'],
  },
  {
    id: 'yorkNorthYorkshire', name: 'Mayor of York and North Yorkshire', city: 'York and North Yorkshire', region: 'yorkshire',
    elections: ['2024-05-02'],
  },
  {
    id: 'hullEastYorkshire', name: 'Mayor of Hull and East Yorkshire', city: 'Hull and East Yorkshire', region: 'yorkshire',
    elections: ['2025-05-01'],
  },
  {
    id: 'greaterLincolnshire', name: 'Mayor of Greater Lincolnshire', city: 'Greater Lincolnshire', region: 'eastMidlands',
    // Lincolnshire proper is East Midlands; North and North East Lincolnshire
    // are counted with Yorkshire and the Humber, but the office sits in Lincoln
    elections: ['2025-05-01'],
  },
];

/** the first Thursday in May of a year, as a day */
function firstThursdayInMay(year: number): GameDay {
  const first = isoToDay(`${year}-05-01`);
  const weekday = dayToDate(first).getUTCDay(); // Sunday 0 … Thursday 4
  return first + ((4 - weekday + 7) % 7);
}

const TERM_YEARS = 4;
/** an authority exists, and its party is looking for a candidate, from about
 *  thirteen months before its first poll: the orders creating the combined
 *  authorities were made the spring before the first May election */
const CREATED_BEFORE_FIRST_POLL = 400;

/** the mayoralties whose area includes a region, on a day: created by then and
 *  not yet abolished */
export function mayoraltiesIn(region: RegionId, day: GameDay): Mayoralty[] {
  return MAYORALTIES.filter((m) =>
    m.region === region
    && isoToDay(m.elections[0]) - CREATED_BEFORE_FIRST_POLL <= day
    && (!m.abolished || day < isoToDay(m.abolished)));
}

/** the mayoralty's next polling day strictly after `after`: a listed one, else
 *  the first Thursday in May four years on from the last, and so on. An office
 *  that was abolished has no next poll of its own: its successor's is the one
 *  its holder faces (the North of Tyne's mayor stood for the North East). */
export function nextMayoralElection(m: Mayoralty, after: GameDay): GameDay {
  for (const iso of m.elections) {
    const d = isoToDay(iso);
    if (d > after) return d;
  }
  if (m.abolished && m.successor) {
    const heir = mayoraltyById(m.successor);
    if (heir) return nextMayoralElection(heir, after);
  }
  // the postponed 2021 polls left three-year terms and the cycle resumed on the
  // original years, so count on from the last listed poll in whole terms
  let year = Number(m.elections[m.elections.length - 1].slice(0, 4)) + TERM_YEARS;
  let next = firstThursdayInMay(year);
  while (next <= after) {
    year += TERM_YEARS;
    next = firstThursdayInMay(year);
  }
  return next;
}

export type MayoralVotingSystem = 'sv' | 'fptp';

/** the supplementary vote until the Elections Act 2022 took effect for the
 *  May 2024 polls, first past the post for those and the May 2025 ones, the
 *  supplementary vote again from the English Devolution and Community
 *  Empowerment Act 2026 */
export function mayoralVotingSystemAt(day: GameDay): MayoralVotingSystem {
  if (day < isoToDay('2024-05-02')) return 'sv';
  if (day < isoToDay('2026-06-29')) return 'fptp';
  return 'sv';
}

export function mayoraltyById(id: string): Mayoralty | undefined {
  return MAYORALTIES.find((m) => m.id === id);
}

/** the office a holder of `id` actually occupies on a day: the successor's,
 *  once the original has been abolished */
export function mayoraltyOn(id: string, day: GameDay): Mayoralty | undefined {
  const m = mayoraltyById(id);
  if (m?.abolished && m.successor && day >= isoToDay(m.abolished)) return mayoraltyById(m.successor) ?? m;
  return m;
}

/** the office a player holds or is running for on a day, successor included */
export function heldMayoralty(player: Pick<Player, 'mayor' | 'mayorCandidacy'>, day: GameDay): Mayoralty | undefined {
  const id = player.mayor?.mayoralty ?? player.mayorCandidacy?.mayoralty;
  return id ? mayoraltyOn(id, day) : undefined;
}

/** the office's name in prose, with a fallback for a missing one */
export function mayoraltyName(m: Mayoralty | undefined): string {
  return m?.name ?? 'the mayoralty';
}
