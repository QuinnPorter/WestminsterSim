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
  economy: { id: 'economy', name: 'Department for the Economy', casual: 'the Economy' },
  infrastructure: { id: 'infrastructure', name: 'Department for Infrastructure', casual: 'Infrastructure' },
  communities: { id: 'communities', name: 'Department for Communities', casual: 'Communities' },
  agriculture: { id: 'agriculture', name: 'Department of Agriculture, Environment and Rural Affairs', casual: 'Agriculture and the Environment' },
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
  // the eight departments of the Executive since the Departments Act (Northern
  // Ireland) 2016, the Executive Office aside. Justice is elected by
  // cross-community vote rather than allocated by d'Hondt.
  ni: [
    'finance', 'health', 'education', 'economy', 'justice', 'infrastructure',
    'communities', 'agriculture',
  ],
};

/** the departments a chamber's Executive allocates by d'Hondt, in pick order */
export function executiveDepartments(arena: DevolvedArenaId): DepartmentId[] {
  return DEVOLVED_CABINET[arena];
}

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
  ni: {
    finance: 'Finance',
    health: 'Health',
    education: 'Education',
    economy: 'the Economy',
    justice: 'Justice',
    infrastructure: 'Infrastructure',
    communities: 'Communities',
    agriculture: 'Agriculture, Environment and Rural Affairs',
  },
};

/** The preposition between a bare rank noun and its brief, where the rank noun
 *  does not carry one: Northern Ireland styles its ministers "Minister of
 *  Finance" but "Minister for the Economy". */
const BRIEF_PREPOSITION: Partial<Record<DevolvedArenaId, Partial<Record<DepartmentId, 'of' | 'for'>>>> = {
  ni: {
    finance: 'of', health: 'of', education: 'of', justice: 'of', agriculture: 'of',
    economy: 'for', infrastructure: 'for', communities: 'for',
  },
};

/** join a rank noun to a brief: "Cabinet Secretary for" + "Health" needs
 *  nothing; a bare "Minister" takes the brief's own preposition */
export function rankWithBrief(noun: string, arena: DevolvedArenaId, dept: DepartmentId): string {
  const brief = devolvedBriefName(arena, dept);
  if (/\b(for|of)$/.test(noun)) return `${noun} ${brief}`;
  return `${noun} ${BRIEF_PREPOSITION[arena]?.[dept] ?? 'for'} ${brief}`;
}

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

/** the senior, tier-4 departmental rung: a Cabinet Secretary at Holyrood and in
 *  the Senedd, the Minister in a single-tier Executive */
export function cabsecOfficeId(arena: DevolvedArenaId, dept: DepartmentId): OfficeId {
  return CHAMBERS[arena].ladder === 'singleTier' ? `${arena}_minister_${dept}` : `${arena}_cabsec_${dept}`;
}
/** the tier-3 departmental rung under a Cabinet Secretary. A single-tier
 *  Executive has none: the Minister is the only departmental rank, so this
 *  resolves to the same office. */
export function devolvedMinisterOfficeId(arena: DevolvedArenaId, dept: DepartmentId): OfficeId {
  return CHAMBERS[arena].ladder === 'singleTier' ? cabsecOfficeId(arena, dept) : `${arena}_min_${dept}`;
}
/** a party's spokesperson on a brief in a single-tier chamber: the tier-3 rung
 *  every party keeps, outside the Executive's benches */
export function spokespersonOfficeId(arena: DevolvedArenaId, dept: DepartmentId): OfficeId {
  return `${arena}_spokes_${dept}`;
}
/** the two junior ministers in the Executive Office, one from the First
 *  Minister's party and one from the deputy First Minister's */
export const TEO_JUNIOR_FM: OfficeId = 'ni_junior_teo_fm';
export const TEO_JUNIOR_DFM: OfficeId = 'ni_junior_teo_dfm';

