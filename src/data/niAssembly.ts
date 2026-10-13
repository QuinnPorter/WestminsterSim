import type { LegislatureSnapshot } from './devolved';
import type { ExecutiveCollapseCause, PartyId } from '../types/game';
import { isoToDay } from '../engine/clock';

/**
 * The Northern Ireland Assembly: one snapshot per election a career can begin
 * at, in the shape `data/devolved.ts` uses for Holyrood and the Senedd. The
 * Assembly is elected by STV in the eighteen Westminster constituencies, six
 * members each until the 2017 election and five from it, so there are no list
 * regions: `districtSeats` carries every constituency's result, keyed by the
 * ids in `data/niWestminster.ts`, and the vote is the first-preference vote.
 *
 * Verified 12 October 2026 against two sources per figure:
 *   - ARK Northern Ireland Elections, ark.ac.uk/elections/fa11.htm, fa16.htm and
 *     the per-constituency pages (aeb, ael, ana, and, afoy, awb, aub);
 *   - NI Assembly Research and Information Service papers NIAR 263-11 (2011)
 *     and NIAR 141-16 (2016), and Research Matters, 12 October 2016;
 *   - House of Commons Library RP11-42 (2011) and CBP-7575 (2016);
 *   - CAIN, cain.ulster.ac.uk/issues/politics/election/2011nia and 2016nia, and
 *     its ministerial lists for the Executives formed.
 * Two source-side slips were resolved against the constituency pages: ARK's 2011
 * summary list shows a PUP seat in Belfast East that the count did not return
 * (DUP 3, Alliance 2, UUP 1), and its 2016 summary list omits Upper Bann's second
 * UUP seat (DUP 2, UUP 2, SF 2).
 *
 * 2017 and 2022 were verified 13 October 2026 against RaISe NIAR 20-17 and
 * NIAR 47-22, ARK fa17/fa22 and the constituency pages, CAIN ra2017/ra2022 and
 * House of Commons Library CBP-9549, with press count reports as the second
 * source for each constituency row. Two rows (2017 Foyle and North Antrim) rest
 * on two ARK pages plus press rather than two publishers; the 2022 split of the
 * minor parties is Wikipedia's but reconciles exactly to RaISe's 44,986 "others".
 *
 * The 2016 Executive formed on 25 May 2016 and fell on 9 January 2017; the 2017
 * and 2022 Assemblies opened with no Executive at all. The career fights those
 * collapses in the simulation, and the dormant Assembly is caught up through
 * the real chronology in `NI_EXECUTIVE_HISTORY` below.
 */

/** the Executive the election produced, as the formation step needs it. For an
 *  election after which none was formed (2017, 2022) the heads are the parties
 *  entitled to nominate and `parties`/`justice`/`declined` describe the
 *  Executive that history eventually re-formed. */
export interface ExecutiveSnapshot {
  /** the First Minister's party: the largest party */
  fm: 'dup' | 'sf' | 'uup' | 'sdlp' | 'alliance';
  /** the deputy First Minister's party: the largest party of the other community */
  dfm: 'dup' | 'sf' | 'uup' | 'sdlp' | 'alliance';
  /** every party holding a ministry, the Justice minister's included */
  parties: LegislatureSnapshot['parties'];
  /** who took Justice, which is elected by cross-community vote rather than
   *  allocated by d'Hondt: Alliance until 2016, an independent after */
  justice?: LegislatureSnapshot['parties'][number];
  /** parties entitled to a ministry that chose the opposition benches instead
   *  (possible only from the 2016 Assembly's official-opposition reforms) */
  declined: LegislatureSnapshot['parties'];
  status: 'formed' | 'collapsed';
  /** a collapsed start: when the heads ceased to hold office, why, and who is
   *  refusing to nominate */
  collapsedOn?: string;
  cause?: ExecutiveCollapseCause;
  blocker?: PartyId;
  /** a collapsed start whose ministers stayed in post as caretakers (the 2022
   *  Act): who held the departments, and until when */
  caretaker?: { until: string; parties: LegislatureSnapshot['parties']; justice?: PartyId };
}

