import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useDashboard'

/** Magic link: nessuna password da gestire, un solo utente. */
export function AuthGate({ children }: { children: (userId: string) => React.ReactNode }) {
  const { userId, ready } = useSession()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!ready) return <div className="grid min-h-dvh place-items-center text-muted-foreground">…</div>
  if (userId) return <>{children(userId)}</>

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) setErr(error.message)
    else { setSent(true); setErr(null) }
  }

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <form onSubmit={send} className="w-full max-w-sm rounded-[14px] border border-border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-bold tracking-tight">Pannello operativo</h1>
        <p className="mt-1 text-xs text-muted-foreground">Accedi con il link via email.</p>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.it"
          className="mt-4 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_50%,transparent)]"
        />
        <button className="mt-3 h-9 w-full rounded-md border border-border bg-primary text-sm font-medium text-primary-foreground">
          {sent ? 'Link inviato — controlla la mail' : 'Invia link'}
        </button>
        {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
      </form>
    </div>
  )
}
