import { ArenaId, GameState } from '../types/game';
import { chamberOf } from '../data/chambers';
import { isoToDay, yearOf } from './clock';

/**
 * The parliamentary year's set-pieces. One table for every chamber; which keys
 * a chamber actually holds is `ChamberProfile.calendarKeys` (the Assembly has
 * no First Minister's Questions duel, for instance). `calendarDone` holds the
 * NEXT due day of each key the live chamber has, and a key that is absent never
 * fires, so re-initialising on arrival in a chamber is what makes its calendar
 * run at all.
 */
export interface CalendarEvent {
  key: string;
  month: number; // 1-12
  day: number;
}

export const CALENDAR: CalendarEvent[] = [
  { key: 'pmqsWinter', month: 1, day: 22 },
  { key: 'budget', month: 3, day: 10 },
  { key: 'locals', month: 5, day: 4 },
  { key: 'pmqsSummer', month: 6, day: 18 },
  { key: 'recess', month: 8, day: 5 },
  { key: 'conference', month: 9, day: 28 },
];

/** the set-pieces a chamber holds, in calendar order */
export function calendarFor(arena: ArenaId | undefined): CalendarEvent[] {
  const keys = chamberOf(arena).calendarKeys;
  return CALENDAR.filter((ev) => keys.includes(ev.key));
}

export function nextOccurrence(after: number, month: number, day: number): number {
  let year = yearOf(after);
  let due = isoToDay(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  if (due <= after) {
    year += 1;
    due = isoToDay(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return due;
}

/** (re)start the live chamber's calendar from today: every key the chamber
 *  holds is due at its next occurrence, and keys it does not hold are dropped.
 *  Called at the start of a career and on every arrival in a chamber, so a
 *  chamber entered by a draft fires its Budget and conference like any other,
 *  and a chamber thawed after years away does not fire every stale key at once. */
export function initCalendar(state: GameState): void {
  const events = calendarFor(state.arena);
  state.calendarDone = {};
  for (const ev of events) {
    state.calendarDone[ev.key] = nextOccurrence(state.day, ev.month, ev.day);
  }
}
