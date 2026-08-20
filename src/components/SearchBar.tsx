import { useMemo, useState } from 'react'
import type { useDashboard } from '@/hooks/useDashboard'
import { INPUT, COLORS } from '@/components/ui'
import { euro, shortDate } from '@/lib/dates'
import { eventStatus, reminderStatus } from '@/lib/status'

const C = { past: COLORS.dim, imminent: COLORS.urg, future: COLORS.pos, overdue: COLORS.urg, soon: COLORS.urg, done: COLORS.pos, none: COLORS.dim }

export function SearchBar({ d }: { d: ReturnType<typeof useDashboard> }) {
  const [term, setTerm] = useState('')
  const q = term.trim().toLowerCase()

  const hits = useMemo(() => {
    if (q.length < 2) return []
    const out: { k: string; t: string; m: string; c: string }[] = []
    d.events.rows.forEach(e => { if ((e.title + ' ' + (e.note ?? '')).toLowerCase().includes(q)) out.push({ k: 'EVENTO', t: e.title, m: shortDate(e.date) + ' · ' + (e.time ?? '').slice(0, 5), c: C[eventStatus(e, d.now)] }) })
    d.reminders.rows.forEach(r => { if (r.text.toLowerCase().includes(q)) out.push({ k: 'PROMEM.', t: r.text, m: r.due ? shortDate(r.due) : 'senza scadenza', c: C[reminderStatus(r, d.now)] }) })
    d.transactions.rows.forEach(t => { if ((t.descr + ' ' + (t.cat ?? '')).toLowerCase().includes(q)) out.push({ k: 'MOVIM.', t: t.descr, m: shortDate(t.date) + ' · ' + euro(Number(t.amount)) + ' €', c: Number(t.amount) > 0 ? COLORS.pos : COLORS.dim }) })
    d.notes.rows.forEach(n => { if (n.text.toLowerCase().includes(q)) out.push({ k: 'NOTA', t: n.text.slice(0, 90), m: shortDate(n.created_at.slice(0, 10)), c: COLORS.dim }) })
    return out.slice(0, 12)
  }, [q, d])

  return (
    <div className="relative min-w-0 flex-1 max-w-md">
      <input className={INPUT + ' w-full'} placeholder="Cerca in tutto…" value={term} onChange={e => setTerm(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && setTerm('')} />
      {hits.length > 0 && (
        <div className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-[52vh] overflow-y-auto rounded-[10px] border border-border bg-popover shadow-lg">
          {hits.map((h, i) => (
            <div key={i} className="grid grid-cols-[6px_58px_1fr_auto] items-center gap-2 border-b border-border px-2.5 py-1.5 last:border-0">
              <span className="size-[6px] rounded-full" style={{ background: h.c }} />
              <span className="text-[9px] tracking-[0.08em] text-muted-foreground">{h.k}</span>
              <span className="truncate text-xs">{h.t}</span>
              <span className="tabular-nums text-[10px] text-muted-foreground">{h.m}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
