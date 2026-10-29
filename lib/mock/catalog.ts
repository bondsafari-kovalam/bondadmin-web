// Demo data only. Built from the existing demo offerings so names and prices match the
// generated booking history. Durations, images, capacities and descriptions are left empty
// on purpose — they must come from each company, not be invented here.
import { offerings, seedCompanies } from '@/lib/mock/companies'
import { slugify } from '@/lib/catalog'
import type { Activity, ActivityCategory, CatalogItem, Course, CourseCategory, CourseLevel } from '@/types/catalog'

const SEEDED_AT = new Date(2026, 9, 1)
const DEMO_DESCRIPTION = 'Demo record — replace with the company’s own description.'

const activityCategoryByCompany: Record<string, ActivityCategory> = { wca: 'Adventure', asc: 'Water sports', pnc: 'Paddlesports', bh: 'Tours & cruises', ck: 'Paddlesports', th: 'Adventure' }
const courseDetails: Record<string, { category: CourseCategory, level: CourseLevel }> = {
  'SUP Lesson': { category: 'Paddlesports', level: 'Beginner' },
  'Level 2 Sea Kayak': { category: 'Paddlesports', level: 'Intermediate' },
  'Outdoor First Aid': { category: 'First aid & rescue', level: 'All levels' },
}
/** One draft so the publish workflow is visible in the demo. */
const draftNames = new Set(['Night Paddle'])

export const seedCatalog: CatalogItem[] = offerings.map((o): CatalogItem => {
  const company = seedCompanies.find((c) => c.id === o.companyId)!
  const slug = slugify(o.name)
  const base = {
    companyId: o.companyId,
    name: o.name,
    slug,
    shortDescription: DEMO_DESCRIPTION,
    description: '',
    coverImage: null,
    gallery: [],
    price: o.pricePerGuest,
    currency: 'INR' as const,
    duration: null,
    availability: company.status === 'Inactive' ? 'Unavailable' as const : 'Available' as const,
    publication: draftNames.has(o.name) ? 'Draft' as const : 'Published' as const,
    seoTitle: '',
    seoDescription: '',
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  }
  if (o.kind === 'Course') {
    const course: Course = { ...base, id: `crs-${o.companyId}-${slug}`, kind: 'course', ...courseDetails[o.name], modules: [], prerequisites: '', instructor: '' }
    return course
  }
  const activity: Activity = { ...base, id: `act-${o.companyId}-${slug}`, kind: 'activity', category: activityCategoryByCompany[o.companyId] ?? 'Other', locations: company.contact.location ? [company.contact.location] : [], capacity: null }
  return activity
})
