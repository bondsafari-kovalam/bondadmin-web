// Demo data only. Generated deterministically so every view of the dashboard
// shows the same numbers. Replace with real API data when the backend is ready.
import { inactiveSince, offerings, seedCompanies } from '@/lib/mock/companies'
import type { Company } from '@/types/company'
import type { Booking, BookingStatus, DemoUser, Enquiry, EnquirySource, EnquiryStage, PaymentStatus, Role, SalesRep } from '@/types/dashboard'

/** Fixed "now" so the demo is reproducible: 29 Oct 2026, 10:30 local time. */
export const DEMO_NOW = new Date(2026, 9, 29, 10, 30)

const DAY = 86_400_000
const HISTORY_DAYS = 100

/** Seed companies the demo history is generated for. */
export const companies = seedCompanies

/** Average new bookings and enquiries per day, and long-run enquiry conversion. */
const volume: Record<string, { bookings: number, enquiries: number, conversion: number }> = {
  wca: { bookings: 16, enquiries: 6.2, conversion: 0.42 },
  asc: { bookings: 12.5, enquiries: 4.8, conversion: 0.38 },
  pnc: { bookings: 9.7, enquiries: 3.1, conversion: 0.36 },
  st: { bookings: 7.1, enquiries: 2.7, conversion: 0.31 },
  bh: { bookings: 6.2, enquiries: 2.4, conversion: 0.35 },
  ck: { bookings: 5, enquiries: 2, conversion: 0.29 },
  th: { bookings: 4.2, enquiries: 1.6, conversion: 0.27 },
}

export const salesReps: SalesRep[] = [
  { id: 'r1', name: 'Priya Nair', initials: 'PN', companyIds: ['wca', 'asc'] },
  { id: 'r2', name: 'Dev Patel', initials: 'DP', companyIds: ['pnc', 'st'] },
  { id: 'r3', name: 'Anika Shah', initials: 'AS', companyIds: ['bh', 'ck', 'th'] },
  { id: 'r4', name: 'Rahul Menon', initials: 'RM', companyIds: ['wca', 'bh'] },
]

export const demoUsers: Record<Role, DemoUser> = {
  owner: { role: 'owner', name: 'Alex Kumar', initials: 'AK', title: 'Owner · Super Admin', companyIds: 'all' },
  companyAdmin: { role: 'companyAdmin', name: 'Meera Iyer', initials: 'MI', title: 'Company Admin · Aqua Sports', companyIds: ['asc'] },
  sales: { role: 'sales', name: 'Priya Nair', initials: 'PN', title: 'Sales Team', companyIds: ['wca', 'asc'], repId: 'r1' },
}

const firstNames = ['Arjun', 'Sarah', 'Rohan', 'Maya', 'Noah', 'Ishaan', 'Kavya', 'Liam', 'Ananya', 'Vikram', 'Emma', 'Aditya', 'Sneha', 'Oliver', 'Diya', 'Karthik', 'Zara', 'Nikhil', 'Leah', 'Rahul', 'Aisha', 'Ethan', 'Meera', 'Sanjay', 'Chloe', 'Varun', 'Nisha', 'Lucas', 'Tara', 'Farhan']
const lastNames = ['Mehta', 'Williams', 'Kapoor', 'Fernandes', 'Thompson', 'Reddy', 'Menon', 'Iyer', 'Brown', 'Joseph', 'Pillai', 'Shah', 'Khan', 'Das', 'Nair', 'Wilson', 'George', 'Varghese', 'Singh', 'Thomas']
const sources: EnquirySource[] = ['Website', 'Website', 'Instagram', 'WhatsApp', 'WhatsApp', 'Phone', 'Walk-in']

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate() + days); return d }

