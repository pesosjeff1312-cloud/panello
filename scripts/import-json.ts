/**
 * Import una-tantum dell'export JSON del prototipo (footer → "Esporta JSON").
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... IMPORT_USER_ID=... npx tsx scripts/import-json.ts dashboard.json
 * La service_role key sta SOLO qui, in locale: mai nel client, mai su Vercel.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const user_id = process.env.IMPORT_USER_ID!
const file = process.argv[2]
if (!url || !key || !user_id || !file) throw new Error('Serve SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IMPORT_USER_ID e il file JSON')

const db = createClient(url, key, { auth: { persistSession: false } })
const s = JSON.parse(readFileSync(file, 'utf8'))
const put = async (table: string, rows: unknown[]) => {
  if (!rows.length) return
  const { error } = await db.from(table).insert(rows as never)
  console.log(table, rows.length, error?.message ?? 'ok')
}

await put('events', (s.events ?? []).map((e: any) => ({ user_id, date: e.date, time: e.time, title: e.title, note: e.note ?? null, cat: e.cat })))
await put('reminders', (s.reminders ?? []).map((r: any) => ({ user_id, text: r.text, due: r.due, done: !!r.done, done_at: r.doneAt ?? null })))
await put('notes', (s.notes ?? []).map((n: any) => ({ user_id, text: n.text, created_at: n.createdAt })))
await put('transactions', (s.transactions ?? []).map((t: any) => ({ user_id, date: t.date, descr: t.desc, amount: t.amount, cat: t.cat ?? '' })))

const habits = (s.routine ?? []).map((h: any, i: number) => ({ text: h.text, position: i, log: Object.keys(h.log ?? {}) }))
for (const h of habits) {
  const { data, error } = await db.from('habits').insert({ user_id, text: h.text, position: h.position } as never).select('id').single()
  if (error) { console.log('habits', error.message); continue }
  await put('habit_log', h.log.map((day: string) => ({ habit_id: (data as any).id, user_id, day })))
}

for (const [i, ex] of ((s.gym?.exercises ?? []) as any[]).entries()) {
  const { data, error } = await db.from('exercises').insert({ user_id, text: ex.text, detail: ex.detail, position: i } as never).select('id').single()
  if (error) { console.log('exercises', error.message); continue }
  if (ex.doneOn) await put('exercise_log', [{ exercise_id: (data as any).id, user_id, day: ex.doneOn }])
}
await put('gym_days', Object.entries(s.gym?.log ?? {}).map(([day, state]) => ({ user_id, day, state })))

const st = s.settings ?? {}
await db.from('settings').upsert({ user_id, goal: st.goal ?? 10000, goal_date: st.goalDate ?? '2027-01-30' } as never)
console.log('fatto')
