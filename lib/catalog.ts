// Activity & course helpers shared by the admin pages. Records are saved through the API
// (services/catalog.service.ts); these functions only filter, format and fill forms.
import type { AvailabilityStatus, CatalogFormValues, CatalogItem, CatalogKind, Currency, Duration, PublicationStatus } from '@/types/catalog'
import type { CompanyId } from '@/types/company'

export function slugify(text: string) {
  return text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export function itemsFor<K extends CatalogKind>(items: CatalogItem[], companyId: CompanyId, kind: K) {
  return items.filter((i): i is Extract<CatalogItem, { kind: K }> => i.companyId === companyId && i.kind === kind)
}

export type PublicationFilter = 'all' | PublicationStatus
export type AvailabilityFilter = 'all' | AvailabilityStatus

export function filterCatalog<T extends CatalogItem>(items: T[], query: string, publication: PublicationFilter, availability: AvailabilityFilter) {
  const q = query.trim().toLowerCase()
  return items
    .filter((i) => !q || [i.name, i.slug, i.category].some((v) => v.toLowerCase().includes(q)))
    .filter((i) => publication === 'all' || i.publication === publication)
    .filter((i) => availability === 'all' || i.availability === availability)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function formatPrice(price: number, currency: Currency) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency, maximumFractionDigits: price % 1 ? 2 : 0 }).format(price)
}

export function formatDuration(duration: Duration | null) {
  if (!duration) return 'Not set'
  const unit = duration.value === 1 ? duration.unit.replace(/s$/, '') : duration.unit
  return `${duration.value} ${unit}`
}

export function toFormValues(item: CatalogItem | null, kind: CatalogKind): CatalogFormValues {
  const empty: CatalogFormValues = {
    name: '', slug: '', shortDescription: '', description: '', category: '', coverImage: '', gallery: '', price: '', currency: 'INR',
    durationValue: '', durationUnit: kind === 'course' ? 'days' : 'hours', availability: 'Available', publication: 'Draft', seoTitle: '', seoDescription: '',
    locations: '', totalSlots: '', highlights: [], tags: [], timeSlots: [], minAge: '', maxAltitude: '', difficulty: '', bestSeasonMonths: [],
    websiteCategory: '', imageAlt: '', featured: false, skillLevel: '', groupSize: '', sessionFormat: '', swimmingRequirement: '', healthRequirement: '',
    learningOutcomes: [], inclusions: [], whatToBring: [], safetyEquipment: '', safetySupervision: '', safetyWeather: '', faqs: [], relatedSlugs: [], nextSteps: [], offerings: [],
    level: '', modules: [], prerequisites: '', instructor: '',
  }
  if (!item) return empty
  return {
    ...empty,
    name: item.name, slug: item.slug, shortDescription: item.shortDescription, description: item.description, category: item.category,
    // Activity gallery images are uploaded files, not typed URLs.
    coverImage: item.coverImage ?? '', gallery: item.kind === 'course' ? item.gallery.join('\n') : '', price: String(item.price), currency: item.currency,
    durationValue: item.duration ? String(item.duration.value) : '', durationUnit: item.duration?.unit ?? empty.durationUnit,
    availability: item.availability, publication: item.publication, seoTitle: item.seoTitle, seoDescription: item.seoDescription,
    ...(item.kind === 'activity'
      ? {
        locations: item.locations.join(', '), totalSlots: item.totalSlots === null ? '' : String(item.totalSlots),
        highlights: item.highlights, tags: item.tags, timeSlots: item.timeSlots,
        minAge: item.minAge === null ? '' : String(item.minAge), maxAltitude: item.maxAltitude === null ? '' : String(item.maxAltitude),
        difficulty: item.difficulty ?? '', bestSeasonMonths: item.bestSeasonMonths,
        websiteCategory: item.websiteCategory, imageAlt: item.imageAlt, featured: item.featured, skillLevel: item.skillLevel ?? '',
        groupSize: item.groupSize, sessionFormat: item.sessionFormat, swimmingRequirement: item.swimmingRequirement, healthRequirement: item.healthRequirement,
        learningOutcomes: item.learningOutcomes, inclusions: item.inclusions, whatToBring: item.whatToBring,
        safetyEquipment: item.safetyEquipment, safetySupervision: item.safetySupervision, safetyWeather: item.safetyWeather,
        faqs: item.faqs, relatedSlugs: item.relatedSlugs, nextSteps: item.nextSteps,
        offerings: item.offerings.map((o) => ({ ...o, price: o.price === null ? '' : String(o.price) })),
      }
      : { level: item.level, modules: item.modules.map((m) => m.title), prerequisites: item.prerequisites, instructor: item.instructor }),
  }
}
