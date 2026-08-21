import { useMemo, useState } from 'react'
import type { Collection } from '@/hooks/useCollection'
import { PANEL, PanelHead, Empty, Del, Chip, INPUT, BTN, BTN_ON, LABEL, COLORS } from '@/components/ui'
import { euro, iso, shortDate, fromIso, MONTHS, pad } from '@/lib/dates'

export function FinancePanel({ transactions, settings, now }: {
  transactions: Collection<'transactions'>
  settings: Collection<'settings'>
  now: Date
}) {
  const s = settings.rows[0]
  const goal = Number(s?.goal ?? 10000)
  const goalDate = s?.goal_date ?? ''
  const [filter, setFilter] = useState('Tutte')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ descr: '', amount: '', type: 'in', date: iso(now), cat: '' })
  const [formErr, setFormErr] = useState<string | null>(null)
  const set = (k: string, v: string) => { setDraft(d => ({ ...d, [k]: v })); setFormErr(null) }

  const rows = transactions.rows
  const cats = useMemo(() => [...new Set(rows.map(t => (t.cat ?? '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it')), [rows])
  const balance = rows.reduce((n, t) => n + Number(t.amount), 0)
  const ym = iso(now).slice(0, 7)
  const month = rows.filter(t => t.date.startsWith(ym))
  const income = month.filter(t => Number(t.amount) > 0).reduce((n, t) => n + Number(t.amount), 0)
  const spent = month.filter(t => Number(t.amount) < 0).reduce((n, t) => n - Number(t.amount), 0)
  const pct = goal > 0 ? Math.max(0, Math.min(100, (balance / goal) * 100)) : 0
  const missing = Math.max(0, goal - balance)
  const days = goalDate ? Math.max(0, Math.ceil((fromIso(goalDate).getTime() + 864e5 - now.getTime()) / 864e5)) : null
  const perMonth = days ? missing / Math.max(1, days / 30.44) : 0

  const bars = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const k = d.getFullYear() + '-' + pad(d.getMonth() + 1)
    const inMonth = rows.filter(t => t.date.startsWith(k))
    return {
      label: MONTHS[d.getMonth()].slice(0, 3),
      inn: inMonth.filter(t => Number(t.amount) > 0).reduce((n, t) => n + Number(t.amount), 0),
      out: inMonth.filter(t => Number(t.amount) < 0).reduce((n, t) => n - Number(t.amount), 0)
    }
  }), [rows, now])
  const peak = Math.max(1, ...bars.map(b => Math.max(b.inn, b.out)))

  const list = (filter === 'Tutte' ? rows : rows.filter(t => t.cat === filter)).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  const commit = () => {
    if (!draft.descr.trim()) return setFormErr('Manca la descrizione.')
    const v = Math.abs(parseFloat(String(draft.amount).replace(',', '.')))
    if (!v || isNaN(v)) return setFormErr('Importo non valido.')
    void transactions.insert({ date: draft.date, descr: draft.descr.trim(), amount: draft.type === 'in' ? v : -v, cat: draft.cat.trim() })
    setDraft({ ...draft, descr: '', amount: '' })
    setFormErr(null)
    setOpen(false)
  }
  const patchSettings = (patch: { goal?: number; goal_date?: string }) => void settings.upsert(patch)

  return (
    <section className={PANEL}>
      <PanelHead label="Riepilogo finanze">
        <button className={open ? BTN_ON : BTN} onClick={() => { setOpen(o => !o); setFormErr(null) }}>{open ? 'Chiudi' : '+ Transazione'}</button>
      </PanelHead>

      <div className="px-5 py-4">
        <span className={LABEL}>Saldo corrente</span>
        <div className="tabular-nums text-[26px] font-bold leading-tight tracking-[-0.02em]" style={{ color: balance < 0 ? COLORS.urg : COLORS.txt }}>
          {euro(balance)}<span className="ml-1 text-sm font-medium text-muted-foreground">€</span>
        </div>
        <div className="mt-2 flex gap-5 text-[13px]">
          <span className="flex items-center gap-1.5"><span className={LABEL}>Entrate</span><b className="tabular-nums" style={{ color: COLORS.pos }}>{euro(income)}</b></span>
          <span className="flex items-center gap-1.5"><span className={LABEL}>Uscite</span><b className="tabular-nums" style={{ color: spent > income ? COLORS.urg : COLORS.dim }}>{euro(spent)}</b></span>
        </div>
      </div>

      {open && (
        <div className="grid gap-2 border-y border-border bg-[color-mix(in_oklab,var(--muted)_28%,var(--card))] px-5 py-3">
          <input autoFocus className={INPUT} placeholder="Descrizione" value={draft.descr} onChange={e => set('descr', e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setOpen(false) }} />
          <div className="flex gap-2">
            <input className={INPUT + ' w-28 tabular-nums'} inputMode="decimal" placeholder="0,00" value={draft.amount} onChange={e => set('amount', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commit()} />
            <div className="flex flex-1 overflow-hidden rounded-md border border-border">
              {[['in', 'Entrata'], ['out', 'Uscita']].map(([k, l]) => (
                <button key={k} onClick={() => set('type', k)}
                  className={'flex-1 text-xs ' + (draft.type === k ? 'bg-[color-mix(in_oklab,var(--color-accent-600)_18%,transparent)] text-[var(--color-accent-200)]' : 'text-muted-foreground hover:bg-accent')}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input type="date" className={INPUT + ' flex-1'} value={draft.date} onChange={e => set('date', e.target.value)} />
            <input className={INPUT + ' flex-1'} placeholder="Categoria" value={draft.cat} onChange={e => set('cat', e.target.value)} onKeyDown={e => e.key === 'Enter' && commit()} />
          </div>
          <button className={BTN + ' w-full'} onClick={commit}>Registra</button>
          {formErr && <p className="text-xs text-destructive">{formErr}</p>}
        </div>
      )}

      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className={LABEL}>Obiettivo risparmio</span>
          <span className="flex items-center gap-1.5 text-[13px]">
            <input aria-label="Importo obiettivo" inputMode="numeric" defaultValue={String(goal)} onBlur={e => { const v = parseInt(e.target.value.replace(/\D/g, ''), 10); if (v) patchSettings({ goal: v }) }}
              className="w-20 border-b border-border bg-transparent text-right tabular-nums outline-none focus-visible:border-ring" />€
            <input aria-label="Scadenza obiettivo" type="date" value={goalDate} onChange={e => patchSettings({ goal_date: e.target.value })}
              className="border-b border-border bg-transparent tabular-nums outline-none focus-visible:border-ring" />
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--muted)_60%,transparent)]">
          <div className="h-full rounded-full bg-[var(--color-accent-600)]" style={{ width: pct + '%' }} />
        </div>
        <div className="mt-1.5 tabular-nums text-[11px] text-muted-foreground">{euro(balance)} € / {euro(goal)} € · {Math.round(pct)}%</div>
        {days !== null && (
          <div className="tabular-nums text-[11px] text-muted-foreground">
            {missing > 0 ? 'mancano ' + euro(missing) + ' € · ' + days + ' giorni · ' + euro(perMonth) + ' €/mese' : 'obiettivo raggiunto'}
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="flex items-baseline justify-between"><span className={LABEL}>Entrate / uscite · 6 mesi</span><span className="tabular-nums text-[10px] text-muted-foreground">max {euro(peak)}</span></div>
        {rows.length === 0 ? <Empty>Nessun movimento da rappresentare</Empty> : (
          <div className="mt-3 flex h-24 items-end gap-2">
            {bars.map(b => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-20 w-full items-end justify-center gap-1">
                  <div className="w-2.5 rounded-t-sm bg-[var(--chart-2)]" style={{ height: (b.inn / peak) * 100 + '%' }} title={'Entrate ' + b.label + ': ' + euro(b.inn) + ' €'} />
                  <div className="w-2.5 rounded-t-sm bg-[var(--color-neutral-600,var(--muted-foreground))] opacity-70" style={{ height: (b.out / peak) * 100 + '%' }} title={'Uscite ' + b.label + ': ' + euro(b.out) + ' €'} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {cats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-5 py-3">
          {['Tutte', ...cats].map(c => <Chip key={c} on={filter === c} onClick={() => setFilter(c)}>{c}</Chip>)}
        </div>
      )}

      <div className="border-t border-border">
        {list.length === 0 ? <Empty>Nessuna transazione registrata</Empty> : list.map(t => (
          <div key={t.id} className="flex items-center gap-2.5 border-b border-border px-5 py-2.5 text-[13px] last:border-0 hover:bg-[color-mix(in_oklab,var(--accent)_45%,transparent)]">
            <span className="shrink-0 tabular-nums text-[10.5px] text-muted-foreground">{shortDate(t.date)}</span>
            <span className="flex-1 truncate">{t.descr}{t.cat && <span className="ml-2 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{t.cat}</span>}</span>
            <span className="shrink-0 tabular-nums" style={{ color: Number(t.amount) > 0 ? COLORS.pos : COLORS.dim }}>
              {Number(t.amount) > 0 ? '+' : '−'}{euro(Math.abs(Number(t.amount)))}
            </span>
            <Del onConfirm={() => void transactions.remove({ id: t.id })} />
          </div>
        ))}
      </div>
    </section>
  )
}
