import { useState } from 'react'
import type { Collection } from '@/hooks/useCollection'
import { PANEL, PanelHead, Count, Empty, Del, INPUT, BTN } from '@/components/ui'
import { shortDate } from '@/lib/dates'

export function NotesPanel({ notes }: { notes: Collection<'notes'> }) {
  const [text, setText] = useState('')
  const add = () => {
    const t = text.trim()
    if (!t) return
    void notes.insert({ text: t })
    setText('')
  }
  return (
    <section className={PANEL}>
      <PanelHead label="Note rapide"><Count>{String(notes.rows.length).padStart(2, '0')} salvate</Count></PanelHead>
      <div className="max-h-[220px] overflow-y-auto">
        {notes.rows.length === 0 ? <Empty>Nessuna nota</Empty> : notes.rows.map(n => (
          <div key={n.id} className="flex items-start gap-2.5 border-b border-border px-5 py-2.5 text-[13px] last:border-0 hover:bg-[color-mix(in_oklab,var(--accent)_45%,transparent)]">
            <span className="mt-0.5 shrink-0 tabular-nums text-[10.5px] text-muted-foreground">{shortDate(n.created_at.slice(0, 10))}</span>
            <p className="flex-1 whitespace-pre-wrap leading-snug" style={{ textWrap: 'pretty' }}>{n.text}</p>
            <Del onConfirm={() => void notes.remove({ id: n.id })} />
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2 border-t border-border bg-[color-mix(in_oklab,var(--muted)_28%,var(--card))] px-5 py-3">
        <textarea rows={2} className={INPUT + ' flex-1 resize-none py-1.5 leading-snug'} placeholder="Nota… (Ctrl+Invio)" value={text}
          onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add() }} />
        <button className={BTN} onClick={add}>Salva</button>
      </div>
    </section>
  )
}
