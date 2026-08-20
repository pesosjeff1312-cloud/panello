import { useEffect, useRef, useState } from 'react'

export const PANEL = 'overflow-hidden rounded-[14px] border border-border bg-card shadow-sm'
export const INPUT = 'h-8 rounded-md border border-input bg-[color-mix(in_oklab,var(--muted)_30%,transparent)] px-2.5 text-[13px] outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring'
export const BTN = 'h-8 rounded-md border border-border px-3 text-xs font-medium hover:bg-accent'
export const BTN_ON = 'h-8 rounded-md border border-[var(--color-accent-600)] bg-[color-mix(in_oklab,var(--color-accent-600)_18%,transparent)] px-3 text-xs font-medium text-[var(--color-accent-200)]'
export const ROW = 'flex items-center gap-2.5 border-b border-border px-5 py-2.5 text-[13px] last:border-0 hover:bg-[color-mix(in_oklab,var(--accent)_45%,transparent)]'
export const LABEL = 'text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground'

export function PanelHead({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <header className="flex min-h-[40px] items-center justify-between gap-2 border-b border-border px-5 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className={LABEL}>{label}</h2>
        <span className="h-px w-12 bg-[linear-gradient(90deg,var(--border),transparent)]" />
      </div>
      <div className="flex flex-none items-center gap-1.5">{children}</div>
    </header>
  )
}

export function Dot({ color, hot, title }: { color: string; hot?: boolean; title?: string }) {
  return <span title={title} className="size-[7px] shrink-0 rounded-full" style={{ background: color, boxShadow: hot ? '0 0 0 3px color-mix(in oklab, ' + color + ' 25%, transparent)' : undefined }} />
}

export function Count({ children }: { children: React.ReactNode }) {
  return <span className="tabular-nums text-[10px] tracking-[0.06em] text-muted-foreground">{children}</span>
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-6 text-center text-xs text-muted-foreground">{children}</div>
}

export function Del({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)
  const t = useRef<number>()
  useEffect(() => () => window.clearTimeout(t.current), [])
  if (!armed) return <button className="shrink-0 text-[10.5px] text-muted-foreground hover:text-destructive" onClick={() => { setArmed(true); t.current = window.setTimeout(() => setArmed(false), 4000) }}>Eliminare?</button>
  return (
    <span className="flex shrink-0 gap-1.5 text-[10.5px]">
      <button className="text-destructive" onClick={onConfirm}>Sì</button>
      <button className="text-muted-foreground" onClick={() => setArmed(false)}>No</button>
    </span>
  )
}

export function Check({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button role="checkbox" aria-checked={on} aria-label={on ? 'Annulla' : 'Completa'} onClick={onClick}
      className={'grid size-4 shrink-0 place-items-center rounded border ' + (on ? 'border-[var(--color-accent-600)] bg-[var(--color-accent-600)] text-[var(--primary-foreground)]' : 'border-input')}>
      {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="4 13 9 18 20 6" /></svg>}
    </button>
  )
}

export function Chip({ on, onClick, children, color }: { on: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button onClick={onClick}
      className={'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ' + (on ? 'text-foreground' : 'border-border text-muted-foreground hover:bg-accent')}
      style={on ? { color: color, borderColor: color ?? 'var(--color-accent-600)', background: 'color-mix(in oklab, ' + (color ?? 'var(--color-accent-600)') + ' 14%, transparent)' } : undefined}>
      {children}
    </button>
  )
}

export const COLORS = { pos: 'var(--chart-2)', urg: 'var(--destructive)', dim: 'var(--muted-foreground)', txt: 'var(--foreground)' }
export const EV_CATS = [
  { k: 'lavoro' as const, l: 'Lavoro', c: 'var(--chart-1)' },
  { k: 'scuola' as const, l: 'Scuola', c: 'var(--chart-3)' },
  { k: 'personale' as const, l: 'Personale', c: 'var(--chart-2)' }
]
export const catOf = (cat: string | null) => EV_CATS.find(c => c.k === (cat ?? 'personale')) ?? EV_CATS[2]
