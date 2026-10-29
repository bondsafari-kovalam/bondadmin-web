// Activity & course operations. Pure functions so the store, tests and a future API layer
// share the same rules. Every write is scoped by companyId: a record is only changed when
// both its id and its owning company match.
import type { ActivityCategory, AvailabilityStatus, CatalogFormValues, CatalogItem, CatalogKind, CourseCategory, CourseLevel, Currency, Duration, PublicationStatus } from '@/types/catalog'
import type { CompanyId } from '@/types/company'

export function slugify(text: string) {
  return text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export function itemsFor<K extends CatalogKind>(items: CatalogItem[], companyId: CompanyId, kind: K) {
  return items.filter((i): i is Extract<CatalogItem, { kind: K }> => i.companyId === companyId && i.kind === kind)
}

export function updateItem(items: CatalogItem[], companyId: CompanyId, id: string, update: (item: CatalogItem) => CatalogItem): CatalogItem[] {
  return items.map((i) => (i.id === id && i.companyId === companyId ? { ...update(i), id: i.id, companyId: i.companyId, kind: i.kind } as CatalogItem : i))
}

export function removeItem(items: CatalogItem[], companyId: CompanyId, id: string) {
  return items.filter((i) => !(i.id === id && i.companyId === companyId))
}

export function setPublication(items: CatalogItem[], companyId: CompanyId, id: string, publication: PublicationStatus, now: Date) {
  return updateItem(items, companyId, id, (i) => ({ ...i, publication, updatedAt: now }))
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

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)

/** Turns validated form values into a record. `owner` carries the id, company and creation time (kept when editing). */
export function buildItem(kind: CatalogKind, values: CatalogFormValues, owner: { id: string, companyId: CompanyId, createdAt: Date }, now: Date): CatalogItem {
  const base = {
    id: owner.id,
    companyId: owner.companyId,
    name: values.name.trim(),
    slug: values.slug.trim(),
    shortDescription: values.shortDescription.trim(),
    description: values.description.trim(),
    coverImage: values.coverImage.trim() || null,
    gallery: lines(values.gallery),
    price: Number(values.price),
    currency: values.currency,
    duration: { value: Number(values.durationValue), unit: values.durationUnit },
    availability: values.availability,
    publication: values.publication,
    seoTitle: values.seoTitle.trim(),
    seoDescription: values.seoDescription.trim(),
    createdAt: owner.createdAt,
    updatedAt: now,
  }
  if (kind === 'course') {
    return {
      ...base, kind: 'course', category: values.category as CourseCategory, level: values.level as CourseLevel,
      modules: values.modules.map((t) => t.trim()).filter(Boolean).map((title, i) => ({ id: `${owner.id}-m${i + 1}`, title })),
      prerequisites: values.prerequisites.trim(), instructor: values.instructor.trim(),
    }
  }
  return {
    ...base, kind: 'activity', category: values.category as ActivityCategory,
    locations: values.locations.split(',').map((l) => l.trim()).filter(Boolean),
    capacity: values.capacity.trim() ? Number(values.capacity) : null,
  }
}

export function toFormValues(item: CatalogItem | null, kind: CatalogKind): CatalogFormValues {
  const empty: CatalogFormValues = {
    name: '', slug: '', shortDescription: '', description: '', category: '', coverImage: '', gallery: '', price: '', currency: 'INR',
    durationValue: '', durationUnit: kind === 'course' ? 'days' : 'hours', availability: 'Available', publication: 'Draft', seoTitle: '', seoDescription: '',
    locations: '', capacity: '', level: '', modules: [], prerequisites: '', instructor: '',
  }
  if (!item) return empty
  return {
    ...empty,
    name: item.name, slug: item.slug, shortDescription: item.shortDescription, description: item.description, category: item.category,
    coverImage: item.coverImage ?? '', gallery: item.gallery.join('\n'), price: String(item.price), currency: item.currency,
    durationValue: item.duration ? String(item.duration.value) : '', durationUnit: item.duration?.unit ?? empty.durationUnit,
    availability: item.availability, publication: item.publication, seoTitle: item.seoTitle, seoDescription: item.seoDescription,
    ...(item.kind === 'activity'
      ? { locations: item.locations.join(', '), capacity: item.capacity === null ? '' : String(item.capacity) }
      : { level: item.level, modules: item.modules.map((m) => m.title), prerequisites: item.prerequisites, instructor: item.instructor }),
  }
}

let sequence = 0
/** Unique, stable id for a new record; includes the owning company for easy debugging. */
export function newItemId(kind: CatalogKind, companyId: CompanyId) {
  sequence += 1
  return `${kind === 'activity' ? 'act' : 'crs'}-${companyId}-${Date.now().toString(36)}${sequence.toString(36)}`
}
