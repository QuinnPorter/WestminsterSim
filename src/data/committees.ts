import { ArenaId, DepartmentId, UkDepartmentId } from '../types/game';
import { chamberOf } from './chambers';
import { departmentInfo, executiveDepartments } from './offices';

/** the Commons departmental select committee that scrutinises each department */
export const COMMITTEE_NAMES: Record<UkDepartmentId, string> = {
  treasury: 'Treasury',
  home: 'Home Affairs',
  foreign: 'Foreign Affairs',
  health: 'Health and Social Care',
  education: 'Education',
  defence: 'Defence',
  justice: 'Justice',
  transport: 'Transport',
  environment: 'Environmental Audit',
  business: 'Business and Trade',
  dwp: 'Work and Pensions',
  culture: 'Culture, Media and Sport',
  housing: 'Housing, Communities and Local Government',
  energy: 'Energy Security and Net Zero',
  scienceTech: 'Science, Innovation and Technology',
};

/** the departments a chamber has a scrutiny committee for: the Commons'
 *  departmental select committees, or one per department of the devolved
 *  government */
export function committeeDepartments(arena: ArenaId | undefined): DepartmentId[] {
  const a = arena ?? 'uk';
  return a === 'uk' ? (Object.keys(COMMITTEE_NAMES) as UkDepartmentId[]) : executiveDepartments(a);
}

/** the committee that scrutinises a department, named as its chamber names it:
 *  the Commons' "Treasury Select Committee", Holyrood's and the Senedd's
 *  "Finance Committee", the Assembly's statutory "Committee for Finance" */
export function committeeNameFor(dept: DepartmentId, arena?: ArenaId): string {
  const style = chamberOf(arena).committee.name;
  if (style === 'Select Committee') {
    return `${COMMITTEE_NAMES[dept as UkDepartmentId] ?? departmentInfo(dept).casual} Select Committee`;
  }
  const brief = departmentInfo(dept).casual;
  return style === 'Committee for' ? `Committee for ${brief}` : `${brief.replace(/^the /, '')} Committee`;
}

/** who presides: a Convener at Holyrood, a Chair elsewhere */
export function committeeChairNoun(arena: ArenaId | undefined): string {
  return chamberOf(arena).committee.chair;
}

/** the player's title while chairing a committee, e.g. "Chair, Treasury Select
 *  Committee" or "Convener, Finance Committee" */
export function committeeChairTitle(dept: DepartmentId, arena?: ArenaId): string {
  return `${committeeChairNoun(arena)}, ${committeeNameFor(dept, arena)}`;
}