/** What actually happened to the Executive, for a dormant Assembly caught up
 *  through real history: played to the day, deterministically, until the last
 *  verified event; the hazards take over beyond it. Each restoration names the
 *  Executive that formed. Verified 13 October 2026 against gov.uk (the Secretary
 *  of State's statements of January 2017), the Assembly's Minutes of Proceedings
 *  (3 February 2024), legislation.gov.uk (the Executive Formation Acts of 2022,
 *  2023 and 2024) and the Institute for Government's timeline. */
export type ExecutiveHistoryEvent =
  | { on: string; kind: 'collapse'; cause: ExecutiveCollapseCause; blocker: PartyId }
  | { on: string; kind: 'restore'; executive: ExecutiveSnapshot };

export const NI_EXECUTIVE_HISTORY: ExecutiveHistoryEvent[] = [
  // Martin McGuinness resigns as deputy First Minister at 5pm; Arlene Foster
  // ceases to hold office with him; the election is called on the 16th
  { on: '2017-01-09', kind: 'collapse', cause: 'dfmWalkout', blocker: 'sf' },
  // New Decade, New Approach: Foster and O'Neill nominated, five parties return
  { on: '2020-01-11', kind: 'restore', executive: {
    fm: 'dup', dfm: 'sf', parties: ['dup', 'sf', 'sdlp', 'uup', 'alliance'], justice: 'alliance',
    declined: [], status: 'formed',
  } },
  // Paul Givan resigns as First Minister over the Protocol (effective at midnight)
  { on: '2022-02-03', kind: 'collapse', cause: 'fmWalkout', blocker: 'dup' },
  // O'Neill and Little-Pengelly nominated; the SDLP takes the opposition benches
  { on: '2024-02-03', kind: 'restore', executive: {
    fm: 'sf', dfm: 'dup', parties: ['sf', 'dup', 'alliance', 'uup'], justice: 'alliance',
    declined: ['sdlp'], status: 'formed',
  } },
];

/** the last day the history above speaks for */
export const NI_EXECUTIVE_HISTORY_END = '2024-02-03';

/** The statutory clock for filling the two offices. Until the Northern Ireland
 *  (Ministers, Elections and Petitions of Concern) Act 2022 (Royal Assent
 *  8 February 2022): fourteen days after an election, seven after a resignation,
 *  then the Secretary of State's duty to call an election, met in practice by
 *  emergency Acts extending the period. From the 2022 Act: six weeks, renewed
 *  automatically up to twenty-four, with the other ministers staying in post as
 *  caretakers for up to twenty-four weeks after an election or forty-eight after
 *  a resignation. */
export interface FormationLaw {
  /** days to fill the offices after an election, renewals included */
  afterElection: number;
  /** days to fill the offices after the heads cease to hold office */
  afterVacancy: number;
  /** days the other ministers stay in post after an election (0: none) */
  caretakerAfterElection: number;
  /** days they stay after a resignation; before 2022 they stayed until the election */
  caretakerAfterVacancy: number | 'untilElection';
}

export const FORMATION_ACT_2022 = '2022-02-08';

export function formationLaw(day: number): FormationLaw {
  if (day < isoToDay(FORMATION_ACT_2022)) {
    return { afterElection: 14, afterVacancy: 7, caretakerAfterElection: 0, caretakerAfterVacancy: 'untilElection' };
  }
  return { afterElection: 24 * 7, afterVacancy: 24 * 7, caretakerAfterElection: 24 * 7, caretakerAfterVacancy: 48 * 7 };
}

