import {
  ArenaId, DepartmentId, DevolvedArenaId, DevolvedDepartmentId, GameDay, Office, OfficeId,
  UkDepartmentId,
} from '../types/game';
import { CHAMBERS, DEVOLVED_ARENAS, ministerialTitlesAt } from './chambers';
import { withArticle } from './parties';

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  /** used in card token {department} */
  casual: string;
}

/** The Whitehall departments. Several sites in career.ts pick a random portfolio
 *  by iterating this record, so it must never gain a devolved brief. */
export const DEPARTMENTS: Record<UkDepartmentId, DepartmentInfo> = {
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
  energy: { id: 'energy', name: 'Department for Energy Security and Net Zero', casual: 'Energy' },
  scienceTech: { id: 'scienceTech', name: 'Department for Science, Innovation and Technology', casual: 'Science and Technology' },
};

/** briefs that exist only in a devolved cabinet */
export const DEVOLVED_DEPARTMENTS: Record<DevolvedDepartmentId, DepartmentInfo> = {
  finance: { id: 'finance', name: 'the finance directorates', casual: 'Finance' },
  rural: { id: 'rural', name: 'the rural affairs directorates', casual: 'Rural Affairs' },
  socialJustice: { id: 'socialJustice', name: 'the social justice directorates', casual: 'Social Justice' },
  constitution: { id: 'constitution', name: 'the constitution and external affairs directorates', casual: 'the Constitution' },
};

/** look up any department, Whitehall or devolved */
export function departmentInfo(id: DepartmentId): DepartmentInfo {
  return (DEPARTMENTS as Record<string, DepartmentInfo>)[id]
    ?? (DEVOLVED_DEPARTMENTS as Record<string, DepartmentInfo>)[id];
}

const DEPT_IDS = Object.keys(DEPARTMENTS) as UkDepartmentId[];

const SOS_TITLES: Record<UkDepartmentId, { gov: string; shadow: string }> = {
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
  energy: { gov: 'Energy Secretary', shadow: 'Shadow Energy Secretary' },
  scienceTech: { gov: 'Science Secretary', shadow: 'Shadow Science Secretary' },
};

// ---------------------------------------------------------------------------
// devolved chambers
// ---------------------------------------------------------------------------

/** The briefs each devolved cabinet actually holds. Justice and policing are
 *  devolved to Scotland and not to Wales; neither has defence, foreign affairs,
 *  the Home Office or the main of social security. Finance, Health and Education
 *  are most of what either government does. */
const DEVOLVED_CABINET: Record<DevolvedArenaId, DepartmentId[]> = {
  scotland: [
    'finance', 'health', 'education', 'justice', 'business', 'energy', 'transport',
    'rural', 'socialJustice', 'constitution', 'housing',
  ],
  wales: [
    'finance', 'health', 'education', 'business', 'environment', 'transport',
    'housing', 'socialJustice', 'culture',
  ],
};

/** the full portfolio names each government uses, where they differ from the
 *  Whitehall casual name. Scotland: "Cabinet Secretary for Health and Social
 *  Care"; Wales: "Cabinet Secretary for Economy, Energy and Planning". */
const DEVOLVED_BRIEF_NAMES: Record<DevolvedArenaId, Partial<Record<DepartmentId, string>>> = {
  scotland: {
    finance: 'Finance and Local Government',
    health: 'Health and Social Care',
    education: 'Education and Skills',
    justice: 'Justice and Home Affairs',
    business: 'Economy and Gaelic',
    energy: 'Net Zero and Energy',
    transport: 'Transport',
    rural: 'Rural Affairs, Land Reform and Islands',
    socialJustice: 'Social Justice',
    constitution: 'the Constitution, External Affairs and Culture',
    housing: 'Housing',
  },
  wales: {
    finance: 'Finance and Welsh Language',
    health: 'Health and Social Care',
    education: 'Education',
    business: 'Economy, Energy and Planning',
    environment: 'Climate Change and Rural Affairs',
    transport: 'Transport and North Wales',
    housing: 'Housing and Local Government',
    socialJustice: 'Social Justice',
    culture: 'Culture, Skills and Social Partnership',
  },
};

/** the brief name used inside a devolved title */
export function devolvedBriefName(arena: DevolvedArenaId, dept: DepartmentId): string {
  return DEVOLVED_BRIEF_NAMES[arena][dept] ?? departmentInfo(dept).casual;
}

/** The senior briefs in a devolved cabinet — the devolved counterpart of
 *  GREAT_OFFICES. Finance runs the money; Health and Education are together most
 *  of what either government spends it on. */
const DEVOLVED_GREAT_DEPTS: DepartmentId[] = ['finance', 'health', 'education'];

