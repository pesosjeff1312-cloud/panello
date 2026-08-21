import { useState } from 'react'
import type { Collection } from '@/hooks/useCollection'
import type { Exercise } from '@/lib/types'
import { PANEL, PanelHead, Dot, Count, Empty, Del, Check, INPUT, BTN, BTN_ON, COLORS } from '@/components/ui'
import { iso, fromIso, weekDays, WEEKDAYS } from '@/lib/dates'

const weekdayOf = (day: string) => (fromIso(day).getDay() + 6) % 7

export function GymPanel({ exercises, log, days, now, today }: {
  exercises: Collection<'exercises'>
  log: Collection<'exercise_log'>
  days: Collection<'gym_days'>
  now: Date
  today: string
}) {
  const [schedaOpen, setSchedaOpen] = useState(false)
  const list = exercises.rows.filter(e => !e.archived)
  const isDone = (id: string, day: string) => log.rows.some(l => l.exercise_id === id && l.day === day)

  const todayIdx = weekdayOf(today)
  const todayList = list.filter(e => e.weekday === todayIdx)
  const doneToday = todayList.filter(e => isDone(e.id, today)).length
  const st = todayList.length === 0 ? 'none' : doneToday === todayList.length ? 'all' : doneToday > 0 ? 'part' : 'zero'
  const dot = { all: COLORS.pos, part: COLORS.dim, zero: COLORS.urg, none: COLORS.dim }[st]

  const week = weekDays(now).map(iso)
  const stateOf = (day: string) => {
    const rec = days.rows.find(d => d.day === day)
    if (rec?.state === 'rest') return 'rest'
    const dayList = list.filter(e => e.weekday === weekdayOf(day))
    const doneCount = dayList.filter(e => isDone(e.id, day)).length
    const complete = dayList.length > 0 && doneCount === dayList.length
    if (day === today) return complete ? 'done' : 'today'
    if (day > today) return 'future'
    return complete ? 'done' : dayList.length === 0 ? 'none' : 'skip'
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
    skip: 'border-border/60 text-muted-foreground/70',
    none: 'border-border/40 text-muted-foreground/40'
  }

  return (
    <section className={PANEL}>
      <PanelHead label="Palestra">
        <Dot color={dot} hot={st === 'zero'} title="Stato allenamento di oggi" />
        <Count>{String(doneToday).padStart(2, '0')}/{String(todayList.length).padStart(2, '0')} oggi</Count>
        <button className={schedaOpen ? BTN_ON : BTN} onClick={() => setSchedaOpen(o => !o)}>{schedaOpen ? 'Chiudi' : 'Scheda'}</button>
      </PanelHead>
      <div className="grid grid-cols-7 gap-1.5 border-b border-border px-5 py-3">
        {week.map((day, i) => {
          const s = stateOf(day)
          return (
            <button key={day} onClick={() => s !== 'future' && toggleRest(day)}
              title={s === 'rest' ? 'Riposo (click per rimuovere)' : s === 'done' ? 'Completato' : s === 'today' ? 'Oggi' : s === 'future' ? 'In programma' : s === 'none' ? 'Nessun esercizio programmato' : 'Non svolto (click per riposo)'}
              className={'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-md border py-1 text-[10px] ' + cell[s] +
                (day === today ? ' bg-[color-mix(in_oklab,var(--accent)_40%,transparent)]' : '')}>
              <span className="tracking-[0.08em]">{WEEKDAYS[i]}</span>
              <span className="tabular-nums text-[13px]">{day.slice(8)}</span>
            </button>
          )
        })}
      </div>
      <div className="max-h-[220px] overflow-y-auto">
        {todayList.length === 0 ? <Empty>Nessun esercizio programmato per oggi</Empty> : todayList.map(e => {
          const d = isDone(e.id, today)
          return (
            <div key={e.id} className="flex items-center gap-2.5 border-b border-border px-5 py-2.5 text-[13px] last:border-0 hover:bg-[color-mix(in_oklab,var(--accent)_45%,transparent)]">
              <Check on={d} onClick={() => d ? void log.remove({ exercise_id: e.id, day: today }) : void log.insert({ exercise_id: e.id, day: today })} />
              <span className={'flex-1 ' + (d ? 'line-through opacity-65' : '')}>{e.text}</span>
              <span className="tabular-nums text-xs text-muted-foreground">{e.detail}</span>
            </div>
          )
        })}
      </div>
      {schedaOpen && <Scheda exercises={exercises} list={list} />}
    </section>
  )
}

function Scheda({ exercises, list }: { exercises: Collection<'exercises'>; list: Exercise[] }) {
  const unassigned = list.filter(e => e.weekday == null)
  return (
    <div className="border-t border-border bg-[color-mix(in_oklab,var(--muted)_18%,var(--card))]">
      <div className="px-5 pt-3 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Scheda settimanale</div>
      {WEEKDAYS.map((label, idx) => <SchedaDay key={idx} label={label} idx={idx} list={list.filter(e => e.weekday === idx)} exercises={exercises} />)}
      {unassigned.length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <div className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Non assegnati</div>
          <div className="mt-1.5 grid gap-1">
            {unassigned.map(e => (
              <div key={e.id} className="flex items-center gap-2 text-[13px]">
                <span className="flex-1 text-muted-foreground">{e.text}</span>
                <span className="tabular-nums text-xs text-muted-foreground">{e.detail}</span>
                <select aria-label="Assegna a giorno" className="h-6 shrink-0 rounded border border-input bg-transparent text-[10.5px] text-muted-foreground outline-none"
                  value="" onChange={ev => void exercises.update({ id: e.id }, { weekday: Number(ev.target.value) })}>
                  <option value="" disabled>assegna…</option>
                  {WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}</option>)}
                </select>
                <Del onConfirm={() => void exercises.remove({ id: e.id })} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SchedaDay({ label, idx, list, exercises }: { label: string; idx: number; list: Exercise[]; exercises: Collection<'exercises'> }) {
  const [text, setText] = useState('')
  const [serie, setSerie] = useState('3')
  const [reps, setReps] = useState('12')
  const add = () => {
    const t = text.trim()
    if (!t) return
    void exercises.insert({ text: t, detail: serie + '×' + reps, position: list.length, archived: false, weekday: idx })
    setText('')
  }
  return (
    <div className="border-t border-border px-5 py-3">
      <div className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1.5 grid gap-1">
        {list.length === 0 && <p className="text-xs text-muted-foreground/60">Nessun esercizio</p>}
        {list.map(e => (
          <div key={e.id} className="flex items-center gap-2 text-[13px]">
            <span className="flex-1">{e.text}</span>
            <span className="tabular-nums text-xs text-muted-foreground">{e.detail}</span>
            <Del onConfirm={() => void exercises.remove({ id: e.id })} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        <input className={INPUT + ' h-7 flex-1 text-xs'} placeholder="Esercizio… (Invio)" value={text}
          onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
        <select aria-label="Serie" className={INPUT + ' h-7 w-12 text-xs'} value={serie} onChange={e => setSerie(e.target.value)}>
          {['1', '2', '3', '4', '5', '6', '8'].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select aria-label="Ripetizioni" className={INPUT + ' h-7 w-14 text-xs'} value={reps} onChange={e => setReps(e.target.value)}>
          {['5', '6', '8', '10', '12', '15', '20', '25', '30'].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button className={BTN + ' h-7 px-2.5'} onClick={add}>+</button>
      </div>
    </div>
  )
}
