import { Era, Party, PartyId, RegionId } from '../types/game';

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
  if (era === '2015' || era === '2017') return [...base, 'ukip'];
  if (era === '2019') return [...base, 'brexit'];
  return [...base, 'reform']; // 2024
}

export function partyColour(id: PartyId): string {
  return PARTIES[id].colour;
}

export function partyTextColour(id: PartyId): string {
  return PARTIES[id].textColour ?? PARTIES[id].colour;
}
