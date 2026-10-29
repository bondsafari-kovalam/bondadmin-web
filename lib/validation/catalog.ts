import { activityCategories, availabilityStatuses, courseCategories, courseLevels, currencies, durationUnits, publicationStatuses, type CatalogFormValues, type CatalogItem, type CatalogKind } from '@/types/catalog'

export type CatalogErrors = Partial<Record<keyof CatalogFormValues, string>>

const IMAGE_URL = /^(https:\/\/|http:\/\/|\/)\S+$/i
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MONEY = /^\d+(\.\d{1,2})?$/

const maxLength = (value: string, max: number, label: string) => (value.trim().length > max ? `${label} must be ${max} characters or fewer.` : undefined)

/**
 * Client-side checks for the Activity / Course forms. `siblings` are the same company's
 * records of the same kind (excluding the one being edited), for uniqueness checks.
 * The backend must validate again.
 */
export function validateCatalog(kind: CatalogKind, v: CatalogFormValues, siblings: CatalogItem[]): CatalogErrors {
  const e: CatalogErrors = {}
  const label = kind === 'activity' ? 'Activity name' : 'Course title'
  const name = v.name.trim()
  if (!name) e.name = `${label} is required.`
  else if (name.length < 3 || name.length > 80) e.name = `${label} must be 3–80 characters.`
  else if (siblings.some((s) => s.name.trim().toLowerCase() === name.toLowerCase())) e.name = `This company already has a${kind === 'activity' ? 'n activity' : ' course'} with this name.`

  const slug = v.slug.trim()
  if (!slug) e.slug = 'URL slug is required.'
  else if (!SLUG.test(slug) || slug.length > 80) e.slug = 'Use lowercase letters, numbers and single hyphens (max 80).'
  else if (siblings.some((s) => s.slug === slug)) e.slug = 'This slug is already used by this company.'

  if (!v.shortDescription.trim()) e.shortDescription = 'Short description is required.'
  else e.shortDescription = maxLength(v.shortDescription, 160, 'Short description')
  e.description = maxLength(v.description, 4000, 'Description')

  const categories: readonly string[] = kind === 'activity' ? activityCategories : courseCategories
  if (!categories.includes(v.category)) e.category = 'Choose a category.'

  if (v.coverImage.trim() && !IMAGE_URL.test(v.coverImage.trim())) e.coverImage = 'Use an image URL starting with https:// or a site path starting with /.'
  const gallery = v.gallery.split('\n').map((l) => l.trim()).filter(Boolean)
  if (gallery.length > 8) e.gallery = 'Add at most 8 gallery images.'
  else if (gallery.some((g) => !IMAGE_URL.test(g))) e.gallery = 'Each line must be an image URL (https://…) or a site path (/…).'

  const price = v.price.trim()
  if (!price) e.price = 'Price is required (use 0 for free).'
  else if (!MONEY.test(price)) e.price = 'Enter a number with up to 2 decimal places.'
  else if (Number(price) > 10_000_000) e.price = 'Price looks too high — check the amount.'
  if (!currencies.includes(v.currency)) e.currency = 'Choose a currency.'

  const duration = v.durationValue.trim()
  if (!duration) e.durationValue = 'Duration is required.'
  else if (!/^\d+(\.\d{1,2})?$/.test(duration) || Number(duration) <= 0) e.durationValue = 'Enter a number greater than 0.'
  else if (Number(duration) > 1000) e.durationValue = 'Duration must be 1000 or less.'
  if (!durationUnits.includes(v.durationUnit)) e.durationUnit = 'Choose a unit.'

  if (!availabilityStatuses.includes(v.availability)) e.availability = 'Choose availability.'
  if (!publicationStatuses.includes(v.publication)) e.publication = 'Choose a publication status.'
  e.seoTitle = maxLength(v.seoTitle, 60, 'SEO title')
  e.seoDescription = maxLength(v.seoDescription, 160, 'SEO description')

  if (kind === 'activity') {
    const capacity = v.capacity.trim()
    if (capacity && (!/^\d+$/.test(capacity) || Number(capacity) < 1 || Number(capacity) > 1000)) e.capacity = 'Enter a whole number from 1 to 1000, or leave empty.'
    const locations = v.locations.split(',').map((l) => l.trim()).filter(Boolean)
    if (locations.length > 10) e.locations = 'Add at most 10 locations.'
    else if (locations.some((l) => l.length > 60)) e.locations = 'Each location must be 60 characters or fewer.'
  } else {
    if (!(courseLevels as readonly string[]).includes(v.level)) e.level = 'Choose a level.'
    const modules = v.modules.map((m) => m.trim()).filter(Boolean)
    if (modules.length > 30) e.modules = 'Add at most 30 modules.'
    else if (modules.some((m) => m.length > 120)) e.modules = 'Module titles must be 120 characters or fewer.'
    e.prerequisites = maxLength(v.prerequisites, 1000, 'Prerequisites')
    e.instructor = maxLength(v.instructor, 80, 'Instructor')
  }

  for (const key of Object.keys(e) as (keyof CatalogFormValues)[]) if (!e[key]) delete e[key]
  return e
}
