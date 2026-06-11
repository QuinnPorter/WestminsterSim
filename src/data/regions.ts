import { RegionId } from '../types/game';

export interface RegionInfo {
  id: RegionId;
  name: string;
  /** how strongly the region follows the national swing (1 = fully) */
  swingSensitivity: number;
}

export const REGIONS: Record<RegionId, RegionInfo> = {
  northEast: { id: 'northEast', name: 'North East', swingSensitivity: 1 },
  northWest: { id: 'northWest', name: 'North West', swingSensitivity: 1 },
  yorkshire: { id: 'yorkshire', name: 'Yorkshire and the Humber', swingSensitivity: 1 },
  eastMidlands: { id: 'eastMidlands', name: 'East Midlands', swingSensitivity: 1 },
  westMidlands: { id: 'westMidlands', name: 'West Midlands', swingSensitivity: 1 },
  east: { id: 'east', name: 'East of England', swingSensitivity: 1 },
  london: { id: 'london', name: 'London', swingSensitivity: 0.9 },
  southEast: { id: 'southEast', name: 'South East', swingSensitivity: 1 },
  southWest: { id: 'southWest', name: 'South West', swingSensitivity: 1 },
  scotland: { id: 'scotland', name: 'Scotland', swingSensitivity: 0.6 },
  wales: { id: 'wales', name: 'Wales', swingSensitivity: 0.85 },
  ni: { id: 'ni', name: 'Northern Ireland', swingSensitivity: 0 },
};

export const REGION_IDS = Object.keys(REGIONS) as RegionId[];

/** regions a player can pick at creation (NI excluded — its party system is separate) */
export const PLAYER_REGIONS: RegionId[] = REGION_IDS.filter((r) => r !== 'ni');
