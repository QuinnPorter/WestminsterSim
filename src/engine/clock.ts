import { GameDay } from '../types/game';

const EPOCH_MS = Date.UTC(2019, 0, 1);
const DAY_MS = 86_400_000;

export function dayToDate(day: GameDay): Date {
  return new Date(EPOCH_MS + day * DAY_MS);
}

export function isoToDay(iso: string): GameDay {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH_MS) / DAY_MS);
}

export function yearOf(day: GameDay): number {
  return dayToDate(day).getUTCFullYear();
}

export function monthOf(day: GameDay): number {
  return dayToDate(day).getUTCMonth() + 1; // 1-12
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "March 2021" */
export function formatMonthYear(day: GameDay): string {
  const d = dayToDate(day);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "17 December 2019" */
export function formatFull(day: GameDay): string {
  const d = dayToDate(day);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const DAYS_PER_YEAR = 365.25;

export function yearsBetween(a: GameDay, b: GameDay): number {
  return Math.abs(b - a) / DAYS_PER_YEAR;
}
