import type { Ev, Reminder } from './types'
import { addDays, eventAt, fromIso, iso } from './dates'

export type ReminderStatus = 'done' | 'overdue' | 'soon' | 'future' | 'none'
export type EventStatus = 'past' | 'imminent' | 'future'

// Regole identiche al prototipo: vedi design/store.jsx
export function reminderStatus(r: Reminder, now: Date): ReminderStatus {
  if (r.done) return 'done'
  if (!r.due) return 'none'
  const endOfDue = addDays(fromIso(r.due), 1)
  if (now >= endOfDue) return 'overdue'
  if (endOfDue.getTime() - now.getTime() <= 24 * 3600e3) return 'soon'
  return 'future'
}

export function eventStatus(e: Ev, now: Date): EventStatus {
  const at = eventAt(e.date, e.time)
  if (at < now) return 'past'
  if (at.getTime() - now.getTime() <= 2 * 3600e3) return 'imminent'
  return 'future'
}

export const REMINDER_ORDER: Record<ReminderStatus, number> = { overdue: 0, soon: 1, future: 2, none: 3, done: 4 }

export function sortReminders(list: Reminder[], now: Date): Reminder[] {
  return [...list].sort((a, b) => {
    const d = REMINDER_ORDER[reminderStatus(a, now)] - REMINDER_ORDER[reminderStatus(b, now)]
    if (d !== 0) return d
    if (a.due && b.due) return a.due < b.due ? -1 : 1
    return a.created_at < b.created_at ? -1 : 1
  })
}

export function streakOf(days: string[], today: Date): number {
  const set = new Set(days)
  let cursor = set.has(iso(today)) ? today : addDays(today, -1)
  let n = 0
  while (set.has(iso(cursor))) { n++; cursor = addDays(cursor, -1) }
  return n
}
