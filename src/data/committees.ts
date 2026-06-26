import { DepartmentId } from '../types/game';

/** the Commons departmental select committee that scrutinises each department */
export const COMMITTEE_NAMES: Record<DepartmentId, string> = {
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

/** the player's title while chairing a committee, e.g. "Chair, Treasury Select Committee" */
export function committeeChairTitle(dept: DepartmentId): string {
  return `Chair, ${COMMITTEE_NAMES[dept]} Select Committee`;
}
