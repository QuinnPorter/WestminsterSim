import { ArenaId, DevolvedArenaId, Era, Party, PartyId, RegionId } from '../types/game';
import { CHAMBERS } from './chambers';
import { legislatureAt } from './devolved';

const GB: RegionId[] = [
  'scotland', 'wales', 'london', 'southEast', 'southWest', 'east',
  'eastMidlands', 'westMidlands', 'northWest', 'northEast', 'yorkshire',
];
const ENGLAND_WALES: RegionId[] = GB.filter((r) => r !== 'scotland');
const NI: RegionId[] = ['ni'];

export const PARTIES: Record<PartyId, Party> = {
  con: {
    id: 'con', name: 'Conservative Party', shortName: 'Con', colour: '#0087DC',
    ideology: 55, contestsRegions: GB, major: true,
  },
  lab: {
    id: 'lab', name: 'Labour Party', shortName: 'Lab', colour: '#E4003B',
    ideology: -60, contestsRegions: GB, major: true,
  },
  ld: {
    id: 'ld', name: 'Liberal Democrats', shortName: 'LD', colour: '#FAA61A',
    ideology: -15, contestsRegions: GB,
  },
  snp: {
    id: 'snp', name: 'Scottish National Party', shortName: 'SNP', colour: '#FDF38E',
    textColour: '#9B870C', ideology: -45, contestsRegions: ['scotland'],
  },
  green: {
    id: 'green', name: 'Green Party', shortName: 'Green', colour: '#02A95B',
    ideology: -70, contestsRegions: ENGLAND_WALES,
  },
  reform: {
    id: 'reform', name: 'Reform UK', shortName: 'Reform', colour: '#12B6CF',
    ideology: 75, contestsRegions: GB,
  },
  ukip: {
    id: 'ukip', name: 'UK Independence Party', shortName: 'UKIP', colour: '#70147A',
    ideology: 78, contestsRegions: GB,
  },
  brexit: {
    id: 'brexit', name: 'Brexit Party', shortName: 'Brexit', colour: '#11B0B9',
    ideology: 80, contestsRegions: GB,
  },
  pc: {
    id: 'pc', name: 'Plaid Cymru', shortName: 'PC', colour: '#005B54',
    ideology: -50, contestsRegions: ['wales'],
  },
  dup: {
    id: 'dup', name: 'Democratic Unionist Party', shortName: 'DUP', colour: '#D46A4C',
    ideology: 60, contestsRegions: NI,
  },
  sf: {
    id: 'sf', name: 'Sinn Féin', shortName: 'SF', colour: '#326760',
    ideology: -55, contestsRegions: NI, abstentionist: true,
  },
  sdlp: {
    id: 'sdlp', name: 'Social Democratic and Labour Party', shortName: 'SDLP', colour: '#2AA82C',
    ideology: -40, contestsRegions: NI,
  },
  alliance: {
    id: 'alliance', name: 'Alliance Party', shortName: 'All', colour: '#F6CB2F',
    textColour: '#A8850A', ideology: -10, contestsRegions: NI,
  },
  uup: {
    id: 'uup', name: 'Ulster Unionist Party', shortName: 'UUP', colour: '#48A5EE',
    ideology: 45, contestsRegions: NI,
  },
  // devolved-only parties. Neither stands for Westminster: the Scottish Greens
  // are a separate party from the Green Party of England and Wales, and Alba's
  // two MPs were defectors, never elected as such.
  sgp: {
    id: 'sgp', name: 'Scottish Greens', shortName: 'SGP', colour: '#00B140',
    ideology: -72, contestsRegions: ['scotland'], devolvedOnly: 'scotland',
  },
  alba: {
    id: 'alba', name: 'Alba Party', shortName: 'Alba', colour: '#005EB8',
    ideology: -35, contestsRegions: ['scotland'], devolvedOnly: 'scotland',
  },
  spk: {
    id: 'spk', name: 'Speaker', shortName: 'Spk', colour: '#909090',
    ideology: 0, contestsRegions: [],
  },
  ind: {
    id: 'ind', name: 'Independent', shortName: 'Ind', colour: '#B0A99C',
    ideology: 0, contestsRegions: [],
  },
};

/** parties the player can choose at character creation */
export const PLAYABLE_PARTIES: PartyId[] = [
  'con', 'lab', 'ld', 'snp', 'green', 'reform', 'pc',
];

/** GB parties included in national polling (full superset across all eras) */
export const POLLED_PARTIES: PartyId[] = [
  'con', 'lab', 'ld', 'snp', 'green', 'reform', 'pc', 'ukip', 'brexit',
];

/** the polled GB parties for a given era — the right-populist slot is
 *  era-specific: UKIP (2015/2017), Brexit Party (2019), Reform UK (2024), so
 *  only one ever appears in that era's polling and parliament. */
export function polledPartiesForEra(era: Era): PartyId[] {
  const base: PartyId[] = ['con', 'lab', 'ld', 'snp', 'green', 'pc'];
  if (era === '2010' || era === '2015' || era === '2017') return [...base, 'ukip'];
  if (era === '2019') return [...base, 'brexit'];
  return [...base, 'reform']; // 2024
}

