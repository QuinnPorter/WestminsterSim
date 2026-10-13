import type { LegislatureSnapshot } from './devolved';

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
 * The 2016 Executive formed on 25 May 2016 and fell on 9 January 2017; the
 * career fights that collapse in the simulation once P3 lands, so the 2016 era
 * is entered here but not offered until then.
 */

/** the Executive the election produced, as the formation step needs it */
export interface ExecutiveSnapshot {
  /** the First Minister's party: the largest party */
  fm: 'dup' | 'sf' | 'uup' | 'sdlp' | 'alliance';
  /** the deputy First Minister's party: the largest party of the other community */
  dfm: 'dup' | 'sf' | 'uup' | 'sdlp' | 'alliance';
  /** every party holding a ministry, the Justice minister's included */
  parties: LegislatureSnapshot['parties'];
  /** who took Justice, which is elected by cross-community vote rather than
   *  allocated by d'Hondt: Alliance until 2016, an independent after */
  justice: LegislatureSnapshot['parties'][number];
  /** parties entitled to a ministry that chose the opposition benches instead
   *  (possible only from the 2016 Assembly's official-opposition reforms) */
  declined: LegislatureSnapshot['parties'];
  status: 'formed' | 'collapsed';
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
    heldBack: true,
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
];