/** within-tier seniority for a devolved brief, mirroring the `rank` the UK
 *  offices carry. Without this every devolved cabinet seat scores the same and
 *  the reshuffle pecking order collapses. */
function devolvedRank(dept: DepartmentId): number {
  const i = DEVOLVED_GREAT_DEPTS.indexOf(dept);
  if (i >= 0) return 5 - i;          // finance 5, health 4, education 3
  return dept === 'justice' ? 2 : 1;
}

/** a Cabinet Secretary's office id: the senior, tier-4 rung */
export function cabsecOfficeId(arena: DevolvedArenaId, dept: DepartmentId): OfficeId {
  return `${arena}_cabsec_${dept}`;
}
/** a junior Minister's office id: the tier-3 rung under a Cabinet Secretary */
export function devolvedMinisterOfficeId(arena: DevolvedArenaId, dept: DepartmentId): OfficeId {
  return `${arena}_min_${dept}`;
}

function buildDevolvedOffices(): Record<OfficeId, Office> {
  const out: Record<OfficeId, Office> = {};
  for (const arena of DEVOLVED_ARENAS) {
    for (const dept of DEVOLVED_CABINET[arena]) {
      const brief = devolvedBriefName(arena, dept);
      // titles stored here are the CURRENT ones; officeTitleIn applies the
      // date-dependent Welsh forms (Minister / Deputy Minister before 2024)
      out[cabsecOfficeId(arena, dept)] = {
        id: cabsecOfficeId(arena, dept), tier: 4, department: dept, arena,
        rank: devolvedRank(dept),
        title: `Cabinet Secretary for ${brief}`,
        shadowTitle: `Shadow Cabinet Secretary for ${brief}`,
      };
      out[devolvedMinisterOfficeId(arena, dept)] = {
        id: devolvedMinisterOfficeId(arena, dept), tier: 3, department: dept, arena,
        rank: devolvedRank(dept),
        title: `Minister for ${brief}`,
        shadowTitle: `Shadow Minister for ${brief}`,
      };
    }
  }
  return out;
}

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
    // Chancellor of the Duchy of Lancaster — a senior, portfolio-less cabinet
    // enforcer (can be made Deputy PM). Sits high in the pecking order.
    chancellor_duchy: {
      id: 'chancellor_duchy', tier: 4, rank: 3,
      title: 'Chancellor of the Duchy of Lancaster',
      shadowTitle: 'Shadow Chancellor of the Duchy of Lancaster',
    },
    // Attorney General — the government's chief legal officer. Ranks like the Chief
    // Secretary (tier 4) but is NOT a cabinet member, so it stays out of
    // CABINET_OFFICES (no NPC, never in the cabinet table or Deputy-PM pool).
    attorney_general: {
      id: 'attorney_general', tier: 4, rank: 1,
      title: 'Attorney General',
      shadowTitle: 'Shadow Attorney General',
    },
    // Leader of the House (also Lord President of the Council): a tier-4 cabinet
    // office with no department — manages the business of the House
    leader_house: {
      id: 'leader_house', tier: 4, rank: 2,
      title: 'Leader of the House of Commons',
      shadowTitle: 'Shadow Leader of the House of Commons',
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
  // the devolved ministries live in the same flat registry
  Object.assign(offices, buildDevolvedOffices());
  return offices;
}

export const OFFICES: Record<OfficeId, Office> = buildOffices();

/** the great offices of state — Chancellor, Home Secretary, Foreign Secretary */
export const GREAT_OFFICES: OfficeId[] = ['sos_treasury', 'sos_home', 'sos_foreign'];

/** is this office one of its chamber's great offices: the three above at
 *  Westminster; Finance, Health and Education in a devolved cabinet */
export function isGreatOffice(officeId: OfficeId): boolean {
  const office = OFFICES[officeId];
  if (!office) return false;
  if (!office.arena || office.arena === 'uk') return GREAT_OFFICES.includes(officeId);
  return office.tier === 4 && !!office.department && DEVOLVED_GREAT_DEPTS.includes(office.department);
}

/** offices that make up the cabinet / shadow cabinet display, in rank order.
 *  The Commons roster; use `cabinetOfficesFor(arena)` for the live chamber. */
export const CABINET_OFFICES: OfficeId[] = [
  'sos_treasury', 'sos_home', 'sos_foreign', 'chancellor_duchy',
  'sos_health', 'sos_education', 'sos_defence', 'sos_justice', 'sos_business',
  'sos_scienceTech', 'sos_energy', 'sos_dwp', 'sos_transport', 'sos_environment', 'sos_culture', 'sos_housing',
  'sos_scotland', 'sos_wales', 'sos_ni', 'leader_house', 'chief_sec', 'chiefWhip',
];

