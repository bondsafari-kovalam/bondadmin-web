import { DEMO_NOW, demoDataset, demoUsers, salesReps, type Dataset } from '@/lib/mock/dashboard-data'
import { canAccessCompany, visibleCompanies } from '@/lib/permissions'
import type { ActivityEvent, Alert, Booking, BookingStatus, CompanyRow, DashboardData, DashboardFilters, Enquiry, EnquiryStage, Kpi, Period, RangeKey, RepRow, TrendPoint } from '@/types/dashboard'

const DAY = 86_400_000
const HOUR = 3_600_000
const UPCOMING_DAYS = 7

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const addDays = (date: Date, days: number) => { const d = new Date(date); d.setDate(d.getDate() + days); return d }
const inPeriod = (date: Date, period: Period) => date >= period.start && date < period.end
const shortDate = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
const isOpen = (enquiry: Enquiry) => enquiry.stage === 'New' || enquiry.stage === 'Contacted' || enquiry.stage === 'Interested'

export const rangeLabels: Record<RangeKey, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  month: 'This month',
  previous: 'Previous month',
}

/** Current and comparison periods. "Today" and "This month" are compared to the same elapsed time before. */
export function getPeriods(range: RangeKey, now = DEMO_NOW): { period: Period, previousPeriod: Period } {
  const today = startOfDay(now)
  const tomorrow = addDays(today, 1)
  const label = (start: Date, end: Date) => `${shortDate(start)} – ${shortDate(new Date(end.getTime() - 1))}`

  if (range === 'today') {
    const yesterday = addDays(today, -1)
    return {
      period: { start: today, end: now, label: `Today, until ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` },
      previousPeriod: { start: yesterday, end: new Date(yesterday.getTime() + (now.getTime() - today.getTime())), label: 'yesterday at this time' },
    }
  }
  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30
    const start = addDays(tomorrow, -days)
    const previousStart = addDays(start, -days)
    return { period: { start, end: now, label: label(start, tomorrow) }, previousPeriod: { start: previousStart, end: start, label: `previous ${days} days` } }
  }
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  if (range === 'month') {
    const previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const previousEnd = new Date(previousStart.getTime() + (now.getTime() - monthStart.getTime()))
    return { period: { start: monthStart, end: now, label: label(monthStart, tomorrow) }, previousPeriod: { start: previousStart, end: previousEnd, label: 'same point last month' } }
  }
  const previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const twoMonthsBack = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  return { period: { start: previousStart, end: monthStart, label: label(previousStart, monthStart) }, previousPeriod: { start: twoMonthsBack, end: previousStart, label: 'the month before' } }
}

function sum<T>(items: T[], value: (item: T) => number) { return items.reduce((total, item) => total + value(item), 0) }
const isRevenue = (b: Booking) => b.status !== 'Cancelled'
const isConfirmed = (b: Booking) => b.status === 'Confirmed' || b.status === 'Completed'
const conversionOf = (items: Enquiry[]) => items.length ? (items.filter((e) => e.stage === 'Converted').length / items.length) * 100 : 0

function buildTrend(bookings: Booking[], period: Period, range: RangeKey): TrendPoint[] {
  const points: TrendPoint[] = []
  const hourly = range === 'today'
  // Hourly buckets for "today", daily buckets otherwise (addDays keeps DST-safe day boundaries).
  for (let start = period.start; start < period.end; start = hourly ? new Date(start.getTime() + HOUR) : addDays(start, 1)) {
    const label = hourly ? `${String(start.getHours()).padStart(2, '0')}:00` : start.getTime() === startOfDay(period.end).getTime() ? 'Today' : shortDate(start)
    points.push({ key: start.toISOString(), label, bookings: 0, revenue: 0 })
  }
  for (const b of bookings) {
    const index = hourly
      ? Math.floor((b.createdAt.getTime() - period.start.getTime()) / HOUR)
      : Math.round((startOfDay(b.createdAt).getTime() - period.start.getTime()) / DAY)
    const point = points[index]
    if (!point) continue
    point.bookings += 1
    if (isRevenue(b)) point.revenue += b.amount
  }
  return points
}

