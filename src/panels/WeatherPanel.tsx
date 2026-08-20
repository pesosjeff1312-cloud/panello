import { PANEL, PanelHead, Count, LABEL } from '@/components/ui'
import { useWeather } from '@/hooks/useWeather'
import { pad } from '@/lib/dates'

const CODES: [number[], string, string, string][] = [
  [[0], 'sun', 'sereno', 'Sereno'],
  [[1, 2], 'part', 'poco nuvoloso', 'Poco nuv.'],
  [[3], 'cloud', 'coperto', 'Coperto'],
  [[45, 48], 'fog', 'nebbia', 'Nebbia'],
  [[51, 53, 55, 56, 57], 'drizzle', 'pioviggine', 'Pioviggine'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'rain', 'pioggia', 'Pioggia'],
  [[71, 73, 75, 77, 85, 86], 'snow', 'neve', 'Neve'],
  [[95, 96, 99], 'storm', 'temporale', 'Temporale']
]
const row = (code: number) => CODES.find(([l]) => l.includes(code)) ?? [[], 'cloud', 'variabile', 'Variabile'] as [number[], string, string, string]

export function WIcon({ code, size = 20 }: { code: number; size?: number }) {
  const k = row(code)[1]
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const rays: [number, number, number, number][] = [[12, 2, 12, 4], [12, 20, 12, 22], [2, 12, 4, 12], [20, 12, 22, 12], [4.9, 4.9, 6.3, 6.3], [17.7, 17.7, 19.1, 19.1], [4.9, 19.1, 6.3, 17.7], [17.7, 6.3, 19.1, 4.9]]
  const cloud = <path {...p} d="M6.5 18h10a3.5 3.5 0 0 0 .2-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 6.5 18Z" />
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {k === 'sun' && <g><circle {...p} cx="12" cy="12" r="4.6" />{rays.map((r, i) => <line key={i} {...p} x1={r[0]} y1={r[1]} x2={r[2]} y2={r[3]} />)}</g>}
      {k === 'part' && <g><circle {...p} cx="9" cy="8.5" r="3.2" /><line {...p} x1="9" y1="1.8" x2="9" y2="3.2" /><line {...p} x1="2.4" y1="8.5" x2="3.8" y2="8.5" /><line {...p} x1="4.4" y1="3.9" x2="5.4" y2="4.9" />{cloud}</g>}
      {k === 'cloud' && cloud}
      {k === 'fog' && <g>{cloud}<line {...p} x1="4" y1="21" x2="12" y2="21" /><line {...p} x1="15" y1="21" x2="20" y2="21" /></g>}
      {k === 'drizzle' && <g>{cloud}<line {...p} x1="9" y1="20" x2="8.4" y2="22" /><line {...p} x1="14" y1="20" x2="13.4" y2="22" /></g>}
      {k === 'rain' && <g>{cloud}<line {...p} x1="8.5" y1="19.5" x2="7.5" y2="22.5" /><line {...p} x1="12" y1="19.5" x2="11" y2="22.5" /><line {...p} x1="15.5" y1="19.5" x2="14.5" y2="22.5" /></g>}
      {k === 'snow' && <g>{cloud}<line {...p} x1="8" y1="20.5" x2="10" y2="22.5" /><line {...p} x1="10" y1="20.5" x2="8" y2="22.5" /><line {...p} x1="14" y1="20.5" x2="16" y2="22.5" /><line {...p} x1="16" y1="20.5" x2="14" y2="22.5" /></g>}
      {k === 'storm' && <g>{cloud}<polyline {...p} points="12.5 19 10 22.5 13 22 11.5 24.5" /></g>}
    </svg>
  )
}

const FALLBACK = { cur: { t: 27, rh: 52, w: 9, code: 1 }, hours: [{ h: '—', t: 27, code: 1 }, { h: '—', t: 28, code: 1 }, { h: '—', t: 27, code: 2 }, { h: '—', t: 25, code: 3 }] }

export function WeatherPanel({ location }: { location: string }) {
  const data = useWeather(location)
  const { cur, hours } = data ?? FALLBACK
  const at = data ? new Date(data.at) : null

  return (
    <section className={PANEL}>
      <PanelHead label="Meteo"><Count>{location}{at ? ' · ' + pad(at.getHours()) + ':' + pad(at.getMinutes()) : ' · dati di riferimento'}</Count></PanelHead>
      <div className="flex items-center gap-4 px-5 py-4">
        <span className="text-[var(--color-accent-300)]"><WIcon code={cur.code} size={52} /></span>
        <div>
          <div className="tabular-nums text-[30px] font-bold leading-none tracking-[-0.02em]">{cur.t}<span className="ml-1 text-sm font-medium text-muted-foreground">°C</span></div>
          <div className="mt-1 text-xs text-muted-foreground">{row(cur.code)[2]}</div>
        </div>
        <div className="ml-auto grid gap-1 text-right">
          <span><span className={LABEL}>Umidità</span> <b className="tabular-nums text-[13px]">{cur.rh}%</b></span>
          <span><span className={LABEL}>Vento</span> <b className="tabular-nums text-[13px]">{cur.w} km/h</b></span>
        </div>
      </div>
      <div className="grid grid-cols-4 border-t border-border">
        {hours.map((h, i) => (
          <div key={i} className={'flex flex-col items-center gap-1 py-3 text-[11px] ' + (i ? 'border-l border-border' : '')}>
            <span className="tabular-nums text-muted-foreground">{h.h}</span>
            <span className="text-[var(--color-accent-300)]"><WIcon code={h.code} size={24} /></span>
            <span className="tabular-nums text-[13px]">{h.t}°</span>
            <span className="text-muted-foreground">{row(h.code)[3]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
