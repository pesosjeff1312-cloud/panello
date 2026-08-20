import { useState } from 'react'
import { Check } from 'lucide-react'
import type { Collection } from '@/hooks/useCollection'
import { reminderStatus, sortReminders } from '@/lib/status'
import { shortDate } from '@/lib/dates'

/**
 * Panel di riferimento: mostra il pattern da replicare negli altri sei
 * (header + lista scrollabile + campo di inserimento in fondo, conferma inline sui delete).
 * Riferimento visivo: design/tasks.jsx — misure e colori in README → Promemoria.
 */
export function RemindersPanel({ reminders, now }: { reminders: Collection<'reminders'>; now: Date }) {
  const [text, setText] = useState('')
  const [due, setDue] = useState('')
  const [armed, setArmed] = useState<string | null>(null)
  const list = sortReminders(reminders.rows, now)
  const open = list.filter(r => !r.done).length

  const add = () => {
    const t = text.trim()
    if (!t) return
    void reminders.insert({ text: t, due: due || null, done: false })
    setText(''); setDue('')
  }

  return (
    <section className="overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold">Promemoria</h2>
        <span className="text-xs text-muted-foreground">{open} attivi</span>
      </header>

      <ul className="max-h-[264px] overflow-y-auto">
        {list.map(r => {
          const st = reminderStatus(r, now)
          const urgent = st === 'overdue' || st === 'soon'
          return (
            <li key={r.id} className="flex items-center gap-2.5 border-b border-border px-5 py-2.5 text-[13px] last:border-0 hover:bg-[color-mix(in_oklab,var(--accent)_45%,transparent)]">
              <button
                aria-label="Completa"
                onClick={() => void reminders.update({ id: r.id }, { done: !r.done, done_at: r.done ? null : new Date().toISOString() })}
                className={'grid size-4 shrink-0 place-items-center rounded border ' + (r.done ? 'border-primary bg-primary text-primary-foreground' : 'border-input')}
              >{r.done && <Check size={12} strokeWidth={3} />}</button>
              <span className={'size-[7px] shrink-0 rounded-full ' + (r.done ? 'bg-[var(--chart-2)]' : urgent ? 'bg-destructive shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_25%,transparent)]' : 'bg-muted-foreground/60')} />
              <span className={'flex-1 ' + (r.done ? 'line-through opacity-65' : '')}>{r.text}</span>
              <span className={'tabular-nums text-xs ' + (urgent ? 'text-destructive' : 'text-muted-foreground')}>{r.due ? shortDate(r.due) : '—'}</span>
              {armed === r.id ? (
                <span className="flex gap-1.5 text-xs">
                  <button className="text-destructive" onClick={() => void reminders.remove({ id: r.id })}>Sì</button>
                  <button className="text-muted-foreground" onClick={() => setArmed(null)}>No</button>
                </span>
              ) : (
                <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { setArmed(r.id); setTimeout(() => setArmed(null), 4000) }}>Eliminare?</button>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex gap-2 border-t border-border bg-[color-mix(in_oklab,var(--muted)_28%,var(--card))] px-5 py-3">
        <input
          value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Nuovo promemoria… (Invio)"
          className="h-8 flex-1 rounded-md border border-input bg-transparent px-2.5 text-[13px] outline-none focus-visible:border-ring"
        />
        <input type="date" value={due} onChange={e => setDue(e.target.value)} className="h-8 w-28 rounded-md border border-input bg-transparent px-2 text-xs" />
        <button onClick={add} className="h-8 rounded-md border border-border px-3 text-xs font-medium hover:bg-accent">Aggiungi</button>
      </div>
    </section>
  )
}
