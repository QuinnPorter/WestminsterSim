import { BackgroundId, DepartmentId, PlayerStats } from '../types/game';

export interface BackgroundInfo {
  id: BackgroundId;
  name: string;
  blurb: string;
  /** added to starting stats (base 40-50ish) */
  statMods: Partial<Record<keyof PlayerStats, number>>;
  /** appointment-score bonus when the office is in one of these departments */
  deptAffinity: DepartmentId[];
  /** flat bonus applied for affinity departments */
  deptBonus: number;
}

export const BACKGROUNDS: Record<BackgroundId, BackgroundInfo> = {
  advisor: {
    id: 'advisor', name: 'Political Advisor',
    blurb: 'You know where the bodies are buried — you helped bury several.',
    statMods: { partyStanding: 8, competence: 4, constituencyApproval: -4 },
    deptAffinity: [], deptBonus: 0,
  },
  lawyer: {
    id: 'lawyer', name: 'Barrister',
    blurb: 'Forensic in committee, lethal at the despatch box.',
    statMods: { competence: 8, profile: 3 },
    deptAffinity: ['justice', 'home'], deptBonus: 8,
  },
  business: {
    id: 'business', name: 'Businessperson',
    blurb: 'You ran a company. How hard can a country be?',
    statMods: { competence: 5, profile: 4, integrity: -3 },
    deptAffinity: ['business', 'treasury'], deptBonus: 8,
  },
  foreignService: {
    id: 'foreignService', name: 'Diplomat',
    blurb: 'Fluent in three languages and the dark art of saying nothing.',
    statMods: { competence: 6, partyStanding: 3 },
    deptAffinity: ['foreign', 'defence'], deptBonus: 8,
  },
  manualLabour: {
    id: 'manualLabour', name: 'Trade Worker',
    blurb: 'You built things with your hands.',
    statMods: { constituencyApproval: 10, integrity: 5, partyStanding: -3 },
    deptAffinity: ['transport', 'dwp'], deptBonus: 6,
  },
  teacher: {
    id: 'teacher', name: 'Teacher',
    blurb: 'You can silence a room of thirty teenagers.',
    statMods: { constituencyApproval: 6, integrity: 4 },
    deptAffinity: ['education'], deptBonus: 10,
  },
  doctor: {
    id: 'doctor', name: 'Doctor',
    blurb: 'You left the wards to fix the system that runs them.',
    statMods: { competence: 5, integrity: 6, profile: 2 },
    deptAffinity: ['health'], deptBonus: 10,
  },
  journalist: {
    id: 'journalist', name: 'Journalist',
    blurb: 'You spent years skewering politicians. Now you are one.',
    statMods: { profile: 10, integrity: -2, partyStanding: -2 },
    deptAffinity: ['culture'], deptBonus: 8,
  },
  military: {
    id: 'military', name: 'Armed Forces',
    blurb: 'You served; you expect orders to be followed.',
    statMods: { integrity: 6, constituencyApproval: 5, competence: 2 },
    deptAffinity: ['defence'], deptBonus: 10,
  },
  councillor: {
    id: 'councillor', name: 'Local Councillor',
    blurb: 'Bins, planning rows and ward surgeries — you know your patch.',
    statMods: { constituencyApproval: 8, competence: 3, partyStanding: 2 },
    deptAffinity: ['dwp', 'transport'], deptBonus: 6,
  },
  mayor: {
    id: 'mayor', name: 'Big City Mayor',
    blurb: 'You ran a city the size of a small country.',
    statMods: { profile: 8, competence: 5, constituencyApproval: 6, partyStanding: 4 },
    deptAffinity: ['business', 'transport'], deptBonus: 8,
  },
  tradeUnionist: {
    id: 'tradeUnionist', name: 'Trade Unionist',
    blurb: 'You rose through the movement; you can read any room.',
    statMods: { partyStanding: 8, integrity: 4, constituencyApproval: 3, competence: -2 },
    deptAffinity: ['dwp', 'business'], deptBonus: 7,
  },
  academic: {
    id: 'academic', name: 'Academic',
    blurb: 'A career of seminars, peer review and hard evidence.',
    statMods: { competence: 9, profile: 2, constituencyApproval: -3 },
    deptAffinity: ['treasury', 'education'], deptBonus: 8,
  },
  police: {
    id: 'police', name: 'Police Officer',
    blurb: 'Years on the front line of law and order.',
    statMods: { constituencyApproval: 7, integrity: 5, competence: 2 },
    deptAffinity: ['home', 'justice'], deptBonus: 9,
  },
};

export const BACKGROUND_IDS = Object.keys(BACKGROUNDS) as BackgroundId[];