/** the right-populist party that actually exists in a given era */
export function populistPartyForEra(era: Era): PartyId {
  if (era === '2010' || era === '2015' || era === '2017') return 'ukip';
  if (era === '2019') return 'brexit';
  return 'reform'; // 2024
}

/** the parties the player can choose at character creation, with the populist
 *  slot swapped to the era-correct party (UKIP / Brexit Party / Reform UK) */
export function playablePartiesForEra(era: Era): PartyId[] {
  const populist = populistPartyForEra(era);
  return PLAYABLE_PARTIES.map((p) =>
    p === 'reform' || p === 'brexit' || p === 'ukip' ? populist : p
  );
}

export function partyColour(id: PartyId): string {
  return PARTIES[id].colour;
}

export function partyTextColour(id: PartyId): string {
  return PARTIES[id].textColour ?? PARTIES[id].colour;
}

// ---------------------------------------------------------------------------
// chambers
// ---------------------------------------------------------------------------

/** The UK parties are the same organisations in every chamber, so a Labour MP
 *  who moves to Holyrood is still Labour. What changes is what the party is
 *  called there: Scottish Labour, the Welsh Conservatives. The SNP and Plaid are
 *  simply themselves everywhere. */
const CHAMBER_NAMES: Record<DevolvedArenaId, Partial<Record<PartyId, { name: string; shortName?: string }>>> = {
  scotland: {
    lab: { name: 'Scottish Labour' },
    con: { name: 'Scottish Conservatives' },
    ld: { name: 'Scottish Liberal Democrats' },
    green: { name: 'Scottish Greens', shortName: 'SGP' },
  },
  wales: {
    lab: { name: 'Welsh Labour' },
    con: { name: 'Welsh Conservatives' },
    ld: { name: 'Welsh Liberal Democrats' },
    green: { name: 'Wales Green Party' },
  },
};

/** a party's name as it is known in a chamber */
export function partyNameIn(id: PartyId, arena: ArenaId | undefined): string {
  if (!arena || arena === 'uk') return PARTIES[id].name;
  return CHAMBER_NAMES[arena][id]?.name ?? PARTIES[id].name;
}

/** names that take no article mid-sentence: "Scottish Labour", "Plaid Cymru",
 *  "Reform UK" — against "the Labour Party", "the Scottish Conservatives" */
const NO_ARTICLE = /(^|\s)Labour$|^Plaid Cymru$|^Reform UK$/;

/** a party name with the article it actually takes: "the Labour Party",
 *  "Scottish Labour", "the Scottish Greens", "Plaid Cymru" */
export function withArticle(name: string): string {
  return NO_ARTICLE.test(name) ? name : `the ${name}`;
}

export function partyNameWithArticle(id: PartyId, arena: ArenaId | undefined): string {
  return withArticle(partyNameIn(id, arena));
}

/** "Leader of the Labour Party", "Leader of Scottish Labour", "Leader of Plaid Cymru" */
export function leaderOfTitle(id: PartyId, arena: ArenaId | undefined): string {
  return `Leader of ${partyNameWithArticle(id, arena)}`;
}

/** The parties on a chamber's ballot. The Commons is era-dependent (the populist
 *  slot); a devolved chamber's is whichever parties contested its most recent
 *  election on or before `day`. */
export function polledPartiesForArena(arena: ArenaId, era: Era, day?: number): PartyId[] {
  if (arena === 'uk') return polledPartiesForEra(era);
  if (day !== undefined) return legislatureAt(arena, day).parties;
  return CHAMBERS[arena].parties;
}

/** The party a member of `from` would sit with in `to`: the same party, because
 *  these are the same organisations — except that a Green Party of England and
 *  Wales member joins the Scottish Greens at Holyrood (a separate party), and
 *  Alba has no Westminster home at all. */
export function counterpartParty(from: PartyId, to: ArenaId): PartyId | null {
  if (from === 'spk' || from === 'ind') return null;
  if (to === 'scotland') {
    if (from === 'green') return 'sgp';
    if (from === 'pc') return null;
    return from;
  }
  if (to === 'wales') {
    if (from === 'sgp') return 'green';
    if (from === 'snp' || from === 'alba') return null;
    return from;
  }
  // to Westminster
  if (from === 'sgp') return 'green';
  if (from === 'alba') return null;
  return from;
}

/** The parties that alternate in government in a chamber: Con/Lab at
 *  Westminster; at Holyrood the SNP, Labour and the Conservatives; in the Senedd
 *  Labour, the Conservatives and Plaid. Everyone else converts a surge to seats a
 *  little less efficiently and reverts harder toward its baseline. */
export function isMajorIn(p: PartyId, arena: ArenaId | undefined): boolean {
  if (!arena || arena === 'uk') return !!PARTIES[p]?.major;
  if (arena === 'scotland') return p === 'snp' || p === 'lab' || p === 'con';
  return p === 'lab' || p === 'con' || p === 'pc';
}
