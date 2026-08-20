// Edge Function "notify": push giornaliero dei promemoria in scadenza.
// Deploy:  npx supabase functions deploy notify --no-verify-jwt
// Secrets: npx supabase secrets set VAPID_PUBLIC=... VAPID_PRIVATE=... VAPID_SUBJECT=mailto:tu@email.it
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

Deno.serve(async () => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC')!, Deno.env.get('VAPID_PRIVATE')!)

  const today = new Date().toISOString().slice(0, 10)
  const { data: due } = await db.from('reminders').select('user_id, text').eq('done', false).lte('due', today)
  if (!due?.length) return new Response('niente da notificare')

  const byUser = new Map<string, string[]>()
  for (const r of due) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.text])

  let sent = 0
  for (const [user_id, items] of byUser) {
    const { data: s } = await db.from('settings').select('push_subscription').eq('user_id', user_id).single()
    const sub = s?.push_subscription
    if (!sub) continue
    const body = items.slice(0, 3).join(' · ') + (items.length > 3 ? ' +' + (items.length - 3) : '')
    try {
      await webpush.sendNotification(sub as never, JSON.stringify({ title: items.length + ' promemoria in scadenza', body, url: '/' }))
      sent++
    } catch (e) { console.error('push fallito', user_id, e) }
  }
  return new Response('inviati ' + sent)
})