export function getDashboardData(filters: DashboardFilters, dataset: Dataset = demoDataset, now = DEMO_NOW): DashboardData {
  const user = demoUsers[filters.role]
  const allowed = visibleCompanies(user, dataset.companies)
  const scoped = filters.company === 'all' || !canAccessCompany(user, filters.company) ? allowed : allowed.filter((c) => c.id === filters.company)
  const scopeIds = new Set(scoped.map((c) => c.id))
  const { period, previousPeriod } = getPeriods(filters.range, now)
  const todayEnd = addDays(startOfDay(now), 1)

  const scopedBookings = dataset.bookings.filter((b) => scopeIds.has(b.companyId))
  const companyEnquiries = dataset.enquiries.filter((e) => scopeIds.has(e.companyId))
  // Sales users work their own leads plus the unassigned pool.
  const scopedEnquiries = user.repId ? companyEnquiries.filter((e) => e.ownerId === user.repId || e.ownerId === null) : companyEnquiries

  const bookings = scopedBookings.filter((b) => inPeriod(b.createdAt, period))
  const previousBookings = scopedBookings.filter((b) => inPeriod(b.createdAt, previousPeriod))
  const enquiries = scopedEnquiries.filter((e) => inPeriod(e.createdAt, period))
  const previousEnquiries = scopedEnquiries.filter((e) => inPeriod(e.createdAt, previousPeriod))

  const pendingBookings = bookings.filter((b) => isRevenue(b) && b.paymentStatus === 'Pending')
  const isSales = filters.role === 'sales'
  const kpis: Kpi[] = [
    { key: 'bookings', label: 'Total bookings', value: bookings.length, previous: previousBookings.length, format: 'number', goodWhen: 'up', definition: 'Bookings created in the period, in any status (including cancelled).' },
    { key: 'confirmed', label: 'Confirmed bookings', value: bookings.filter(isConfirmed).length, previous: previousBookings.filter(isConfirmed).length, format: 'number', goodWhen: 'up', definition: 'Bookings created in the period that are confirmed or already completed.' },
    { key: 'revenue', label: 'Booked revenue', value: sum(bookings.filter(isRevenue), (b) => b.amount), previous: sum(previousBookings.filter(isRevenue), (b) => b.amount), format: 'money', goodWhen: 'up', definition: 'Value of non-cancelled bookings created in the period, after discounts. Includes amounts not yet collected; refunds are excluded because refunded bookings are cancelled.' },
    { key: 'enquiries', label: 'New enquiries', value: enquiries.length, previous: previousEnquiries.length, format: 'number', goodWhen: 'up', definition: isSales ? 'Enquiries received in the period that are assigned to you or unassigned.' : 'Enquiries received in the period, from all sources.' },
    { key: 'conversion', label: 'Enquiry conversion', value: conversionOf(enquiries), previous: conversionOf(previousEnquiries), format: 'percent', goodWhen: 'up', definition: 'Share of enquiries received in the period that have become a booking. Recent periods read lower because newer enquiries are still open. Walk-in and direct bookings have no enquiry, so bookings can exceed enquiries.' },
    { key: 'pending', label: 'Pending payments', value: sum(pendingBookings, (b) => b.amount), previous: null, format: 'money', goodWhen: 'down', definition: 'Unpaid amount on non-cancelled bookings created in the period, as of now. Failed payments are counted separately in Payments.', detail: `${pendingBookings.length} ${pendingBookings.length === 1 ? 'booking' : 'bookings'} awaiting payment` },
  ]

  const statusOrder: BookingStatus[] = ['Confirmed', 'Pending', 'Completed', 'Cancelled']
  const statuses = statusOrder.map((name) => ({ name, value: bookings.filter((b) => b.status === name).length }))

  const companyRows: CompanyRow[] = scoped.map((company) => {
    const companyBookings = bookings.filter((b) => b.companyId === company.id)
    const companyLeads = enquiries.filter((e) => e.companyId === company.id)
    const converted = companyLeads.filter((e) => e.stage === 'Converted').length
    return { company, bookings: companyBookings.length, revenue: sum(companyBookings.filter(isRevenue), (b) => b.amount), enquiries: companyLeads.length, converted, conversion: conversionOf(companyLeads) }
  })

  const upcomingEnd = new Date(now.getTime() + UPCOMING_DAYS * DAY)
  const upcoming = scopedBookings
    .filter((b) => b.status !== 'Cancelled' && b.activityDate >= now && b.activityDate < upcomingEnd)
    .sort((a, b) => a.activityDate.getTime() - b.activityDate.getTime())

  const openNow = scopedEnquiries.filter(isOpen)
  const unassigned = openNow.filter((e) => e.ownerId === null).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const followUps = openNow.filter((e) => e.ownerId && e.followUpDue && e.followUpDue < todayEnd).sort((a, b) => a.followUpDue!.getTime() - b.followUpDue!.getTime())
  const overdue = followUps.filter((e) => e.followUpDue! < startOfDay(now)).length

  const stages: EnquiryStage[] = ['New', 'Contacted', 'Interested', 'Converted', 'Lost']
  const pipeline = stages.map((stage) => ({ stage, value: enquiries.filter((e) => e.stage === stage).length }))

  const periodCompanyEnquiries = companyEnquiries.filter((e) => inPeriod(e.createdAt, period))
  const team: RepRow[] = salesReps
    .filter((rep) => rep.companyIds.some((id) => scopeIds.has(id)))
    .map((rep) => {
      const assigned = periodCompanyEnquiries.filter((e) => e.ownerId === rep.id)
      return {
        rep,
        assigned: assigned.length,
        converted: assigned.filter((e) => e.stage === 'Converted').length,
        conversion: conversionOf(assigned),
        followUpsDue: companyEnquiries.filter((e) => isOpen(e) && e.ownerId === rep.id && e.followUpDue && e.followUpDue < todayEnd).length,
        isCurrentUser: rep.id === user.repId,
      }
    })
    .sort((a, b) => b.converted - a.converted)

  const byStatus = (status: Booking['paymentStatus']) => bookings.filter((b) => isRevenue(b) && b.paymentStatus === status)
  const refunded = bookings.filter((b) => b.paymentStatus === 'Refunded')
  const payments = {
    collected: { amount: sum(byStatus('Paid'), (b) => b.amount), count: byStatus('Paid').length },
    pending: { amount: sum(byStatus('Pending'), (b) => b.amount), count: byStatus('Pending').length },
    failed: { amount: sum(byStatus('Failed'), (b) => b.amount), count: byStatus('Failed').length },
    refunded: { amount: sum(refunded, (b) => b.amount), count: refunded.length },
  }

  const awaitingConfirmation = scopedBookings.filter((b) => b.status === 'Pending' && b.activityDate >= now)
  const failedUpcoming = scopedBookings.filter((b) => b.status !== 'Cancelled' && b.paymentStatus === 'Failed' && b.activityDate >= now)
  const plural = (n: number, word: string, words = `${word}s`) => `${n} ${n === 1 ? word : words}`
  const alerts: Alert[] = ([
    { kind: 'unassigned', title: 'Unassigned enquiries', description: `${plural(unassigned.length, 'open enquiry', 'open enquiries')} without an owner`, count: unassigned.length, tone: 'amber', href: '/#enquiries' },
    { kind: 'followups', title: isSales ? 'Your follow-ups' : 'Follow-ups due', description: `${plural(followUps.length - overdue, 'follow-up')} due today${overdue ? `, ${overdue} overdue` : ''}`, count: followUps.length, tone: 'red', href: '/#enquiries' },
    { kind: 'confirmations', title: 'Pending confirmations', description: `${plural(awaitingConfirmation.length, 'upcoming booking')} awaiting confirmation`, count: awaitingConfirmation.length, tone: 'blue', href: '/#upcoming-bookings' },
    { kind: 'payments', title: 'Failed payments', description: `${plural(failedUpcoming.length, 'upcoming booking')} with a failed payment`, count: failedUpcoming.length, tone: 'red', href: '/#payments' },
  ] satisfies Alert[]).filter((a) => a.count > 0 && !(isSales && a.kind === 'payments'))

  const companyName = (id: string) => dataset.companies.find((c) => c.id === id)?.code ?? id
  const repName = (id: string | null) => salesReps.find((r) => r.id === id)?.name ?? 'Unassigned'
  const events: ActivityEvent[] = []
  for (const b of scopedBookings) {
    events.push({ id: `${b.id}-c`, kind: 'booking', title: 'New booking', description: `${b.id} · ${b.activity} · ${companyName(b.companyId)}`, at: b.createdAt })
    if (!isSales && b.paidAt) events.push({ id: `${b.id}-p`, kind: 'payment', title: 'Payment received', description: `${b.id} · ₹${b.amount.toLocaleString('en-IN')}`, at: b.paidAt })
    if (!isSales && b.refundedAt) events.push({ id: `${b.id}-r`, kind: 'refund', title: 'Refund issued', description: `${b.id} · ₹${b.amount.toLocaleString('en-IN')}`, at: b.refundedAt })
  }
  for (const e of scopedEnquiries) events.push({ id: e.id, kind: 'enquiry', title: 'New enquiry', description: `${e.customer} · ${e.source} · ${repName(e.ownerId)}`, at: e.createdAt })
  const activity = events.filter((e) => e.at <= now).sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 6)

  return {
    user,
    period,
    previousPeriod,
    companies: scoped,
    kpis: isSales ? kpis.filter((k) => k.key !== 'revenue' && k.key !== 'pending') : kpis,
    trend: buildTrend(bookings, period, filters.range),
    statuses,
    companyRows,
    upcoming,
    enquiries: { recent: [...enquiries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), unassigned, followUps },
    pipeline,
    team,
    payments,
    alerts,
    activity,
  }
}
