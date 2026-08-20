// Tutte le date "civili" sono ISO yyyy-mm-dd in ora locale: mai toISOString() su una data locale.
export const pad = (n: number) => String(n).padStart(2, '0')

export function iso(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
export function fromIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}
export function shortDate(s: string): string {
  const d = fromIso(s)
  return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2)
}
export function weekDays(today: Date): Date[] {
  const mondayOffset = (today.getDay() + 6) % 7
  const monday = addDays(today, -mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}
export function eventAt(date: string, time: string): Date {
  const d = fromIso(date)
  const [h, m] = time.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d
}
export const WEEKDAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM']
export const MONTHS = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']
export const euro = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
