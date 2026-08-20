import { useState } from 'react'
import type { Collection } from '@/hooks/useCollection'
import { PANEL, PanelHead, Dot, Count, Empty, Del, Check, INPUT, BTN, COLORS } from '@/components/ui'

export function RoutinePanel({ habits, log, today, streak }: {
  habits: Collection<'habits'>
  log: Collection<'habit_log'>
  today: string
  streak: (habitId: string) => number
}) {
  const [text, setText] = useState('')
  const list = habits.rows.filter(h => !h.archived)
  const doneToday = list.filter(h => log.rows.some(l => l.habit_id === h.id && l.day === today)).length

  const st = list.length === 0 ? 'none' : doneToday === list.length ? 'all' : doneToday > 0 ? 'part' : 'zero'
  const dot = { all: COLORS.pos, part: COLORS.dim, zero: COLORS.urg, none: COLORS.dim }[st]
  const dotTitle = { all: 'Tutte completate', part: 'Parzialmente completate', zero: 'Nessuna completata', none: 'Nessuna abitudine' }[st]

  const add = () => {
    const t = text.trim()
    if (!t) return
    void habits.insert({ text: t, position: list.length, archived: false })
    setText('')
  }

  return (
    <section className={PANEL}>
      <PanelHead label="Routine">
        <Dot color={dot} hot={st === 'zero'} title={dotTitle} />
        <Count>{String(doneToday).padStart(2, '0')}/{String(list.length).padStart(2, '0')} oggi</Count>
      </PanelHead>
      <div className="max-h-[264px] overflow-y-auto">
        {list.length === 0 ? <Empty>Nessuna abitudine impostata</Empty> : list.map(h => {
          const done = log.rows.some(l => l.habit_id === h.id && l.day === today)
          const s = streak(h.id)
          return (
            <div key={h.id} className="flex items-center gap-2.5 border-b border-border px-5 py-2.5 text-[13px] last:border-0 hover:bg-[color-mix(in_oklab,var(--accent)_45%,transparent)]">
              <Check on={done} onClick={() => done ? void log.remove({ habit_id: h.id, day: today }) : void log.insert({ habit_id: h.id, day: today })} />
              <span className={'flex-1 ' + (done ? 'line-through opacity-65' : '')}>{h.text}</span>
              <span className="tabular-nums text-xs" title={s > 0 ? s + ' giorni consecutivi' : 'nessuna serie in corso'}
                style={{ color: s > 0 ? 'var(--color-accent-300)' : 'var(--muted-foreground)' }}>
                {s > 0 ? String(s).padStart(2, '0') + 'g' : '—'}
              </span>
              <Del onConfirm={() => void habits.remove({ id: h.id })} />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 border-t border-border bg-[color-mix(in_oklab,var(--muted)_28%,var(--card))] px-5 py-3">
        <input className={INPUT + ' flex-1'} placeholder="Nuova abitudine… (Invio)" value={text}
          onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
        <button className={BTN} onClick={add}>Aggiungi</button>
      </div>
    </section>
  )
}