/** the cabinet/shadow-cabinet display list for a chamber, in rank order. A
 *  devolved cabinet is the Cabinet Secretaries plus the business manager (the
 *  shared `chiefWhip` rung, titled Minister for Parliamentary Business or
 *  Trefnydd); junior Ministers sit outside it, as they do in reality. */
export function cabinetOfficesFor(arena: ArenaId | undefined): OfficeId[] {
  if (!arena || arena === 'uk') return CABINET_OFFICES;
  const first: DepartmentId[] = ['finance', 'health', 'education'];
  return [
    ...first.map((d) => cabsecOfficeId(arena, d)),
    ...DEVOLVED_CABINET[arena]
      .filter((d) => !first.includes(d))
      .map((d) => cabsecOfficeId(arena, d)),
    'chiefWhip',
  ];
}

/** the arena an office belongs to */
export function officeArena(officeId: OfficeId | null): ArenaId {
  return (officeId ? OFFICES[officeId]?.arena : undefined) ?? 'uk';
}

/** The shared, non-departmental rungs mean the same thing in every chamber and
 *  keep one id. `'leader'`, `'speaker'` and `'chiefWhip'` are written as literals
 *  at ~20 sites in career.ts (leadership contests, coups, the Speaker ballot, whip
 *  relationships); namespacing them would mean finding every one of those and
 *  getting all of them right. Only the TITLES differ by chamber. */
const SHARED_RUNGS: OfficeId[] = ['leader', 'speaker', 'pps', 'whip', 'chiefWhip'];

const SHARED_RUNG_TITLES: Record<DevolvedArenaId, Record<OfficeId, { gov: string; shadow: string }>> = {
  scotland: {
    leader: { gov: 'First Minister', shadow: 'Leader of the Opposition' },
    speaker: { gov: 'Presiding Officer', shadow: 'Presiding Officer' },
    // the Scottish Government's PPS: a backbencher attached to a Cabinet Secretary
    pps: { gov: 'Parliamentary Liaison Officer', shadow: 'Parliamentary Aide to the Leader' },
    whip: { gov: 'Government Whip', shadow: 'Opposition Whip' },
    chiefWhip: { gov: 'Minister for Parliamentary Business', shadow: 'Chief Whip' },
  },
  wales: {
    leader: { gov: 'First Minister', shadow: 'Leader of the Opposition' },
    speaker: { gov: 'Llywydd', shadow: 'Llywydd' },
    // Wales has no PLO equivalent; the rung is never offered there (see translateOffice)
    pps: { gov: 'Parliamentary Aide', shadow: 'Parliamentary Aide to the Leader' },
    whip: { gov: 'Government Whip', shadow: 'Opposition Whip' },
    chiefWhip: { gov: 'Trefnydd and Chief Whip', shadow: 'Chief Whip' },
  },
};

export function officeTitle(officeId: OfficeId | null, inGovernment: boolean): string {
  if (!officeId) return inGovernment ? 'Backbench MP' : 'Backbench MP';
  const office = OFFICES[officeId];
  return inGovernment ? office.title : office.shadowTitle;
}

/** An office's title in a given chamber on a given day. Falls back to the
 *  Westminster title for a Westminster office. Welsh ministerial titles moved
 *  with the calendar: Ministers became Cabinet Secretaries and Deputy Ministers
 *  Ministers in March 2024, and `day` decides which form is used. */
export function officeTitleIn(
  officeId: OfficeId | null,
  inGovernment: boolean,
  arena: ArenaId | undefined,
  day?: GameDay,
  /** the party's full name when it is neither the government nor the OFFICIAL
   *  opposition — a third-party leader leads their party, not the opposition */
  minorPartyName?: string
): string {
  if (!officeId) return `Backbench ${CHAMBERS[arena ?? 'uk'].member}`;
  if (!arena || arena === 'uk') {
    return officeTitleFor(officeId, { inGovernment, minorPartyName });
  }
  const office = OFFICES[officeId];
  if (!office) return 'Backbencher';

  if (officeId === 'leader') {
    if (inGovernment) return 'First Minister';
    if (minorPartyName) return `Leader of ${withArticle(minorPartyName)}`;
    return 'Leader of the Opposition';
  }
  const shared = SHARED_RUNG_TITLES[arena][officeId];
  if (shared) {
    if (minorPartyName && officeId === 'chiefWhip') return `${minorPartyName} Chief Whip`;
    if (minorPartyName && officeId === 'whip') return `${minorPartyName} Whip`;
    return inGovernment ? shared.gov : shared.shadow;
  }
  if (office.arena && office.arena !== 'uk' && office.department) {
    const brief = devolvedBriefName(office.arena as DevolvedArenaId, office.department);
    const nouns = ministerialTitlesAt(office.arena, day ?? Number.MAX_SAFE_INTEGER);
    const noun = office.tier === 4 ? nouns.senior : nouns.junior;
    if (inGovernment) return `${noun} ${brief}`;
    if (minorPartyName) return `${minorPartyName} Spokesperson for ${brief}`;
    return `Shadow ${noun} ${brief}`;
  }
  return officeTitleFor(officeId, { inGovernment, minorPartyName });
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
  if (office.id === 'leader') return `Leader of ${withArticle(minorPartyName)}`;
  if (office.id === 'chiefWhip') return `${minorPartyName} Chief Whip`;
  if (office.id === 'whip') return `${minorPartyName} Whip`;
  if (office.id === 'pps') return `Aide to the ${minorPartyName} Leader`;
  if (office.department) {
    // a minor party in government holds the real cabinet brief — give it the full
    // Secretary-of-State title, not a "spokesperson" label (e.g. a Green in a
    // coalition runs the department as "Health Secretary").
    if (inGovernment) {
      const senior = office.arena && office.arena !== 'uk'
        ? cabsecOfficeId(office.arena as DevolvedArenaId, office.department)
        : `sos_${office.department}`;
      return officeTitle(OFFICES[senior] ? senior : officeId, true);
    }
    const dept = departmentInfo(office.department).casual;
    // in opposition, a single spokesperson rung for minor parties (no "lead" distinction)
    return `${minorPartyName} Spokesperson for ${dept}`;
  }
  return officeTitle(officeId, inGovernment);
}

