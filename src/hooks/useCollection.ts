import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database, TableName } from '@/lib/types'

type RowOf<K extends TableName> = Database['public']['Tables'][K]['Row']

export type Collection<K extends TableName> = {
  rows: RowOf<K>[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  insert: (payload: Partial<RowOf<K>>) => Promise<void>
  update: (match: Partial<RowOf<K>>, patch: Partial<RowOf<K>>) => Promise<void>
  remove: (match: Partial<RowOf<K>>) => Promise<void>
  upsert: (payload: Partial<RowOf<K>>) => Promise<void>
}

/**
 * Una collezione = una tabella. Lettura iniziale, realtime, scritture ottimistiche
 * con rollback e messaggio d'errore (il puntino rosso dell'header legge questo error).
 * user_id lo mette il default della colonna? No: va passato, quindi lo iniettiamo qui.
 */
export function useCollection<K extends TableName>(
  table: K,
  userId: string | null,
  opts?: { order?: { column: string; ascending?: boolean }; key?: (keyof RowOf<K>)[] }
): Collection<K> {
  const [rows, setRows] = useState<RowOf<K>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const keyCols = (opts?.key ?? ['id']) as (keyof RowOf<K>)[]
  const orderCol = opts?.order?.column
  const orderAsc = opts?.order?.ascending ?? true
  const mounted = useRef(true)

  useEffect(() => () => { mounted.current = false }, [])

  const reload = useCallback(async () => {
    if (!userId) return
    let q = supabase.from(table).select('*')
    if (orderCol) q = q.order(orderCol, { ascending: orderAsc })
    const res = await q
    if (!mounted.current) return
    if (res.error) setError(res.error.message)
    else { setRows((res.data ?? []) as RowOf<K>[]); setError(null) }
    setLoading(false)
  }, [table, userId, orderCol, orderAsc])

  useEffect(() => { void reload() }, [reload])

  useEffect(() => {
    if (!userId) return
    const ch = supabase
      .channel('rt:' + table)
      .on('postgres_changes', { event: '*', schema: 'public', table: table as string }, () => { void reload() })
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [table, userId, reload])

  const sameRow = (a: Partial<RowOf<K>>, b: RowOf<K>) => keyCols.every(k => a[k] === undefined || a[k] === b[k])

  const guard = async (optimistic: RowOf<K>[], run: () => Promise<{ error: { message: string } | null }>) => {
    const prev = rows
    setRows(optimistic)
    const { error } = await run()
    if (error) { setRows(prev); setError(error.message) } else setError(null)
  }

  const insert = async (payload: Partial<RowOf<K>>) => {
    if (!userId) return
    const body = { ...payload, user_id: userId } as Partial<RowOf<K>>
    const temp = { id: 'tmp-' + crypto.randomUUID(), created_at: new Date().toISOString(), ...body } as RowOf<K>
    await guard([...rows, temp], async () => {
      const r = await supabase.from(table).insert(body as never)
      return { error: r.error }
    })
    void reload()
  }

  const update = async (match: Partial<RowOf<K>>, patch: Partial<RowOf<K>>) => {
    const next = rows.map(r => (sameRow(match, r) ? { ...r, ...patch } : r))
    await guard(next, async () => {
      let q = supabase.from(table).update(patch as never)
      for (const k of Object.keys(match)) q = q.eq(k, (match as Record<string, unknown>)[k] as never)
      const r = await q
      return { error: r.error }
    })
  }

  const remove = async (match: Partial<RowOf<K>>) => {
    await guard(rows.filter(r => !sameRow(match, r)), async () => {
      let q = supabase.from(table).delete()
      for (const k of Object.keys(match)) q = q.eq(k, (match as Record<string, unknown>)[k] as never)
      const r = await q
      return { error: r.error }
    })
  }

  const upsert = async (payload: Partial<RowOf<K>>) => {
    if (!userId) return
    const body = { ...payload, user_id: userId } as Partial<RowOf<K>>
    const exists = rows.some(r => sameRow(body, r))
    const next = exists ? rows.map(r => (sameRow(body, r) ? { ...r, ...body } : r)) : [...rows, body as RowOf<K>]
    await guard(next, async () => {
      const r = await supabase.from(table).upsert(body as never)
      return { error: r.error }
    })
  }

  return { rows, loading, error, reload, insert, update, remove, upsert }
}
