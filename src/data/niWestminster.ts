import { Era, GameDay, PartyId } from '../types/game';
import { isoToDay } from '../engine/clock';

/**
 * Northern Ireland at Westminster: the eighteen real constituencies and, for
 * each era's general election, the NI-wide vote and the winner of every seat.
 *
 * Northern Ireland has its own party system, so it is the one region whose
 * seats cannot be swung by the GB poll. These tables anchor the NI ballot
 * (`PollingState.ni`) and dress the generated NI seats with their real names
 * and a vote climate that matches the published result.
 *
 * Verified 12 October 2026 against the official and archival returns, each
 * figure confirmed by a second source:
 *   - House of Commons Library results site, electionresults.parliament.uk
 *     (2010: /election/2010-05-06/results/Location/Country/Northern%20Ireland;
 *      2015: /election/2015-05-07/…; 2017: /general-elections/3/countries/4;
 *      2019: /general-elections/4/countries/4; 2024: /general-elections/6/countries/4)
 *   - CAIN, cain.ulster.ac.uk/issues/politics/election/{2010,2015,2017}west/
 *   - ARK Northern Ireland Elections, ark.ac.uk/elections/fw{10,15,17,19,2024}.htm
 *   - NI Assembly Research and Information Service papers 0719 (2019) and 2524 (2024)
 * Shares are to one decimal place as published; `others` gathers the parties
 * the game does not model at Westminster (Green NI, People Before Profit,
 * Aontú, the Workers Party) and `ind` every independent candidate.
 */

export interface NiConstituency {
  id: string;
  name: string;
  /** the name before the 2023 boundary review took effect at the 2024 election */
  nameBefore2024?: string;
}

/** the seats, in the alphabetical order the returns use */
export const NI_CONSTITUENCIES: NiConstituency[] = [
  { id: 'belfastEast', name: 'Belfast East' },
  { id: 'belfastNorth', name: 'Belfast North' },
  { id: 'belfastSouth', name: 'Belfast South and Mid Down', nameBefore2024: 'Belfast South' },
  { id: 'belfastWest', name: 'Belfast West' },
  { id: 'eastAntrim', name: 'East Antrim' },
  { id: 'eastLondonderry', name: 'East Londonderry' },
  { id: 'fermanaghSouthTyrone', name: 'Fermanagh and South Tyrone' },
  { id: 'foyle', name: 'Foyle' },
  { id: 'laganValley', name: 'Lagan Valley' },
  { id: 'midUlster', name: 'Mid Ulster' },
  { id: 'newryArmagh', name: 'Newry and Armagh' },
  { id: 'northAntrim', name: 'North Antrim' },
  { id: 'northDown', name: 'North Down' },
  { id: 'southAntrim', name: 'South Antrim' },
  { id: 'southDown', name: 'South Down' },
  { id: 'strangford', name: 'Strangford' },
  { id: 'upperBann', name: 'Upper Bann' },
  { id: 'westTyrone', name: 'West Tyrone' },
];

/** polling day of the first election on the 2023 boundaries */
export const NI_BOUNDARY_DAY: GameDay = isoToDay('2024-07-04');

/** a constituency's name as it was on a given day */
export function niConstituencyName(c: NiConstituency, day: GameDay): string {
  return day < NI_BOUNDARY_DAY && c.nameBefore2024 ? c.nameBefore2024 : c.name;
}

export interface NiWestminsterResult {
  /** ISO polling day */
  election: string;
  /** the NI-wide vote, 0..1, by party the game models; sums with `others` to about one */
  shares: Partial<Record<PartyId, number>>;
  /** the share taken by parties the game does not model at Westminster */
  others: number;
  /** the parties the NI ballot polls: everyone who held or seriously contested seats */
  polled: PartyId[];
  /** the winner of every constituency, by `NiConstituency.id` */
  winners: Record<string, PartyId>;
}

const POLLED_NI: PartyId[] = ['dup', 'sf', 'sdlp', 'uup', 'alliance'];

