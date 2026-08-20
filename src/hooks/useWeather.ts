import { useEffect, useState } from 'react'

export type Weather = {
  at: number
  loc: string
  cur: { t: number; rh: number; w: number; code: number }
  hours: { h: string; t: number; code: number }[]
}

const CACHE = 'meteo:cache'
const TTL = 30 * 60 * 1000

/** Resta client-side: open-meteo non richiede chiave, quindi nessun proxy/server. */
export function useWeather(loc = 'Noale · VE', lat = 45.5497, lon = 12.0736) {
  const [data, setData] = useState<Weather | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(CACHE)
    if (raw) {
      try {
        const c = JSON.parse(raw) as Weather
        if (c.loc === loc && Date.now() - c.at < TTL) { setData(c); return }
      } catch { /* cache illeggibile: si rifà la fetch */ }
    }
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
      '&hourly=temperature_2m,weather_code&forecast_days=2&timezone=auto'
    let alive = true
    fetch(url).then(r => r.json()).then((j: any) => {
      if (!alive) return
      const startIdx = j.hourly.time.findIndex((t: string) => new Date(t) > new Date())
      const hours = [0, 1, 2, 3].map(i => {
        const k = Math.max(0, startIdx) + i * 3
        return { h: String(j.hourly.time[k]).slice(11, 16), t: Math.round(j.hourly.temperature_2m[k]), code: j.hourly.weather_code[k] }
      })
      const next: Weather = {
        at: Date.now(), loc,
        cur: { t: Math.round(j.current.temperature_2m), rh: j.current.relative_humidity_2m, w: Math.round(j.current.wind_speed_10m), code: j.current.weather_code },
        hours
      }
      localStorage.setItem(CACHE, JSON.stringify(next))
      setData(next)
    }).catch(() => { /* fallback statico: vedi design/weather.jsx */ })
    return () => { alive = false }
  }, [loc, lat, lon])

  return data
}
