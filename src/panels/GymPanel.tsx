import { useState } from 'react'
import type { Collection } from '@/hooks/useCollection'
import { PANEL, PanelHead, Dot, Count, Empty, Del, Check, INPUT, BTN, COLORS } from '@/components/ui'
import { iso, weekDays, WEEKDAYS } from '@/lib/dates'

export function GymPanel({ exercises, log, days, now, today }: {
  exercises: Collection<'exercises'>
  log: Collection<'exercise_log'>
  days: Collection<'gym_days'>
  now: Date
  today: string
}) {
  const [text, setText] = useState('')
  const [serie, setSerie] = useState('3')
  const [reps, setReps] = useState('12')
  const list = exercises.rows.filter(e => !e.archived)
  const isDone = (id: string) => log.rows.some(l => l.exercise_id === id && l.day === today)
  const done = list.filter(e => isDone(e.id)).length

  const st = list.length === 0 ? 'none' : done === list.length ? 'all' : done > 0 ? 'part' : 'zero'
  const dot = { all: COLORS.pos, part: COLORS.dim, zero: COLORS.urg, none: COLORS.dim }[st]

  const add = () => {
    const t = text.trim()
    if (!t) return
    void exercises.insert({ text: t, detail: serie + '×' + reps, position: list.length, archived: false })
    setText('')
  }
  const week = weekDays(now).map(iso)
  const stateOf = (day: string) => {
    const rec = days.rows.find(d => d.day === day)
    if (day === today) return st === 'all' ? 'done' : rec?.state === 'rest' ? 'rest' : 'today'
    if (rec?.state) return rec.state
    const loggedThatDay = list.some(e => log.rows.some(l => l.exercise_id === e.id && l.day === day))
    if (loggedThatDay) return 'done'
    return day > today ? 'future' : 'skip'
  }
  const toggleRest = (day: string) => {
    const rec = days.rows.find(d => d.day === day)
    if (rec?.state === 'rest') void days.remove({ day })
    else void days.upsert({ day, state: 'rest' })
  }
  const cell: Record<string, string> = {
    done: 'border-[var(--chart-2)] text-[var(--chart-2)]',
    rest: 'border-border text-muted-foreground',
    today: 'border-[var(--color-accent-600)] text-[var(--color-accent-200)]',
    future: 'border-border/60 text-muted-foreground/60',
    skip: 'border-border/60 text-muted-foreground/70'
  }

  return (
    <section className={PANEL}>
      <PanelHead label="Palestra">
        <Dot color={dot} hot={st === 'zero'} title="Stato allenamento di oggi" />
        <Count>{String(done).padStart(2, '0')}/{String(list.length).padStart(2, '0')} oggi</Count>
      </PanelHead>
      <div className="grid grid-cols-7 gap-1.5 border-b border-border px-5 py-3">
        {week.map((day, i) => {
          const s = stateOf(day)
          return (
            <button key={day} onClick={() => s !== 'future' && toggleRest(day)} title={s === 'rest' ? 'Riposo' : s === 'done' ? 'Completato' : s === 'today' ? 'Oggi' : s === 'future' ? 'In programma' : 'Non svolto'}
              className={'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-md border py-1 text-[10px] ' + cell[s] + (day === today ? ' bg-[color-mix(in_oklab,var(--accent)_40%,transparent)]' : '')}>
              <span className="tracking-[0.08em]">{WEEKDAYS[i]}</span>
              <span className="tabular-nums text-[13px]">{day.slice(8)}</span>
            </button>
          )
        })}
      </div>
      <div className="max-h-[220px] overflow-y-auto">
        {list.length === 0 ? <Empty>Nessun esercizio in scheda</Empty> : list.map(e => {
          const d = isDone(e.id)
          return (
            <div key={e.id} className="flex items-center gap-2.5 border-b border-border px-5 py-2.5 text-[13px] last:border-0 hover:bg-[color-mix(in_oklab,var(--accent)_45%,transparent)]">
              <Check on={d} onClick={() => d ? void log.remove({ exercise_id: e.id, day: today }) : void log.insert({ exercise_id: e.id, day: today })} />
              <span className={'flex-1 ' + (d ? 'line-through opacity-65' : '')}>{e.text}</span>
              <span className="tabular-nums text-xs text-muted-foreground">{e.detail}</span>
              <Del onConfirm={() => void exercises.remove({ id: e.id })} />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 border-t border-border bg-[color-mix(in_oklab,var(--muted)_28%,var(--card))] px-5 py-3">
        <input className={INPUT + ' flex-1'} placeholder="Esercizio… (Invio)" value={text}
          onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
        <span className="flex items-center gap-1">
          <select aria-label="Serie" className={INPUT + ' w-14'} value={serie} onChange={e => setSerie(e.target.value)}>
            {['1', '2', '3', '4', '5', '6', '8'].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">×</span>
          <select aria-label="Ripetizioni" className={INPUT + ' w-16'} value={reps} onChange={e => setReps(e.target.value)}>
            {['5', '6', '8', '10', '12', '15', '20', '25', '30'].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </span>
        <button className={BTN} onClick={add}>Aggiungi</button>
      </div>
    </section>
  )
}
