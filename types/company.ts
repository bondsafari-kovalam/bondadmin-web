/** Company ids are strings so companies created in the UI fit alongside the seeded ones. */
export type CompanyId = string

export type CompanyStatus = 'Active' | 'Inactive'

export const businessTypes = ['Adventure tourism', 'Water sports', 'Paddlesports', 'Training courses', 'Activities'] as const
export type BusinessType = (typeof businessTypes)[number]

export interface CompanyContact {
  email?: string
  phone?: string
  location?: string
}

export interface Company {
  id: CompanyId
  name: string
  /** Unique short code, e.g. "WCA". */
  code: string
  category: BusinessType
  status: CompanyStatus
  color: string
  description?: string
  contact: CompanyContact
  createdAt: Date
}

export type OfferingKind = 'Activity' | 'Course'

export interface CompanyOffering {
  companyId: CompanyId
  name: string
  kind: OfferingKind
  pricePerGuest: number
}

export interface CompanyAdmin {
  id: string
  companyId: CompanyId
  name: string
  initials: string
  email: string
  title: string
}

/** Fields the Add / Edit company form can change. */
export type CompanyInput = Pick<Company, 'name' | 'code' | 'category' | 'status'> & {
  description: string
  email: string
  phone: string
  location: string
}

/** Per-company figures for the Companies page, all derived from the same dataset. */
export interface CompanyMetrics {
  bookings: number
  revenue: number
  lastActivity: Date | null
}