function buildDevolvedOffices(): Record<OfficeId, Office> {
  const out: Record<OfficeId, Office> = {};
  for (const arena of DEVOLVED_ARENAS) {
    const single = CHAMBERS[arena].ladder === 'singleTier';
    for (const dept of DEVOLVED_CABINET[arena]) {
      const brief = devolvedBriefName(arena, dept);
      if (single) {
        // one rank of Minister, and a spokesperson rung for the parties outside
        // the Executive (or outside this brief)
        out[cabsecOfficeId(arena, dept)] = {
          id: cabsecOfficeId(arena, dept), tier: 4, department: dept, arena,
          rank: devolvedRank(dept),
          title: rankWithBrief(CHAMBERS[arena].ranks.senior, arena, dept),
          shadowTitle: `Shadow ${rankWithBrief(CHAMBERS[arena].ranks.senior, arena, dept)}`,
        };
        out[spokespersonOfficeId(arena, dept)] = {
          id: spokespersonOfficeId(arena, dept), tier: 3, department: dept, arena,
          rank: devolvedRank(dept),
          title: `Spokesperson for ${brief}`,
          shadowTitle: `Spokesperson for ${brief}`,
        };
        continue;
      }
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
    if (CHAMBERS[arena].jointExecutive) {
      out[TEO_JUNIOR_FM] = {
        id: TEO_JUNIOR_FM, tier: 3, arena, rank: 1,
        title: 'Junior Minister, the Executive Office',
        shadowTitle: 'Junior Minister, the Executive Office',
      };
      out[TEO_JUNIOR_DFM] = {
        id: TEO_JUNIOR_DFM, tier: 3, arena, rank: 1,
        title: 'Junior Minister, the Executive Office',
        shadowTitle: 'Junior Minister, the Executive Office',
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
    // the party's business manager sits with the ministers in every chamber:
    // at Stormont the Executive has no whip of its own, but the party does
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
  ni: {
    leader: { gov: 'First Minister', shadow: 'Leader of the Opposition' },
    speaker: { gov: 'Speaker of the Assembly', shadow: 'Speaker of the Assembly' },
    // no PPS rung at Stormont; never offered there (see translateOffice)
    pps: { gov: 'Parliamentary Aide', shadow: 'Parliamentary Aide to the Leader' },
    // every party's whip is the party's own: the Executive has no "government whip"
    whip: { gov: 'Party Whip', shadow: 'Party Whip' },
    chiefWhip: { gov: 'Chief Whip', shadow: 'Chief Whip' },
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
    const devolved = office.arena as DevolvedArenaId;
    const brief = devolvedBriefName(devolved, office.department);
    // a spokesperson rung is a party post whoever holds it
    if (officeId === spokespersonOfficeId(devolved, office.department)) {
      return minorPartyName ? `${minorPartyName} Spokesperson for ${brief}` : `Spokesperson for ${brief}`;
    }
    const nouns = ministerialTitlesAt(office.arena, day ?? Number.MAX_SAFE_INTEGER);
    const noun = office.tier === 4 ? nouns.senior : nouns.junior;
    const styled = rankWithBrief(noun, devolved, office.department);
    if (inGovernment) return styled;
    if (minorPartyName) return `${minorPartyName} Spokesperson for ${brief}`;
    return `Shadow ${styled}`;
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

/** the Executive's briefs for the Whitehall ones it names differently */
const NI_ANALOGUE: Partial<Record<DepartmentId, DepartmentId>> = {
  treasury: 'finance',
  home: 'justice',
  defence: 'justice',
  foreign: 'economy',
  business: 'economy',
  scienceTech: 'economy',
  energy: 'economy',
  transport: 'infrastructure',
  housing: 'communities',
  dwp: 'communities',
  culture: 'communities',
  environment: 'agriculture',
  rural: 'agriculture',
  socialJustice: 'communities',
  constitution: 'finance',
};

/** …and the way back to Whitehall for a devolved-only brief */
const UK_ANALOGUE: Partial<Record<DepartmentId, UkDepartmentId>> = {
  finance: 'treasury',
  rural: 'environment',
  socialJustice: 'dwp',
  constitution: 'foreign',
  economy: 'business',
  infrastructure: 'transport',
  communities: 'housing',
  agriculture: 'environment',
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
  // a chamber without a PPS rung never offers one
  const noPps = !CHAMBERS[target].hasPps;
  if (officeArena(officeId) === target) {
    if (noPps && officeId === 'pps') return null;
    return officeId;
  }
  const office = OFFICES[officeId];
  if (!office) return null;
  if (SHARED_RUNGS.includes(officeId)) {
    if (noPps && officeId === 'pps') return null;
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
  const analogue = target === 'ni' ? NI_ANALOGUE : DEVOLVED_ANALOGUE;
  const wanted = office.department
    ? (analogue[office.department] ?? office.department)
    : undefined;
  // the money brief is never handed out by analogy to a portfolio-less office
  const pool = wanted && held.includes(wanted)
    ? [wanted]
    : held.filter((d) => !DEVOLVED_GREAT_DEPTS.includes(d));
  const dept = pool.length === 1 ? pool[0] : pick(pool);
  // Westminster's tier-4 non-departmental offices (Leader of the House, the
  // Chief Secretary, the territorial Secretaries) are all full cabinet rank
  if (office.tier >= 4) return cabsecOfficeId(target, dept);
  // a single-tier Executive has no junior departmental rung: a tier-3 rung there
  // is the party's spokesperson on the brief. Whether the player's party holds
  // the Executive post itself is decided by `constrainToPartyPosts`.
  return CHAMBERS[target].ladder === 'singleTier'
    ? spokespersonOfficeId(target, dept)
    : devolvedMinisterOfficeId(target, dept);
}
