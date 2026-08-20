import { AuthGate } from './components/AuthGate'
import { SearchBar } from './components/SearchBar'
import { useDashboard } from './hooks/useDashboard'
import { LABEL, Dot, COLORS } from './components/ui'
import { RemindersPanel } from './panels/RemindersPanel'
import { RoutinePanel } from './panels/RoutinePanel'
import { GymPanel } from './panels/GymPanel'
import { FinancePanel } from './panels/FinancePanel'
import { WeatherPanel } from './panels/WeatherPanel'
import { NotesPanel } from './panels/NotesPanel'
import { CalendarPanel } from './panels/CalendarPanel'
import { euro, shortDate } from './lib/dates'
import { supabase } from './lib/supabase'

function Dashboard({ userId }: { userId: string }) {
  const d = useDashboard(userId)
  const k = d.derived
  const goalDate = d.settings.rows[0]?.goal_date

  const kpis = [
    { label: 'Saldo', value: euro(k.balance), unit: '€', sub: 'tutti i movimenti', color: k.balance < 0 ? COLORS.urg : COLORS.pos },
    { label: 'Obiettivo risparmio', value: String(Math.round(k.goalPct)), unit: '%', sub: goalDate ? 'entro ' + shortDate(goalDate) : 'nessuna scadenza', color: k.goalPct >= 100 ? COLORS.pos : COLORS.dim },
    { label: 'Promemoria attivi', value: String(k.openReminders).padStart(2, '0'), sub: k.urgent ? k.urgent + ' urgenti' : 'nessuna scadenza imminente', color: k.urgent ? COLORS.urg : COLORS.pos, hot: !!k.urgent },
    { label: 'Eventi di oggi', value: String(k.todayEvents).padStart(2, '0'), sub: k.imminent ? k.imminent + ' entro 2 ore' : k.todayEvents ? 'nessuno imminente' : 'nessun evento', color: k.imminent ? COLORS.urg : COLORS.pos, hot: !!k.imminent },
    { label: 'Routine di oggi', value: String(k.habitsDoneToday).padStart(2, '0') + '/' + String(k.habitsTotal).padStart(2, '0'), sub: 'abitudini completate', color: k.habitsTotal && k.habitsDoneToday === k.habitsTotal ? COLORS.pos : COLORS.dim }
  ]

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-8 md:px-6">
      <header className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-border bg-[color-mix(in_oklab,var(--background)_92%,transparent)] px-4 py-3 backdrop-blur-[8px] md:-mx-6 md:px-6">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-[0.01em]">Jeff</span>
          <span className={LABEL}>pannello operativo</span>
        </div>
        <SearchBar d={d} />
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-[11px] text-muted-foreground sm:inline">{d.now.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
          <span className="tabular-nums text-[15px] tracking-[0.03em]">{d.now.toLocaleTimeString('it-IT')}</span>
          {d.error && <span title={d.error} className="size-[6px] rounded-full bg-destructive shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_22%,transparent)]" />}
          <button className="text-[10.5px] text-muted-foreground hover:text-foreground" onClick={() => void supabase.auth.signOut()}>Esci</button>
        </div>
      </header>

      <div className="grid grid-cols-2 overflow-hidden rounded-[14px] border border-border bg-card shadow-sm md:grid-cols-5">
        {kpis.map((x, i) => (
          <div key={x.label} className={'px-4 py-3 ' + (i ? 'border-l border-border' : '') + (i >= 2 ? ' max-md:border-t' : '') + (i % 2 === 0 ? ' max-md:border-l-0' : '')}>
            <div className="flex items-center gap-1.5"><Dot color={x.color} hot={x.hot} /><span className={LABEL}>{x.label}</span></div>
            <div className="mt-0.5 tabular-nums text-[24px] font-bold leading-tight tracking-[-0.01em]">
              {x.value}{x.unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{x.unit}</span>}
            </div>
            <div className="text-[9.5px] tracking-[0.03em] text-muted-foreground">{x.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[62fr_38fr]">
        <div className="flex flex-col gap-4">
          <CalendarPanel events={d.events} reminders={d.reminders} now={d.now} />
          <GymPanel exercises={d.exercises} log={d.exerciseLog} days={d.gymDays} now={d.now} today={d.today} />
          <WeatherPanel location={d.settings.rows[0]?.location ?? 'Noale · VE'} />
        </div>
        <div className="flex flex-col gap-4">
          <RemindersPanel reminders={d.reminders} now={d.now} />
          <RoutinePanel habits={d.habits} log={d.habitLog} today={d.today} streak={k.streak} />
          <FinancePanel transactions={d.transactions} settings={d.settings} userId={userId} now={d.now} />
          <NotesPanel notes={d.notes} />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return <AuthGate>{userId => <Dashboard userId={userId} />}</AuthGate>
}
