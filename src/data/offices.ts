import { DepartmentId, Office, OfficeId } from '../types/game';

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  /** used in card token {department} */
  casual: string;
}

export const DEPARTMENTS: Record<DepartmentId, DepartmentInfo> = {
  treasury: { id: 'treasury', name: 'HM Treasury', casual: 'Treasury' },
  home: { id: 'home', name: 'Home Office', casual: 'Home Office' },
  foreign: { id: 'foreign', name: 'Foreign Office', casual: 'Foreign Office' },
  health: { id: 'health', name: 'Department of Health and Social Care', casual: 'Health' },
  education: { id: 'education', name: 'Department for Education', casual: 'Education' },
  defence: { id: 'defence', name: 'Ministry of Defence', casual: 'Defence' },
  justice: { id: 'justice', name: 'Ministry of Justice', casual: 'Justice' },
  transport: { id: 'transport', name: 'Department for Transport', casual: 'Transport' },
  environment: { id: 'environment', name: 'Defra', casual: 'Environment' },
  business: { id: 'business', name: 'Department for Business and Trade', casual: 'Business' },
  dwp: { id: 'dwp', name: 'Department for Work and Pensions', casual: 'Work and Pensions' },
  culture: { id: 'culture', name: 'DCMS', casual: 'Culture' },
  housing: { id: 'housing', name: 'Ministry of Housing, Communities & Local Government', casual: 'Housing' },
};

const DEPT_IDS = Object.keys(DEPARTMENTS) as DepartmentId[];

const SOS_TITLES: Record<DepartmentId, { gov: string; shadow: string }> = {
  treasury: { gov: 'Chancellor of the Exchequer', shadow: 'Shadow Chancellor' },
  home: { gov: 'Home Secretary', shadow: 'Shadow Home Secretary' },
  foreign: { gov: 'Foreign Secretary', shadow: 'Shadow Foreign Secretary' },
  health: { gov: 'Health Secretary', shadow: 'Shadow Health Secretary' },
  education: { gov: 'Education Secretary', shadow: 'Shadow Education Secretary' },
  defence: { gov: 'Defence Secretary', shadow: 'Shadow Defence Secretary' },
  justice: { gov: 'Justice Secretary', shadow: 'Shadow Justice Secretary' },
  transport: { gov: 'Transport Secretary', shadow: 'Shadow Transport Secretary' },
  environment: { gov: 'Environment Secretary', shadow: 'Shadow Environment Secretary' },
  business: { gov: 'Business Secretary', shadow: 'Shadow Business Secretary' },
  dwp: { gov: 'Work and Pensions Secretary', shadow: 'Shadow Work and Pensions Secretary' },
  culture: { gov: 'Culture Secretary', shadow: 'Shadow Culture Secretary' },
  housing: { gov: 'Housing Secretary', shadow: 'Shadow Housing Secretary' },
};

