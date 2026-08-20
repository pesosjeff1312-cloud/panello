import { useMemo, useState } from 'react'
import type { Collection } from '@/hooks/useCollection'
import type { Ev, EventCat } from '@/lib/types'
import { PANEL, PanelHead, Dot, Empty, Del, Chip, INPUT, BTN, BTN_ON, COLORS, EV_CATS, catOf } from '@/components/ui'
import { iso, fromIso, shortDate, MONTHS, WEEKDAYS, pad } from '@/lib/dates'
import { eventStatus, reminderStatus } from '@/lib/status'

const STATUS_COLOR = { past: COLORS.dim, imminent: COLORS.urg, future: COLORS.pos, overdue: COLORS.urg, soon: COLORS.urg, done: COLORS.pos, none: COLORS.dim }

function monthGrid(y: number, m: number): (Date | null)[] {
  const first = new Date(y, m, 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(y, m + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= days; d++) cells.push(new Date(y, m, d))
  while (cells.length % 7) cells.push(null)
  return cells
}

export function CalendarPanel({ events, reminders, now }: { events: Collection<'events'>; reminders: Collection<'reminders'>; now: Date }) {
  const today = iso(now)
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [sel, setSel] = useState(today)
  const [filter, setFilter] = useState<'tutti' | EventCat>('tutti')

  const shown = filter === 'tutti' ? events.rows : events.rows.filter(e => (e.cat ?? 'personale') === filter)
  const evByDay = useMemo(() => {
    const map: Record<string, Ev[]> = {}
    shown.forEach(e => { (map[e.date] = map[e.date] ?? []).push(e) })
    Object.values(map).forEach(l => l.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')))
    return map
  }, [shown])
  const remByDay = useMemo(() => {
    const map: Record<string, typeof reminders.rows> = {}
    reminders.rows.filter(r => r.due && !r.done).forEach(r => { (map[r.due as string] = map[r.due as string] ?? []).push(r) })
    return map
  }, [reminders.rows])

  const shift = (n: number) => setCursor(c => { const d = new Date(c.y, c.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const cells = monthGrid(cursor.y, cursor.m)
  const title = MONTHS[cursor.m].charAt(0).toUpperCase() + MONTHS[cursor.m].slice(1) + ' ' + cursor.y

  return (
    <section className={PANEL}>
      <PanelHead label={title}>
        <button className={BTN + ' w-8 px-0'} aria-label="Mese precedente" onClick={() => shift(-1)}>‹</button>
        <button className={BTN} onClick={() => { setCursor({ y: now.getFullYear(), m: now.getMonth() }); setSel(today) }}>Oggi</button>
        <button className={BTN + ' w-8 px-0'} aria-label="Mese successivo" onClick={() => shift(1)}>›</button>
      </PanelHead>

      <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-2.5">
        {[{ k: 'tutti' as const, l: 'Tutti', c: 'var(--color-accent-600)' }, ...EV_CATS].map(c => (
          <Chip key={c.k} on={filter === c.k} color={c.c} onClick={() => setFilter(c.k as 'tutti' | EventCat)}>
            <span className="size-[6px] rounded-full" style={{ background: c.c }} />{c.l}
            <span className="tabular-nums opacity-70">{c.k === 'tutti' ? events.rows.length : events.rows.filter(e => (e.cat ?? 'personale') === c.k).length}</span>
          </Chip>
        ))}
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_232px]">
        <div className="p-5">
          <div className="grid grid-cols-7 gap-1 text-center text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const day = iso(d)
              const evs = evByDay[day] ?? []
              const rems = remByDay[day] ?? []
              const hot = evs.some(e => eventStatus(e, now) === 'imminent') || rems.some(r => ['overdue', 'soon'].includes(reminderStatus(r, now)))
              return (
                <button key={i} onClick={() => setSel(day)}
                  className={'flex min-h-[44px] flex-col items-start gap-1 rounded-md border p-1.5 text-left ' +
                    (day === sel ? 'border-[var(--color-accent-600)] bg-[color-mix(in_oklab,var(--color-accent-600)_14%,transparent)]' : 'border-transparent hover:bg-accent') +
                    (day === today ? ' ring-1 ring-inset ring-[var(--ring)]' : '')}>
                  <span className="tabular-nums text-[11px] text-muted-foreground">{pad(d.getDate())}</span>
                  <span className="flex flex-wrap gap-0.5">
                    {[...new Set(evs.map(e => catOf(e.cat).k))].map(k => (
                      <span key={k} className="size-[5px] rounded-full" style={{ background: hot ? COLORS.urg : catOf(k).c }} />
                    ))}
                    {rems.length > 0 && <span className="size-[5px] rounded-full border" style={{ borderColor: hot ? COLORS.urg : COLORS.dim }} />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <DayDetail iso={sel} events={evByDay[sel] ?? []} reminders={remByDay[sel] ?? []} collection={events} now={now} />
      </div>
    </section>
  )
}

function DayDetail({ iso: day, events, reminders, collection, now }: {
  iso: string
  events: Ev[]
  reminders: { id: string; text: string; due: string | null; done: boolean }[]
  collection: Collection<'events'>
  now: Date
}) {
  const [mode, setMode] = useState<string | null>(null)
  const empty = { title: '', date: day, time: '09:00', note: '', cat: 'personale' as EventCat }
  const [draft, setDraft] = useState(empty)
  const d = fromIso(day)
  const commit = () => {
    if (!draft.title.trim()) return
    const body = { ...draft, title: draft.title.trim() }
    if (mode === 'new') void collection.insert(body)
    else if (mode) void collection.update({ id: mode }, body)
    setMode(null)
  }

  return (
    <aside className="flex flex-col border-t border-border md:border-l md:border-t-0">
      <div className="flex items-baseline gap-2 border-b border-border px-4 py-3">
        <span className="tabular-nums text-[13px]">{shortDate(day)}</span>
        <span className="text-[11px] text-muted-foreground">{['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'][d.getDay()]}{day === iso(now) ? ' · oggi' : ''}</span>
      </div>
      <div className="max-h-[300px] flex-1 overflow-y-auto">
        {events.length === 0 && reminders.length === 0 && <Empty>Nessun evento in programma</Empty>}
        {events.map(e => {
          const st = eventStatus(e, now)
          if (mode === e.id) return <div key={e.id} className="border-b border-border p-4"><EventForm draft={draft} setDraft={setDraft} onCommit={commit} onCancel={() => setMode(null)} /></div>
          return (
            <div key={e.id} className="border-b border-border px-4 py-3 last:border-0">
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-[13px]" style={{ color: STATUS_COLOR[st] }}>{e.time?.slice(0, 5)}</span>
                <Dot color={STATUS_COLOR[st]} hot={st === 'imminent'} />
                <span className="flex-1 text-[13px]">{e.title}</span>
              </div>
              <span className="mt-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                <span className="size-[6px] rounded-full" style={{ background: catOf(e.cat).c }} />{catOf(e.cat).l}
              </span>
              {e.note && <p className="mt-1 text-xs text-muted-foreground" style={{ textWrap: 'pretty' }}>{e.note}</p>}
              <div className="mt-2 flex gap-3 text-[10.5px]">
                <button className="text-muted-foreground hover:text-foreground" onClick={() => { setDraft({ title: e.title, date: e.date, time: (e.time ?? '09:00').slice(0, 5), note: e.note ?? '', cat: (e.cat ?? 'personale') as EventCat }); setMode(e.id) }}>Modifica</button>
                <Del onConfirm={() => void collection.remove({ id: e.id })} />
              </div>
            </div>
          )
        })}
        {reminders.map(r => (
          <div key={r.id} className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-[13px] last:border-0">
            <span className="text-[10.5px] tracking-[0.08em] text-muted-foreground">PRM</span>
            <Dot color={STATUS_COLOR[reminderStatus({ ...r, user_id: '', done_at: null, created_at: '' }, now)]} />
            <span className="flex-1">{r.text}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border bg-[color-mix(in_oklab,var(--muted)_28%,var(--card))] p-4">
        {mode === 'new'
          ? <EventForm draft={draft} setDraft={setDraft} onCommit={commit} onCancel={() => setMode(null)} />
          : <button className={BTN_ON + ' w-full'} onClick={() => { setDraft({ ...empty, date: day }); setMode('new') }}>+ Nuovo evento</button>}
      </div>
    </aside>
  )
}

function EventForm({ draft, setDraft, onCommit, onCancel }: {
  draft: { title: string; date: string; time: string; note: string; cat: EventCat }
  setDraft: React.Dispatch<React.SetStateAction<{ title: string; date: string; time: string; note: string; cat: EventCat }>>
  onCommit: () => void
  onCancel: () => void
}) {
  const set = (k: string, v: string) => setDraft(d => ({ ...d, [k]: v }))
  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel() }
  return (
    <div className="grid gap-2">
      <input autoFocus className={INPUT} placeholder="Titolo evento" value={draft.title} onChange={e => set('title', e.target.value)} onKeyDown={onKey} />
      <div className="flex overflow-hidden rounded-md border border-border">
        {EV_CATS.map(c => (
          <button key={c.k} onClick={() => set('cat', c.k)} className={'flex-1 py-1.5 text-[11px] ' + (draft.cat === c.k ? '' : 'text-muted-foreground hover:bg-accent')}
            style={draft.cat === c.k ? { color: c.c, boxShadow: 'inset 0 0 0 1px ' + c.c } : undefined}>{c.l}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="date" className={INPUT + ' flex-1'} value={draft.date} onChange={e => set('date', e.target.value)} onKeyDown={onKey} />
        <input type="time" className={INPUT + ' w-24'} value={draft.time} onChange={e => set('time', e.target.value)} onKeyDown={onKey} />
      </div>
      <input className={INPUT} placeholder="Nota (opzionale)" value={draft.note} onChange={e => set('note', e.target.value)} onKeyDown={onKey} />
      <div className="flex gap-2">
        <button className={BTN_ON + ' flex-1'} onClick={onCommit}>Salva</button>
        <button className={BTN} onClick={onCancel}>Annulla</button>
      </div>
    </div>
  )
}