export const NI_ASSEMBLY: (LegislatureSnapshot & { executive: ExecutiveSnapshot })[] = [
  {
    election: '2011-05-05',
    blurb: 'Peter Robinson and Martin McGuinness are returned at the head of a five-party Executive. Jim Allister takes the TUV’s first seat, the Greens hold North Down by 99 votes, and the UUP and SDLP go on losing ground to the two big parties.',
    seats: { dup: 38, sf: 29, uup: 16, sdlp: 14, alliance: 8, gpni: 1, tuv: 1, ind: 1 },
    districtSeats: {
      belfastEast: { dup: 3, alliance: 2, uup: 1 },
      belfastNorth: { dup: 3, sf: 2, sdlp: 1 },
      belfastSouth: { sdlp: 2, dup: 1, sf: 1, uup: 1, alliance: 1 },
      belfastWest: { sf: 5, sdlp: 1 },
      eastAntrim: { dup: 3, sf: 1, uup: 1, alliance: 1 },
      eastLondonderry: { dup: 3, sf: 1, sdlp: 1, ind: 1 },
      fermanaghSouthTyrone: { sf: 3, dup: 2, uup: 1 },
      foyle: { sdlp: 3, sf: 2, dup: 1 },
      laganValley: { dup: 4, uup: 1, alliance: 1 },
      midUlster: { sf: 3, dup: 1, uup: 1, sdlp: 1 },
      newryArmagh: { sf: 3, dup: 1, uup: 1, sdlp: 1 },
      northAntrim: { dup: 3, sf: 1, uup: 1, tuv: 1 },
      northDown: { dup: 3, uup: 1, alliance: 1, gpni: 1 },
      southAntrim: { dup: 3, sf: 1, uup: 1, alliance: 1 },
      southDown: { sf: 2, sdlp: 2, dup: 1, uup: 1 },
      strangford: { dup: 3, uup: 2, alliance: 1 },
      upperBann: { dup: 2, uup: 2, sf: 1, sdlp: 1 },
      westTyrone: { sf: 3, dup: 1, uup: 1, sdlp: 1 },
    },
    // the NI-wide first-preference vote; `ind` is every independent candidate
    shares: {
      dup: 0.300, sf: 0.269, sdlp: 0.142, uup: 0.132, alliance: 0.077, tuv: 0.025,
      gpni: 0.009, pbp: 0.008, ukip: 0.006, ind: 0.023,
    },
    parties: ['dup', 'sf', 'uup', 'sdlp', 'alliance', 'tuv', 'gpni'],
    governing: 'dup', opposition: 'tuv', arrangement: 'coalition', coalitionPartner: 'sf',
    executive: {
      fm: 'dup', dfm: 'sf',
      // DUP 4, SF 3, Alliance 1 by d'Hondt plus Justice, UUP 1, SDLP 1
      parties: ['dup', 'sf', 'alliance', 'uup', 'sdlp'],
      justice: 'alliance',
      declined: [],
      status: 'formed',
    },
  },
  {
    election: '2016-05-05',
    blurb: 'Arlene Foster’s first election as leader holds the DUP at 38. The UUP and SDLP walk out of the Executive to form the Assembly’s first official opposition, People Before Profit take Belfast West and Foyle, and an independent is handed Justice.',
    seats: { dup: 38, sf: 28, uup: 16, sdlp: 12, alliance: 8, gpni: 2, pbp: 2, tuv: 1, ind: 1 },
    districtSeats: {
      belfastEast: { dup: 3, alliance: 2, uup: 1 },
      belfastNorth: { dup: 3, sf: 2, sdlp: 1 },
      belfastSouth: { dup: 2, sf: 1, sdlp: 1, alliance: 1, gpni: 1 },
      belfastWest: { sf: 4, sdlp: 1, pbp: 1 },
      eastAntrim: { dup: 3, sf: 1, uup: 1, alliance: 1 },
      eastLondonderry: { dup: 3, sf: 1, sdlp: 1, ind: 1 },
      fermanaghSouthTyrone: { dup: 2, sf: 2, uup: 1, sdlp: 1 },
      foyle: { sf: 2, sdlp: 2, dup: 1, pbp: 1 },
      laganValley: { dup: 3, uup: 2, alliance: 1 },
      midUlster: { sf: 3, dup: 1, uup: 1, sdlp: 1 },
      newryArmagh: { sf: 3, dup: 1, uup: 1, sdlp: 1 },
      northAntrim: { dup: 3, sf: 1, uup: 1, tuv: 1 },
      northDown: { dup: 3, uup: 1, alliance: 1, gpni: 1 },
      southAntrim: { dup: 3, sf: 1, uup: 1, alliance: 1 },
      southDown: { sf: 2, sdlp: 2, dup: 1, uup: 1 },
      strangford: { dup: 3, uup: 2, alliance: 1 },
      upperBann: { dup: 2, uup: 2, sf: 2 },
      westTyrone: { sf: 3, dup: 1, uup: 1, sdlp: 1 },
    },
    shares: {
      dup: 0.292, sf: 0.240, uup: 0.126, sdlp: 0.120, alliance: 0.070, tuv: 0.034,
      gpni: 0.027, pbp: 0.020, ukip: 0.015, con: 0.004, ind: 0.033,
    },
    parties: ['dup', 'sf', 'uup', 'sdlp', 'alliance', 'tuv', 'gpni', 'pbp'],
    governing: 'dup', opposition: 'uup', arrangement: 'coalition', coalitionPartner: 'sf',
    executive: {
      fm: 'dup', dfm: 'sf',
      // DUP 4, SF 3, and Claire Sugden (independent) at Justice; the UUP (12 May)
      // and SDLP (19 May) took the opposition benches, and Alliance declined Justice
      parties: ['dup', 'sf', 'ind'],
      justice: 'ind',
      declined: ['uup', 'sdlp'],
      status: 'formed',
    },
  },
  {
    election: '2017-03-02',
    blurb: 'Nine weeks after Martin McGuinness walked out over the heating scandal, the Assembly is cut to ninety and Sinn Féin comes within one seat of the DUP. Unionism loses its majority for the first time, and nobody will nominate a deputy First Minister.',
    seats: { dup: 28, sf: 27, sdlp: 12, uup: 10, alliance: 8, gpni: 2, pbp: 1, tuv: 1, ind: 1 },
    districtSeats: {
      belfastEast: { dup: 2, uup: 1, alliance: 2 },
      belfastNorth: { dup: 2, sf: 2, sdlp: 1 },
      belfastSouth: { dup: 1, sf: 1, sdlp: 1, alliance: 1, gpni: 1 },
      belfastWest: { sf: 4, pbp: 1 },
      eastAntrim: { dup: 2, uup: 2, alliance: 1 },
      eastLondonderry: { dup: 2, sf: 1, sdlp: 1, ind: 1 },
      fermanaghSouthTyrone: { dup: 1, sf: 3, uup: 1 },
      foyle: { dup: 1, sf: 2, sdlp: 2 },
      laganValley: { dup: 2, sdlp: 1, uup: 1, alliance: 1 },
      midUlster: { dup: 1, sf: 3, sdlp: 1 },
      newryArmagh: { dup: 1, sf: 3, sdlp: 1 },
      northAntrim: { dup: 2, sf: 1, uup: 1, tuv: 1 },
      northDown: { dup: 2, uup: 1, alliance: 1, gpni: 1 },
      southAntrim: { dup: 2, sf: 1, uup: 1, alliance: 1 },
      southDown: { dup: 1, sf: 2, sdlp: 2 },
      strangford: { dup: 3, uup: 1, alliance: 1 },
      upperBann: { dup: 2, sf: 1, sdlp: 1, uup: 1 },
      westTyrone: { dup: 1, sf: 3, sdlp: 1 },
    },
    // valid votes 803,315 (CAIN); the PUP (0.7%) and the minor parties (1.1%) are
    // left out, so the table sums to a little under one
    shares: {
      dup: 0.281, sf: 0.279, uup: 0.129, sdlp: 0.119, alliance: 0.091, tuv: 0.026,
      gpni: 0.023, pbp: 0.018, con: 0.003, ukip: 0.002, ind: 0.018,
    },
    parties: ['dup', 'sf', 'uup', 'sdlp', 'alliance', 'tuv', 'gpni', 'pbp'],
    governing: 'dup', opposition: 'sdlp', arrangement: 'executive', coalitionPartner: 'sf',
    executive: {
      // the heads entitled to nominate; the Executive that formed three years
      // later is the one New Decade, New Approach produced
      fm: 'dup', dfm: 'sf', parties: ['dup', 'sf', 'sdlp', 'uup', 'alliance'], justice: 'alliance',
      declined: [], status: 'collapsed',
      collapsedOn: '2017-01-09', cause: 'noNomination', blocker: 'sf',
    },
  },
  {
    election: '2022-05-05',
    blurb: 'Three months after Paul Givan walked out over the Protocol, Sinn Féin becomes the largest party in Northern Ireland for the first time and Alliance doubles its seats. Michelle O’Neill is First Minister-designate, and the DUP will not nominate a deputy until the Protocol is dealt with.',
    seats: { sf: 27, dup: 25, alliance: 17, uup: 9, sdlp: 8, tuv: 1, pbp: 1, ind: 2 },
    districtSeats: {
      belfastEast: { dup: 2, uup: 1, alliance: 2 },
      belfastNorth: { dup: 2, sf: 2, alliance: 1 },
      belfastSouth: { dup: 1, sf: 1, sdlp: 1, alliance: 2 },
      belfastWest: { sf: 4, pbp: 1 },
      eastAntrim: { dup: 2, uup: 1, alliance: 2 },
      eastLondonderry: { dup: 2, sf: 1, sdlp: 1, ind: 1 },
      fermanaghSouthTyrone: { dup: 1, sf: 3, uup: 1 },
      foyle: { dup: 1, sf: 2, sdlp: 2 },
      laganValley: { dup: 2, uup: 1, alliance: 2 },
      midUlster: { dup: 1, sf: 3, sdlp: 1 },
      newryArmagh: { dup: 1, sf: 3, sdlp: 1 },
      northAntrim: { dup: 1, sf: 1, uup: 1, alliance: 1, tuv: 1 },
      northDown: { dup: 1, uup: 1, alliance: 2, ind: 1 },
      southAntrim: { dup: 2, sf: 1, uup: 1, alliance: 1 },
      southDown: { dup: 1, sf: 2, sdlp: 1, alliance: 1 },
      strangford: { dup: 2, uup: 1, alliance: 2 },
      upperBann: { dup: 2, sf: 1, uup: 1, alliance: 1 },
      westTyrone: { dup: 1, sf: 3, sdlp: 1 },
    },
    // valid votes 862,703; Aontú (1.5%), the PUP (0.3%) and the minor parties
    // (0.5%) are left out
    shares: {
      sf: 0.290, dup: 0.213, alliance: 0.135, uup: 0.112, sdlp: 0.091, tuv: 0.076,
      gpni: 0.019, pbp: 0.011, ind: 0.029,
    },
    parties: ['dup', 'sf', 'uup', 'sdlp', 'alliance', 'tuv', 'gpni', 'pbp'],
    governing: 'sf', opposition: 'sdlp', arrangement: 'executive', coalitionPartner: 'dup',
    executive: {
      fm: 'sf', dfm: 'dup', parties: ['sf', 'dup', 'alliance', 'uup'], justice: 'alliance',
      declined: ['sdlp'], status: 'collapsed',
      collapsedOn: '2022-02-03', cause: 'noNomination', blocker: 'dup',
      // the 2020 ministers stayed in post as caretakers until 28 October 2022
      caretaker: { until: '2022-10-28', parties: ['dup', 'sf', 'sdlp', 'uup', 'alliance'], justice: 'alliance' },
    },
  },
];
