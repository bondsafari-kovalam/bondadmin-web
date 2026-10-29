import type { Kpi } from '@/types/dashboard'

/** ₹ in lakhs above 1L, otherwise thousands or plain rupees. */
export function money(value: number) {
  if (Math.abs(value) >= 100_000) return `₹${(value / 100_000).toFixed(2)}L`
  if (Math.abs(value) >= 1_000) return `₹${(value / 1_000).toFixed(1)}k`
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function count(value: number) { return value.toLocaleString('en-IN') }

export function percent(value: number) { return `${value.toFixed(1)}%` }

export function formatKpi(kpi: Pick<Kpi, 'format'>, value: number) {
  return kpi.format === 'money' ? money(value) : kpi.format === 'percent' ? percent(value) : count(value)
}

/** Change vs previous period. Percent metrics use percentage points. */
export function kpiChange(kpi: Kpi): { text: string, direction: 'up' | 'down' | 'flat', good: boolean } | null {
  if (kpi.previous === null) return null
  const diff = kpi.value - kpi.previous
  const direction = Math.abs(diff) < 1e-9 ? 'flat' : diff > 0 ? 'up' : 'down'
  const good = direction === 'flat' || (direction === kpi.goodWhen)
  if (kpi.format === 'percent') return { text: `${Math.abs(diff).toFixed(1)} pts`, direction, good }
  if (kpi.previous === 0) return kpi.value === 0 ? { text: '0%', direction: 'flat', good: true } : { text: 'New', direction: 'up', good: kpi.goodWhen === 'up' }
  return { text: `${Math.abs((diff / kpi.previous) * 100).toFixed(1)}%`, direction, good }
}

export function dateTime(date: Date, now: Date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000)
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diff === 0) return `Today, ${time}`
  if (diff === 1) return `Tomorrow, ${time}`
  if (diff === -1) return `Yesterday, ${time}`
  return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${time}`
}

export function timeAgo(date: Date, now: Date) {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}
