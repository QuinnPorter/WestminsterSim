import { CauseId, DepartmentId } from '../types/game';

export interface Cause {
  id: CauseId;
  label: string;
  /** one-line description shown in the picker and on the profile */
  blurb: string;
  /** departments this cause naturally aligns with — drives a small promotion nudge */
  departmentAffinity: DepartmentId[];
}

export const CAUSES: Cause[] = [
  {
    id: 'economy',
    label: 'The economy',
    blurb: 'Growth, jobs and sound money above all.',
    departmentAffinity: ['treasury', 'business'],
  },
  {
    id: 'inequality',
    label: 'Tackling inequality',
    blurb: 'Close the gap between the richest and the rest.',
    departmentAffinity: ['dwp', 'treasury'],
  },
  {
    id: 'publicServices',
    label: 'NHS & public services',
    blurb: 'Defend and rebuild the services people rely on.',
    departmentAffinity: ['health', 'education'],
  },
  {
    id: 'environment',
    label: 'Climate & environment',
    blurb: 'Net zero and a liveable planet for the next generation.',
    departmentAffinity: ['environment', 'transport'],
  },
  {
    id: 'immigration',
    label: 'Immigration & borders',
    blurb: 'Control the borders and the asylum system.',
    departmentAffinity: ['home'],
  },
  {
    id: 'defence',
    label: 'Defence & security',
    blurb: 'A strong military and a safe country.',
    departmentAffinity: ['defence'],
  },
  {
    id: 'foreignAffairs',
    label: 'Britain in the world',
    blurb: 'Alliances, trade and global standing.',
    departmentAffinity: ['foreign'],
  },
  {
    id: 'housing',
    label: 'Housing',
    blurb: 'Get Britain building and homes within reach.',
    departmentAffinity: ['environment', 'treasury'],
  },
  {
    id: 'lawAndOrder',
    label: 'Law & order',
    blurb: 'Back the police and tougher sentencing.',
    departmentAffinity: ['justice', 'home'],
  },
  {
    id: 'education',
    label: 'Education & skills',
    blurb: 'Schools, colleges and opportunity for all.',
    departmentAffinity: ['education'],
  },
];

export const CAUSES_BY_ID: Record<CauseId, Cause> = Object.fromEntries(
  CAUSES.map((c) => [c.id, c])
) as Record<CauseId, Cause>;

/** departments aligned with any of the player's chosen causes */
export function causeDepartments(causes: CauseId[]): Set<DepartmentId> {
  const out = new Set<DepartmentId>();
  for (const id of causes) {
    for (const d of CAUSES_BY_ID[id]?.departmentAffinity ?? []) out.add(d);
  }
  return out;
}
