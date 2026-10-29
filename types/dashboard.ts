import type { Company, CompanyId } from '@/types/company'

export type { Company, CompanyId }

export type BookingStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled'
export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded' | 'Void'

export interface Booking {
  id: string
  companyId: CompanyId
  customer: string
  activity: string
  createdAt: Date
  activityDate: Date
  guests: number
  /** Booking value after discount, in rupees. */
  amount: number
  discount: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  paidAt: Date | null
  refundedAt: Date | null
}

export type EnquiryStage = 'New' | 'Contacted' | 'Interested' | 'Converted' | 'Lost'
export type EnquirySource = 'Website' | 'Instagram' | 'WhatsApp' | 'Phone' | 'Walk-in'

export interface Enquiry {
  id: string
  companyId: CompanyId
  customer: string
  source: EnquirySource
  interest: string
  createdAt: Date
  stage: EnquiryStage
  ownerId: string | null
  followUpDue: Date | null
}

export interface SalesRep {
  id: string
  name: string
  initials: string
  companyIds: CompanyId[]
}

export type Role = 'owner' | 'companyAdmin' | 'sales'

export interface DemoUser {
  role: Role
  name: string
  initials: string
  title: string
  /** Companies this demo user may see; 'all' for the owner (includes companies added later). */
  companyIds: CompanyId[] | 'all'
  /** Sales rep id when the user is on the sales team. */
  repId?: string
}

export type RangeKey = 'today' | '7d' | '30d' | 'month' | 'previous'

export interface Period {
  start: Date
  /** Exclusive. */
  end: Date
  label: string
}

export interface DashboardFilters {
  role: Role
  /** 'all' or one of the companies the role can see. */
  company: CompanyId | 'all'
  range: RangeKey
}

export interface Kpi {
  key: 'bookings' | 'confirmed' | 'revenue' | 'enquiries' | 'conversion' | 'pending'
  label: string
  value: number
  /** Same metric for the previous period; null when a comparison isn't meaningful. */
  previous: number | null
  format: 'number' | 'money' | 'percent'
  /** Whether an increase is good news. */
  goodWhen: 'up' | 'down'
  definition: string
  detail?: string
}

export interface TrendPoint {
  key: string
  label: string
  bookings: number
  revenue: number
}

export interface CompanyRow {
  company: Company
  bookings: number
  revenue: number
  enquiries: number
  converted: number
  conversion: number
}

export interface PaymentSummary {
  collected: { amount: number, count: number }
  pending: { amount: number, count: number }
  failed: { amount: number, count: number }
  refunded: { amount: number, count: number }
}

export type AlertKind = 'unassigned' | 'followups' | 'confirmations' | 'payments'

export interface Alert {
  kind: AlertKind
  title: string
  description: string
  count: number
  tone: 'amber' | 'red' | 'blue'
  href: string
}

export interface RepRow {
  rep: SalesRep
  assigned: number
  converted: number
  conversion: number
  followUpsDue: number
  isCurrentUser: boolean
}

export interface ActivityEvent {
  id: string
  kind: 'booking' | 'payment' | 'refund' | 'enquiry'
  title: string
  description: string
  at: Date
}

export interface DashboardData {
  user: DemoUser
  period: Period
  previousPeriod: Period
  companies: Company[]
  kpis: Kpi[]
  trend: TrendPoint[]
  statuses: { name: BookingStatus, value: number }[]
  companyRows: CompanyRow[]
  /** Next 7 days, not affected by the date range. */
  upcoming: Booking[]
  enquiries: {
    /** Received in the selected period, newest first. */
    recent: Enquiry[]
    /** Open right now, regardless of period. */
    unassigned: Enquiry[]
    followUps: Enquiry[]
  }
  pipeline: { stage: EnquiryStage, value: number }[]
  team: RepRow[]
  payments: PaymentSummary
  alerts: Alert[]
  activity: ActivityEvent[]
}