function generate() {
  const rand = mulberry32(20261029)
  const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)]
  const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
  const name = () => `${pick(firstNames)} ${pick(lastNames)}`
  const atHour = (day: Date, hour: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, between(0, 59))
  /** `from + delay`, or a random earlier moment if that would be in the future. */
  const pastTime = (from: Date, delay: number) => new Date(from.getTime() + Math.min(delay, rand() * (DEMO_NOW.getTime() - from.getTime())))
  const today = startOfDay(DEMO_NOW)

  const bookings: Booking[] = []
  const enquiries: Enquiry[] = []
  let bookingSeq = 20_000
  let enquirySeq = 9_000

  for (let offset = HISTORY_DAYS; offset >= 0; offset--) {
    const day = addDays(today, -offset)
    const weekday = day.getDay()
    const dayFactor = weekday === 0 || weekday === 6 ? 1.25 : 0.92

    for (const company of companies) {
      const { bookings: bookingRate, enquiries: enquiryRate, conversion } = volume[company.id]
      const companyActivities = offerings.filter((a) => a.companyId === company.id)
      const reps = salesReps.filter((r) => r.companyIds.includes(company.id))

      const bookingCount = Math.round(bookingRate * dayFactor * (0.7 + rand() * 0.6))
      for (let i = 0; i < bookingCount; i++) {
        const createdAt = atHour(day, between(7, 22))
        if (createdAt > DEMO_NOW) continue
        const activity = pick(companyActivities)
        const guests = pick([1, 1, 2, 2, 2, 2, 3, 3, 4, 6])
        const gross = activity.pricePerGuest * guests
        const discount = rand() < 0.15 ? Math.round(gross * 0.1) : 0
        const activityDate = atHour(addDays(startOfDay(createdAt), between(1, 21)), pick([7, 9, 11, 14, 16]))
        activityDate.setMinutes(pick([0, 30]))

        let status: BookingStatus
        const r = rand()
        if (activityDate < DEMO_NOW) status = r < 0.08 ? 'Cancelled' : 'Completed'
        else status = r < 0.07 ? 'Cancelled' : r < 0.27 ? 'Pending' : 'Confirmed'

        let paymentStatus: PaymentStatus
        const p = rand()
        if (status === 'Completed') paymentStatus = 'Paid'
        else if (status === 'Confirmed') paymentStatus = p < 0.82 ? 'Paid' : p < 0.95 ? 'Pending' : 'Failed'
        else if (status === 'Pending') paymentStatus = p < 0.85 ? 'Pending' : 'Failed'
        else paymentStatus = p < 0.6 ? 'Refunded' : 'Void'

        const paidAt = paymentStatus === 'Paid' || paymentStatus === 'Refunded' ? pastTime(createdAt, between(5, 2_880) * 60_000) : null
        const refundedAt = paymentStatus === 'Refunded' && paidAt ? pastTime(paidAt, between(1, 5) * DAY) : null

        bookings.push({ id: `#BK-${++bookingSeq}`, companyId: company.id, customer: name(), activity: activity.name, createdAt, activityDate, guests, amount: gross - discount, discount, status, paymentStatus, paidAt, refundedAt })
      }

      const enquiryCount = Math.round(enquiryRate * dayFactor * (0.6 + rand() * 0.8))
      for (let i = 0; i < enquiryCount; i++) {
        const createdAt = atHour(day, between(8, 21))
        if (createdAt > DEMO_NOW) continue
        const ageDays = (DEMO_NOW.getTime() - createdAt.getTime()) / DAY
        const r = rand()
        let stage: EnquiryStage
        if (ageDays < 1) stage = r < 0.7 ? 'New' : r < 0.95 ? 'Contacted' : 'Interested'
        else if (ageDays < 4) stage = r < 0.2 ? 'New' : r < 0.6 ? 'Contacted' : r < 0.85 ? 'Interested' : r < 0.95 ? 'Converted' : 'Lost'
        else if (ageDays < 14) stage = r < 0.03 ? 'New' : r < 0.1 ? 'Contacted' : r < 0.2 ? 'Interested' : r < 0.2 + conversion * 0.9 ? 'Converted' : 'Lost'
        else stage = r < 0.03 ? 'Interested' : r < 0.03 + conversion ? 'Converted' : 'Lost'

        const open = stage === 'New' || stage === 'Contacted' || stage === 'Interested'
        const unassigned = stage === 'New' && rand() < (ageDays < 4 ? 0.4 : 0.15)
        const ownerId = unassigned ? null : pick(reps).id
        // Older open leads get rescheduled, so only a few follow-ups are overdue.
        let followUpDue = open && ownerId ? atHour(addDays(startOfDay(createdAt), between(1, 4)), 18) : null
        if (followUpDue && followUpDue < addDays(today, -2)) followUpDue = atHour(addDays(today, pick([-1, 0, 1, 2, 3, 4, 5, 6, 7, 8])), 18)

        enquiries.push({ id: `EN-${++enquirySeq}`, companyId: company.id, customer: name(), source: pick(sources), interest: pick(companyActivities).name, createdAt, stage, ownerId, followUpDue })
      }
    }
  }

  // Inactive companies stop trading on their pause date. Records are generated first and
  // dropped afterwards so the random sequence (and every other company's figures) is unchanged.
  const trading = (r: { companyId: string, createdAt: Date }) => !inactiveSince[r.companyId] || r.createdAt < inactiveSince[r.companyId]
  return { bookings: bookings.filter(trading), enquiries: enquiries.filter(trading) }
}

export interface Dataset { companies: Company[], bookings: Booking[], enquiries: Enquiry[] }
export const demoDataset: Dataset = { companies: seedCompanies, ...generate() }
export const emptyDataset: Dataset = { companies: seedCompanies, bookings: [], enquiries: [] }