function buildOffices(): Record<OfficeId, Office> {
  const offices: Record<OfficeId, Office> = {
    pps: {
      id: 'pps', tier: 1,
      title: 'Parliamentary Private Secretary',
      shadowTitle: 'Parliamentary Aide to the Leader',
    },
    whip: {
      id: 'whip', tier: 2,
      title: 'Government Whip',
      shadowTitle: 'Opposition Whip',
    },
    chiefWhip: {
      id: 'chiefWhip', tier: 4,
      title: 'Chief Whip',
      shadowTitle: 'Opposition Chief Whip',
    },
    // Treasury junior ladder — both sit below Minister of State (tier 3)
    exchequer_sec: {
      id: 'exchequer_sec', tier: 3, department: 'treasury', rank: 1,
      title: 'Exchequer Secretary to the Treasury',
      shadowTitle: 'Shadow Exchequer Secretary to the Treasury',
    },
    financial_sec: {
      id: 'financial_sec', tier: 3, department: 'treasury', rank: 2,
      title: 'Financial Secretary to the Treasury',
      shadowTitle: 'Shadow Financial Secretary to the Treasury',
    },
    // Chief Secretary — junior cabinet (tier 4), below the Chancellor
    chief_sec: {
      id: 'chief_sec', tier: 4, department: 'treasury', rank: 1,
      title: 'Chief Secretary to the Treasury',
      shadowTitle: 'Shadow Chief Secretary to the Treasury',
    },
    // territorial Secretaries of State — only offered to a player from that nation
    sos_scotland: {
      id: 'sos_scotland', tier: 4, region: 'scotland',
      title: 'Scotland Secretary',
      shadowTitle: 'Shadow Scotland Secretary',
    },
    sos_wales: {
      id: 'sos_wales', tier: 4, region: 'wales',
      title: 'Wales Secretary',
      shadowTitle: 'Shadow Wales Secretary',
    },
    sos_ni: {
      id: 'sos_ni', tier: 4, region: 'ni',
      title: 'Northern Ireland Secretary',
      shadowTitle: 'Shadow Northern Ireland Secretary',
    },
    leader: {
      id: 'leader', tier: 5,
      title: 'Prime Minister',
      shadowTitle: 'Leader of the Opposition',
    },
    speaker: {
      id: 'speaker', tier: 0,
      title: 'Speaker of the House of Commons',
      shadowTitle: 'Speaker of the House of Commons',
    },
  };
  for (const dept of DEPT_IDS) {
    offices[`min_${dept}`] = {
      id: `min_${dept}`, tier: 3, department: dept,
      title: `Minister of State for ${DEPARTMENTS[dept].casual}`,
      shadowTitle: `Shadow Minister for ${DEPARTMENTS[dept].casual}`,
    };
    offices[`sos_${dept}`] = {
      id: `sos_${dept}`, tier: 4, department: dept,
      title: SOS_TITLES[dept].gov,
      shadowTitle: SOS_TITLES[dept].shadow,
    };
  }
  // place the auto-built Treasury posts on the sub-ladder: Minister of State sits
  // above the two junior secretaries; the Chancellor sits above the Chief Secretary
  offices.min_treasury.rank = 3;
  offices.sos_treasury.rank = 2;
  return offices;
}

export const OFFICES: Record<OfficeId, Office> = buildOffices();

/** the great offices of state — Chancellor, Home Secretary, Foreign Secretary */
export const GREAT_OFFICES: OfficeId[] = ['sos_treasury', 'sos_home', 'sos_foreign'];

/** offices that make up the cabinet / shadow cabinet display, in rank order */
export const CABINET_OFFICES: OfficeId[] = [
  'sos_treasury', 'sos_home', 'sos_foreign', 'sos_health', 'sos_education',
  'sos_defence', 'sos_justice', 'sos_business', 'sos_dwp', 'sos_transport',
  'sos_environment', 'sos_culture', 'sos_housing',
  'sos_scotland', 'sos_wales', 'sos_ni', 'chief_sec', 'chiefWhip',
];

export function officeTitle(officeId: OfficeId | null, inGovernment: boolean): string {
  if (!officeId) return inGovernment ? 'Backbench MP' : 'Backbench MP';
  const office = OFFICES[officeId];
  return inGovernment ? office.title : office.shadowTitle;
}

/** Title for an office, aware of minor-party spokesperson naming. Pass
 *  `minorPartyName` (the full party name) when the holder's party is neither
 *  the government nor the official opposition. */
export function officeTitleFor(
  officeId: OfficeId | null,
  opts: { inGovernment: boolean; minorPartyName?: string }
): string {
  if (!officeId) return 'Backbench MP';
  const { inGovernment, minorPartyName } = opts;
  if (!minorPartyName) return officeTitle(officeId, inGovernment);

  const office = OFFICES[officeId];
  if (office.id === 'leader') return `Leader of the ${minorPartyName}`;
  if (office.id === 'chiefWhip') return `${minorPartyName} Chief Whip`;
  if (office.id === 'whip') return `${minorPartyName} Whip`;
  if (office.id === 'pps') return `Aide to the ${minorPartyName} Leader`;
  if (office.department) {
    const dept = DEPARTMENTS[office.department].casual;
    // a single spokesperson rung for minor parties (no "lead" distinction)
    return `${minorPartyName} Spokesperson for ${dept}`;
  }
  return officeTitle(officeId, inGovernment);
}

export function officeTier(officeId: OfficeId | null): number {
  return officeId ? OFFICES[officeId].tier : 0;
}