export function officeTier(officeId: OfficeId | null): number {
  return officeId ? OFFICES[officeId].tier : 0;
}

// ---------------------------------------------------------------------------
// translating between ladders
// ---------------------------------------------------------------------------

/** Nearest devolved brief for a Whitehall one, so a promotion computed in
 *  Westminster terms lands somewhere sensible in a devolved cabinet. Anything
 *  absent falls through to a random brief the chamber actually holds. */
const DEVOLVED_ANALOGUE: Partial<Record<DepartmentId, DepartmentId>> = {
  treasury: 'finance',
  home: 'justice',
  foreign: 'constitution',
  defence: 'justice',
  dwp: 'socialJustice',
  environment: 'rural',
  scienceTech: 'business',
};

/** …and the way back to Whitehall for a devolved-only brief */
const UK_ANALOGUE: Partial<Record<DepartmentId, UkDepartmentId>> = {
  finance: 'treasury',
  rural: 'environment',
  socialJustice: 'dwp',
  constitution: 'foreign',
};

/** Map an office computed for one chamber (career.ts reasons entirely in
 *  Westminster office ids) onto the equivalent rung in `arena`. This is what lets
 *  ~500 lines of ladder logic serve every chamber without a fork.
 *
 *  The devolved ladder is NOT shorter than Westminster's: both governments have a
 *  real two-tier ministry (Cabinet Secretaries over Ministers), so tier 3 lands
 *  on a junior Minister and tier 4 on a Cabinet Secretary. The one rung Wales
 *  lacks is the first: there is no Welsh PLO or PPS, so a tier-1 offer there
 *  returns null and the career begins at whip or Minister instead. */
export function translateOffice(
  officeId: OfficeId | null, arena: ArenaId | undefined, pick: <T>(xs: T[]) => T
): OfficeId | null {
  const target = arena ?? 'uk';
  if (!officeId) return officeId;
  if (officeArena(officeId) === target) {
    if (target === 'wales' && officeId === 'pps') return null;
    return officeId;
  }
  const office = OFFICES[officeId];
  if (!office) return null;
  if (SHARED_RUNGS.includes(officeId)) {
    if (target === 'wales' && officeId === 'pps') return null;
    return officeId;
  }

  if (target === 'uk') {
    // a career that comes BACK to Westminster must not arrive still holding a
    // Holyrood ministry
    const dept = office.department;
    const uk = dept ? (UK_ANALOGUE[dept] ?? (dept as UkDepartmentId)) : 'health';
    const prefix = office.tier >= 4 ? 'sos' : 'min';
    const id = `${prefix}_${uk}`;
    return OFFICES[id] ? id : (office.tier >= 4 ? 'sos_health' : 'min_health');
  }

  const held = DEVOLVED_CABINET[target];
  const wanted = office.department
    ? (DEVOLVED_ANALOGUE[office.department] ?? office.department)
    : undefined;
  // the money brief is never handed out by analogy to a portfolio-less office
  const pool = wanted && held.includes(wanted)
    ? [wanted]
    : held.filter((d) => !DEVOLVED_GREAT_DEPTS.includes(d));
  const dept = pool.length === 1 ? pool[0] : pick(pool);
  // Westminster's tier-4 non-departmental offices (Leader of the House, the
  // Chief Secretary, the territorial Secretaries) are all full cabinet rank
  return office.tier >= 4
    ? cabsecOfficeId(target, dept)
    : devolvedMinisterOfficeId(target, dept);
}
