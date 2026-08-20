import { useEffect, useMemo, useState } from 'react'
import { useCollection } from './useCollection'
import { supabase } from '@/lib/supabase'
import { iso } from '@/lib/dates'
import { eventStatus, reminderStatus, streakOf } from '@/lib/status'
import type { Settings } from '@/lib/types'

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function useSession() {
  const [userId, setUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUserId(data.session?.user.id ?? null); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])
  return { userId, ready }
}

/** Tutto lo stato dell'app: una collezione per tabella + i valori derivati delle KPI. */
export function useDashboard(userId: string | null) {
  const now = useNow()
  const today = iso(now)

  const events = useCollection('events', userId, { order: { column: 'date' } })
  const reminders = useCollection('reminders', userId, { order: { column: 'created_at' } })
  const notes = useCollection('notes', userId, { order: { column: 'created_at', ascending: false } })
  const transactions = useCollection('transactions', userId, { order: { column: 'date', ascending: false } })
  const habits = useCollection('habits', userId, { order: { column: 'position' } })
  const habitLog = useCollection('habit_log', userId, { key: ['habit_id', 'day'] })
  const exercises = useCollection('exercises', userId, { order: { column: 'position' } })
  const exerciseLog = useCollection('exercise_log', userId, { key: ['exercise_id', 'day'] })
  const gymDays = useCollection('gym_days', userId, { key: ['day'] })
  const settingsRow = useCollection('settings', userId, { key: ['user_id'] })

  const settings: Settings | null = settingsRow.rows[0] ?? null
  const goal = Number(settings?.goal ?? 10000)

  const derived = useMemo(() => {
    const balance = transactions.rows.reduce((s, t) => s + Number(t.amount), 0)
    const month = today.slice(0, 7)
    const inMonth = transactions.rows.filter(t => t.date.startsWith(month))
    const openReminders = reminders.rows.filter(r => !r.done)
    const urgent = openReminders.filter(r => ['overdue', 'soon'].includes(reminderStatus(r, now)))
    const todayEvents = events.rows.filter(e => e.date === today)
    const imminent = todayEvents.filter(e => eventStatus(e, now) === 'imminent')
    const doneToday = habitLog.rows.filter(l => l.day === today).length
    return {
      balance,
      income: inMonth.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0),
      expenses: inMonth.filter(t => Number(t.amount) < 0).reduce((s, t) => s - Number(t.amount), 0),
      goalPct: goal > 0 ? Math.round((balance / goal) * 100) : 0,
      openReminders: openReminders.length,
      urgent: urgent.length,
      todayEvents: todayEvents.length,
      imminent: imminent.length,
      notes: notes.rows.length,
      habitsDoneToday: doneToday,
      habitsTotal: habits.rows.filter(h => !h.archived).length,
      streak: (habitId: string) => streakOf(habitLog.rows.filter(l => l.habit_id === habitId).map(l => l.day), now)
    }
  }, [transactions.rows, reminders.rows, events.rows, notes.rows, habitLog.rows, habits.rows, goal, today, now])

  const error = [events, reminders, notes, transactions, habits, habitLog, exercises, exerciseLog, gymDays, settingsRow]
    .map(c => c.error).find(Boolean) ?? null

  return { now, today, events, reminders, notes, transactions, habits, habitLog, exercises, exerciseLog, gymDays, settings: settingsRow, derived, error }
}
