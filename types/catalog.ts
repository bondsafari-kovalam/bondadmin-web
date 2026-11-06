import type { CompanyId } from '@/types/company'

export const publicationStatuses = ['Draft', 'Published'] as const
export type PublicationStatus = (typeof publicationStatuses)[number]

export const availabilityStatuses = ['Available', 'Seasonal', 'Unavailable'] as const
export type AvailabilityStatus = (typeof availabilityStatuses)[number]

export const currencies = ['INR', 'USD', 'EUR'] as const
export type Currency = (typeof currencies)[number]

export const durationUnits = ['minutes', 'hours', 'days', 'weeks'] as const
export type DurationUnit = (typeof durationUnits)[number]

/**
 * Activity master categories and the tags each offers. Copy of the backend list
 * (backend src/modules/catalog/catalog.taxonomy.ts), which is what validation uses.
 */
export const activityTaxonomy = {
  Adventure: ['Trekking', 'Hiking', 'Rappelling', 'Rock climbing', 'Zipline', 'Jungle safari', 'Cycling'],
  'Water sports': ['Scuba diving', 'Snorkelling', 'Jet ski', 'Parasailing', 'Banana boat', 'Surfing'],
  Paddlesports: ['Kayaking', 'Stand-up paddle', 'Canoeing', 'Rafting'],
  'Tours & cruises': ['Island hopping', 'Backwater cruise', 'Sunset cruise', 'Boat tour', 'Sightseeing'],
  Camping: ['Overnight camp', 'Glamping', 'Bonfire', 'Stargazing'],
  Other: ['Wellness', 'Photography', 'Cultural', 'Workshop'],
} as const

export type ActivityCategory = keyof typeof activityTaxonomy
export const activityCategories = Object.keys(activityTaxonomy) as ActivityCategory[]

export const difficultyLevels = ['Easy', 'Moderate', 'Challenging', 'Extreme'] as const
export type DifficultyLevel = (typeof difficultyLevels)[number]

/** Index + 1 is the month number stored by the API (1 = January). */
export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export interface GalleryImage { id: string, url: string }

/** Uploaded itinerary PDF. */
export interface ItineraryFile { url: string, fileName: string, sizeBytes: number }

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
  /** Cover image (activity) or thumbnail (course): an https URL or site path, or null. For activities an uploaded image takes its place. */
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
  /** Master category. */
  category: ActivityCategory
  /** Tags from the master category's list. */
  tags: string[]
  locations: string[]
  /** Seats per time slot, if limited. */
  totalSlots: number | null
  highlights: string[]
  /** Daily start times, "HH:MM" 24h, sorted. */
  timeSlots: string[]
  minAge: number | null
  /** Metres. */
  maxAltitude: number | null
  difficulty: DifficultyLevel | null
  /** 1 = January … 12 = December, sorted. */
  bestSeasonMonths: number[]
  /** Absolute URL of the uploaded image, if any (also used as `coverImage`). */
  imageUrl: string | null
  /** Uploaded gallery images in display order (absolute URLs; also listed in `gallery`). */
  galleryImages: GalleryImage[]
  itinerary: ItineraryFile | null
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
  imageUrl: string | null
  galleryImages: GalleryImage[]
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
  totalSlots: string
  highlights: string[]
  tags: string[]
  timeSlots: string[]
  minAge: string
  maxAltitude: string
  difficulty: string
  bestSeasonMonths: number[]
  // Course only
  level: string
  modules: string[]
  prerequisites: string
  instructor: string
}
