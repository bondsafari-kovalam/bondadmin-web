import type { CompanyId } from '@/types/company'

export const publicationStatuses = ['Draft', 'Published'] as const
export type PublicationStatus = (typeof publicationStatuses)[number]

export const availabilityStatuses = ['Available', 'Seasonal', 'Unavailable'] as const
export type AvailabilityStatus = (typeof availabilityStatuses)[number]

export const currencies = ['INR', 'USD', 'EUR'] as const
export type Currency = (typeof currencies)[number]

export const durationUnits = ['minutes', 'hours', 'days', 'weeks'] as const
export type DurationUnit = (typeof durationUnits)[number]

export const activityCategories = ['Adventure', 'Water sports', 'Paddlesports', 'Tours & cruises', 'Camping', 'Other'] as const
export type ActivityCategory = (typeof activityCategories)[number]

export const courseCategories = ['Paddlesports', 'Water safety', 'Diving', 'First aid & rescue', 'Instructor training', 'Other'] as const
export type CourseCategory = (typeof courseCategories)[number]

export const courseLevels = ['Beginner', 'Intermediate', 'Advanced', 'All levels'] as const
export type CourseLevel = (typeof courseLevels)[number]

export type CatalogKind = 'activity' | 'course'

export interface Duration { value: number, unit: DurationUnit }

/** Fields shared by activities and courses. Every record belongs to exactly one company. */
interface CatalogItemBase {
  id: string
  companyId: CompanyId
  /** Activity name or course title. */
  name: string
  /** URL slug, unique per company and kind. */
  slug: string
  shortDescription: string
  description: string
  /** Cover image (activity) or thumbnail (course): an https URL or site path, or null. */
  coverImage: string | null
  gallery: string[]
  price: number
  currency: Currency
  /** Null until the company provides it. */
  duration: Duration | null
  availability: AvailabilityStatus
  publication: PublicationStatus
  seoTitle: string
  seoDescription: string
  createdAt: Date
  updatedAt: Date
}

export interface Activity extends CatalogItemBase {
  kind: 'activity'
  category: ActivityCategory
  locations: string[]
  /** Participant limit per session, if the activity has one. */
  capacity: number | null
}

export interface CourseModule { id: string, title: string }

export interface Course extends CatalogItemBase {
  kind: 'course'
  category: CourseCategory
  level: CourseLevel
  /** Optional — not every course has a modular curriculum. */
  modules: CourseModule[]
  prerequisites: string
  instructor: string
}

export type CatalogItem = Activity | Course

/** Raw form values (strings, as typed) for the Activity and Course forms. Kind-specific fields are ignored by the other kind. */
export interface CatalogFormValues {
  name: string
  slug: string
  shortDescription: string
  description: string
  category: string
  coverImage: string
  /** One image URL per line. */
  gallery: string
  price: string
  currency: Currency
  durationValue: string
  durationUnit: DurationUnit
  availability: AvailabilityStatus
  publication: PublicationStatus
  seoTitle: string
  seoDescription: string
  // Activity only
  /** Comma-separated. */
  locations: string
  capacity: string
  // Course only
  level: string
  modules: string[]
  prerequisites: string
  instructor: string
}