export const NI_WESTMINSTER: Record<Era, NiWestminsterResult> = {
  // Sinn Féin top the poll for the first time; Naomi Long unseats the First
  // Minister in Belfast East; the UUP–Conservative pact (UCUNF) wins nothing.
  '2010': {
    election: '2010-05-06',
    shares: {
      sf: 0.255, dup: 0.250, sdlp: 0.165, uup: 0.152, alliance: 0.063, tuv: 0.039,
      ind: 0.071,
    },
    others: 0.005,
    polled: POLLED_NI,
    winners: {
      belfastEast: 'alliance', belfastNorth: 'dup', belfastSouth: 'sdlp', belfastWest: 'sf',
      eastAntrim: 'dup', eastLondonderry: 'dup', fermanaghSouthTyrone: 'sf', foyle: 'sdlp',
      laganValley: 'dup', midUlster: 'sf', newryArmagh: 'sf', northAntrim: 'dup',
      northDown: 'ind', southAntrim: 'dup', southDown: 'sdlp', strangford: 'dup',
      upperBann: 'dup', westTyrone: 'sf',
    },
  },
  // The DUP take Belfast East back; the UUP return to the Commons with two gains
  // (Fermanagh and South Tyrone, South Antrim); Alliance lose their only seat.
  '2015': {
    election: '2015-05-07',
    shares: {
      dup: 0.257, sf: 0.245, uup: 0.160, sdlp: 0.139, alliance: 0.086, ukip: 0.026,
      tuv: 0.023, con: 0.013, ind: 0.028,
    },
    others: 0.023,
    polled: POLLED_NI,
    winners: {
      belfastEast: 'dup', belfastNorth: 'dup', belfastSouth: 'sdlp', belfastWest: 'sf',
      eastAntrim: 'dup', eastLondonderry: 'dup', fermanaghSouthTyrone: 'uup', foyle: 'sdlp',
      laganValley: 'dup', midUlster: 'sf', newryArmagh: 'sf', northAntrim: 'dup',
      northDown: 'ind', southAntrim: 'uup', southDown: 'sdlp', strangford: 'dup',
      upperBann: 'dup', westTyrone: 'sf',
    },
  },
  // The two-party squeeze: the DUP and Sinn Féin take seventeen of eighteen
  // seats, the SDLP and UUP are wiped out, and Lady Hermon holds North Down.
  '2017': {
    election: '2017-06-08',
    shares: {
      dup: 0.360, sf: 0.294, sdlp: 0.117, uup: 0.103, alliance: 0.079, con: 0.005,
      tuv: 0.004, ind: 0.022,
    },
    others: 0.016,
    polled: POLLED_NI,
    winners: {
      belfastEast: 'dup', belfastNorth: 'dup', belfastSouth: 'dup', belfastWest: 'sf',
      eastAntrim: 'dup', eastLondonderry: 'dup', fermanaghSouthTyrone: 'sf', foyle: 'sf',
      laganValley: 'dup', midUlster: 'sf', newryArmagh: 'sf', northAntrim: 'dup',
      northDown: 'ind', southAntrim: 'dup', southDown: 'sf', strangford: 'dup',
      upperBann: 'dup', westTyrone: 'sf',
    },
  },
  // Nigel Dodds loses Belfast North; the SDLP return in Belfast South and Foyle;
  // Alliance take North Down after Lady Hermon retires. Nationalist and other
  // MPs outnumber unionists for the first time.
  '2019': {
    election: '2019-12-12',
    shares: {
      dup: 0.306, sf: 0.228, alliance: 0.168, sdlp: 0.149, uup: 0.117, con: 0.007,
      ukip: 0.001, ind: 0.002,
    },
    others: 0.023,
    polled: POLLED_NI,
    winners: {
      belfastEast: 'dup', belfastNorth: 'sf', belfastSouth: 'sdlp', belfastWest: 'sf',
      eastAntrim: 'dup', eastLondonderry: 'dup', fermanaghSouthTyrone: 'sf', foyle: 'sdlp',
      laganValley: 'dup', midUlster: 'sf', newryArmagh: 'sf', northAntrim: 'dup',
      northDown: 'alliance', southAntrim: 'dup', southDown: 'sf', strangford: 'dup',
      upperBann: 'dup', westTyrone: 'sf',
    },
  },
  // On the new boundaries Sinn Féin are the largest party by seats and votes;
  // the DUP lose Lagan Valley to Alliance, South Antrim to the UUP and North
  // Antrim to the TUV's Jim Allister; Alex Easton takes North Down as an
  // independent.
  '2024': {
    election: '2024-07-04',
    shares: {
      sf: 0.270, dup: 0.221, alliance: 0.150, uup: 0.122, sdlp: 0.111, tuv: 0.062,
      con: 0.001, ind: 0.030,
    },
    others: 0.032,
    polled: POLLED_NI,
    winners: {
      belfastEast: 'dup', belfastNorth: 'sf', belfastSouth: 'sdlp', belfastWest: 'sf',
      eastAntrim: 'dup', eastLondonderry: 'dup', fermanaghSouthTyrone: 'sf', foyle: 'sdlp',
      laganValley: 'alliance', midUlster: 'sf', newryArmagh: 'sf', northAntrim: 'tuv',
      northDown: 'ind', southAntrim: 'uup', southDown: 'sf', strangford: 'dup',
      upperBann: 'dup', westTyrone: 'sf',
    },
  },
};
