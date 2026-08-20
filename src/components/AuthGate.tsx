import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useDashboard'
import { INPUT, BTN, BTN_ON, LABEL } from '@/components/ui'

/** Email + password: nessun limite di invio, sessione persistente. */
export function AuthGate({ children }: { children: (userId: string) => React.ReactNode }) {
  const { userId, ready } = useSession()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState<{ t: 'err' | 'ok'; s: string } | null>(null)
  const [busy, setBusy] = useState(false)

  if (!ready) return <div className="grid min-h-dvh place-items-center text-muted-foreground">…</div>
  if (userId) return <>{children(userId)}</>

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 6) return setMsg({ t: 'err', s: 'La password deve avere almeno 6 caratteri.' })
    setBusy(true)
    const res = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw })
    setBusy(false)
    if (res.error) {
      const m = res.error.message
      setMsg({
        t: 'err',
        s: /invalid login/i.test(m) ? 'Email o password non corretti.'
          : /already registered|already exists/i.test(m) ? 'Questa email ha già un account: usa "Accedi".'
          : /confirm/i.test(m) ? 'Account da confermare: disattiva "Confirm email" in Supabase → Authentication → Providers → Email.'
          : m
      })
    } else if (mode === 'up' && !res.data.session) {
      setMsg({ t: 'ok', s: 'Account creato. Serve la conferma via email, oppure disattiva "Confirm email" in Supabase e riprova ad accedere.' })
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[14px] border border-border bg-card p-6 shadow-sm">
        <h1 className="text-base font-semibold tracking-[0.01em]">Pannello operativo</h1>
        <p className={LABEL + ' mt-1 block'}>{mode === 'in' ? 'accesso' : 'nuovo account'}</p>
        <div className="mt-4 grid gap-2">
          <input className={INPUT} type="email" required autoComplete="username" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className={INPUT} type="password" required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder="password" value={pw} onChange={e => setPw(e.target.value)} />
        </div>
        <button className={BTN_ON + ' mt-3 w-full'} disabled={busy}>
          {busy ? '…' : mode === 'in' ? 'Accedi' : 'Crea account'}
        </button>
        <button type="button" className={BTN + ' mt-2 w-full'} onClick={() => { setMode(m => (m === 'in' ? 'up' : 'in')); setMsg(null) }}>
          {mode === 'in' ? 'Non hai un account? Creane uno' : 'Hai già un account? Accedi'}
        </button>
        {msg && <p className={'mt-3 text-xs ' + (msg.t === 'err' ? 'text-destructive' : 'text-muted-foreground')} style={{ textWrap: 'pretty' }}>{msg.s}</p>}
      </form>
    </div>
  )
}
