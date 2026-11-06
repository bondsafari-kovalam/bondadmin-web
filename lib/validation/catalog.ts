import { activityCategories, activityNextSteps, activityTaxonomy, availabilityStatuses, difficultyLevels, courseCategories, courseLevels, currencies, durationUnits, offeringStatuses, publicationStatuses, type CatalogFormValues, type CatalogItem, type CatalogKind } from '@/types/catalog'

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

  // Activities upload their image instead of entering a URL.
  if (kind === 'course' && v.coverImage.trim() && !IMAGE_URL.test(v.coverImage.trim())) e.coverImage = 'Use an image URL starting with https:// or a site path starting with /.'
  const gallery = kind === 'course' ? v.gallery.split('\n').map((l) => l.trim()).filter(Boolean) : []
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
    const wholeNumber = (value: string, min: number, max: number) => !value || (/^\d+$/.test(value) && Number(value) >= min && Number(value) <= max)
    if (!wholeNumber(v.totalSlots.trim(), 1, 1000)) e.totalSlots = 'Enter a whole number from 1 to 1000, or leave empty.'
    if (!wholeNumber(v.minAge.trim(), 0, 99)) e.minAge = 'Enter an age from 0 to 99, or leave empty.'
    if (!wholeNumber(v.maxAltitude.trim(), 0, 9000)) e.maxAltitude = 'Enter metres from 0 to 9000, or leave empty.'
    if (v.difficulty && !(difficultyLevels as readonly string[]).includes(v.difficulty)) e.difficulty = 'Choose a difficulty level.'

    const highlights = v.highlights.map((h) => h.trim()).filter(Boolean)
    if (highlights.length > 12) e.highlights = 'Add at most 12 highlights.'
    else if (highlights.some((h) => h.length > 120)) e.highlights = 'Each highlight must be 120 characters or fewer.'

    const allowedTags: readonly string[] = activityTaxonomy[v.category as keyof typeof activityTaxonomy] ?? []
    if (v.tags.length > 10) e.tags = 'Choose at most 10 tags.'
    else if (v.tags.some((t) => !allowedTags.includes(t))) e.tags = 'Some tags don’t belong to this master category.'

    const slots = v.timeSlots.map((t) => t.trim()).filter(Boolean)
    if (slots.length > 12) e.timeSlots = 'Add at most 12 time slots.'
    else if (slots.some((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) e.timeSlots = 'Use 24-hour times such as 06:30.'
    else if (new Set(slots).size !== slots.length) e.timeSlots = 'Each time slot can appear only once.'

    const locations = v.locations.split(',').map((l) => l.trim()).filter(Boolean)
    if (locations.length > 10) e.locations = 'Add at most 10 locations.'
    else if (locations.some((l) => l.length > 60)) e.locations = 'Each location must be 60 characters or fewer.'

    e.websiteCategory = maxLength(v.websiteCategory, 40, 'Website category')
    e.imageAlt = maxLength(v.imageAlt, 160, 'Image description')
    if (v.skillLevel && !(courseLevels as readonly string[]).includes(v.skillLevel)) e.skillLevel = 'Choose a skill level.'
    e.groupSize = maxLength(v.groupSize, 80, 'Group size')
    e.sessionFormat = maxLength(v.sessionFormat, 120, 'Session format')
    e.swimmingRequirement = maxLength(v.swimmingRequirement, 500, 'Swimming ability')
    e.healthRequirement = maxLength(v.healthRequirement, 500, 'Physical & health')
    e.safetyEquipment = maxLength(v.safetyEquipment, 1000, 'Equipment & buoyancy aids')
    e.safetySupervision = maxLength(v.safetySupervision, 1000, 'Guides & supervision')
    e.safetyWeather = maxLength(v.safetyWeather, 1000, 'Weather & session closures')

    const shortList = (values: string[], label: string) => {
      const list = values.map((x) => x.trim()).filter(Boolean)
      if (list.length > 12) return `Add at most 12 ${label}.`
      return list.some((x) => x.length > 120) ? `Each of the ${label} must be 120 characters or fewer.` : undefined
    }
    e.learningOutcomes = shortList(v.learningOutcomes, 'learning outcomes')
    e.inclusions = shortList(v.inclusions, 'inclusions')
    e.whatToBring = shortList(v.whatToBring, 'items to bring')

    const faqs = v.faqs.filter((f) => f.question.trim() || f.answer.trim())
    if (faqs.length > 12) e.faqs = 'Add at most 12 FAQs.'
    else if (faqs.some((f) => !f.question.trim())) e.faqs = 'Each answer needs a question.'
    else if (faqs.some((f) => f.question.trim().length > 160 || f.answer.trim().length > 1000)) e.faqs = 'Keep questions to 160 characters and answers to 1000.'

    if (v.relatedSlugs.length > 6) e.relatedSlugs = 'Choose at most 6 related activities.'
    if (v.nextSteps.some((s) => !(s in activityNextSteps))) e.nextSteps = 'Choose a listed next step.'

    const offerings = v.offerings.filter((o) => o.locationSlug.trim() || o.price.trim() || o.duration.trim() || o.meetingPoint.trim())
    const offeringSlugs = offerings.map((o) => o.locationSlug.trim())
    if (offerings.length > 20) e.offerings = 'Add at most 20 locations.'
    else if (offeringSlugs.some((s) => !s)) e.offerings = 'Each row needs a location slug.'
    else if (offeringSlugs.some((s) => !SLUG.test(s) || s.length > 80)) e.offerings = 'Location slugs use lowercase letters, numbers and single hyphens.'
    else if (new Set(offeringSlugs).size !== offeringSlugs.length) e.offerings = 'Each location can appear only once.'
    else if (offerings.some((o) => !offeringStatuses.includes(o.status))) e.offerings = 'Choose a status for each location.'
    else if (offerings.some((o) => o.price.trim() && (!MONEY.test(o.price.trim()) || Number(o.price) > 10_000_000))) e.offerings = 'Enter each price as a number with up to 2 decimal places.'
    else if (offerings.some((o) => o.duration.trim().length > 40 || o.meetingPoint.trim().length > 120)) e.offerings = 'Keep durations to 40 characters and meeting points to 120.'
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
