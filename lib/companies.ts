import { getPeriods } from '@/lib/dashboard'
import { companyAdmins } from '@/lib/mock/companies'
import { DEMO_NOW, salesReps, type Dataset } from '@/lib/mock/dashboard-data'
import type { Company, CompanyId, CompanyMetrics } from '@/types/company'
import type { Booking } from '@/types/dashboard'

/** Companies page figures use the same rolling window and definitions as the Overview default. */
export const COMPANY_METRICS_RANGE = '30d' as const

export interface CompanyRecord {
  company: Company
  metrics: CompanyMetrics
}

export interface CompanySummary {
  total: number
  active: number
  bookings: number
  revenue: number
}

export function getCompanyRecords(companies: Company[], dataset: Dataset, now = DEMO_NOW): CompanyRecord[] {
  const { period } = getPeriods(COMPANY_METRICS_RANGE, now)
  const metrics = new Map<CompanyId, CompanyMetrics>(companies.map((c) => [c.id, { bookings: 0, revenue: 0, lastActivity: null }]))
  const touch = (id: CompanyId, at: Date | null) => {
    const m = metrics.get(id)
    if (m && at && at <= now && (!m.lastActivity || at > m.lastActivity)) m.lastActivity = at
  }

  for (const b of dataset.bookings) {
    const m = metrics.get(b.companyId)
    if (!m) continue
    if (b.createdAt >= period.start && b.createdAt < period.end) {
      m.bookings += 1
      // Booked revenue: non-cancelled bookings, after discounts (same as the Overview KPI).
      if (b.status !== 'Cancelled') m.revenue += b.amount
    }
    touch(b.companyId, b.createdAt)
    touch(b.companyId, b.paidAt)
    touch(b.companyId, b.refundedAt)
  }
  for (const e of dataset.enquiries) touch(e.companyId, e.createdAt)

  return companies.map((company) => ({ company, metrics: metrics.get(company.id)! }))
}

export function summarize(records: CompanyRecord[]): CompanySummary {
  return records.reduce((s, r) => ({
    total: s.total + 1,
    active: s.active + (r.company.status === 'Active' ? 1 : 0),
    bookings: s.bookings + r.metrics.bookings,
    revenue: s.revenue + r.metrics.revenue,
  }), { total: 0, active: 0, bookings: 0, revenue: 0 })
}

export function getCompanyProfile(id: CompanyId, dataset: Dataset, bookingLimit = 6) {
  const recentBookings: Booking[] = dataset.bookings
    .filter((b) => b.companyId === id && b.createdAt <= DEMO_NOW)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, bookingLimit)
  return {
    admins: companyAdmins.filter((a) => a.companyId === id),
    reps: salesReps.filter((r) => r.companyIds.includes(id)),
    recentBookings,
  }
}

export type StatusFilter = 'all' | 'Active' | 'Inactive'
export type CompanySortKey = 'name' | 'category' | 'status' | 'bookings' | 'revenue' | 'lastActivity'
export interface CompanySort { key: CompanySortKey, desc: boolean }

/** Search (name or code), status filter and sort, applied in that order. */
export function filterCompanies(records: CompanyRecord[], query: string, status: StatusFilter, sort: CompanySort) {
  const q = query.trim().toLowerCase()
  const value = (r: CompanyRecord): string | number => {
    switch (sort.key) {
      case 'name': return r.company.name.toLowerCase()
      case 'category': return r.company.category
      case 'status': return r.company.status
      case 'bookings': return r.metrics.bookings
      case 'revenue': return r.metrics.revenue
      case 'lastActivity': return r.metrics.lastActivity?.getTime() ?? 0
    }
  }
  return records
    .filter((r) => !q || r.company.name.toLowerCase().includes(q) || r.company.code.toLowerCase().includes(q))
    .filter((r) => status === 'all' || r.company.status === status)
    .sort((a, b) => {
      const x = value(a), y = value(b)
      const order = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
      return (sort.desc ? -order : order) || a.company.name.localeCompare(b.company.name)
    })
}
