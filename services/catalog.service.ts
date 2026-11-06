import { API_URL, apiClient } from '@/lib/api/client'
import type { ApiEnvelope, ApiPage } from '@/lib/api/types'
import { toFormValues } from '@/lib/catalog'
import type { ActivityCategory, ActivityWebsiteFields, AvailabilityStatus, CatalogFormValues, CatalogItem, CatalogKind, CourseCategory, CourseLevel, Currency, DifficultyLevel, DurationUnit, OfferingStatus, PublicationStatus } from '@/types/catalog'

// ---- API shapes (backend `Activity` / `Course` schemas) ------------------------------

type PublicationDto = 'DRAFT' | 'PUBLISHED'
type AvailabilityDto = 'AVAILABLE' | 'SEASONAL' | 'UNAVAILABLE'
type DurationUnitDto = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS'
type CourseLevelDto = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS'
type DifficultyDto = 'EASY' | 'MODERATE' | 'CHALLENGING' | 'EXTREME'
type OfferingStatusDto = 'CONFIRMED' | 'PREVIEW' | 'PLANNED'

interface CatalogItemDtoBase {
  id: string
  companyId: string
  name: string
  slug: string
  shortDescription: string
  description: string
  coverImage: string | null
  gallery: string[]
  price: number
  currency: Currency
  duration: { value: number, unit: DurationUnitDto }
  availability: AvailabilityDto
  publication: PublicationDto
  publishedAt: string | null
  seoTitle: string
  seoDescription: string
  createdAt: string
  updatedAt: string
}

/** Website fields are optional here: an API version that doesn't store them leaves them out. */
export interface ActivityDto extends CatalogItemDtoBase, Partial<Omit<ActivityWebsiteFields, 'skillLevel' | 'offerings'>> {
  skillLevel?: CourseLevelDto | null
  offerings?: { locationSlug: string, status: OfferingStatusDto, price: number | null, duration: string, meetingPoint: string }[]
  category: ActivityCategory
  locations: string[]
  totalSlots: number | null
  highlights: string[]
  tags: string[]
  timeSlots: string[]
  minAge: number | null
  maxAltitude: number | null
  difficulty: DifficultyDto | null
  bestSeasonMonths: number[]
  /** Paths relative to the API origin. */
  imageUrl: string | null
  galleryImages: { id: string, url: string }[]
  itinerary: { url: string, fileName: string, sizeBytes: number } | null
}

export interface CourseDto extends CatalogItemDtoBase {
  category: CourseCategory
  level: CourseLevelDto
  modules: string[]
  prerequisites: string
  instructor: string
  imageUrl: string | null
  galleryImages: { id: string, url: string }[]
}

/** Stored in Redux: the API record plus its kind (serializable). */
export type CatalogItemDto = ({ kind: 'activity' } & ActivityDto) | ({ kind: 'course' } & CourseDto)

// ---- Enum mapping (API UPPER_CASE ⇄ UI labels) ---------------------------------------

const publication = { DRAFT: 'Draft', PUBLISHED: 'Published' } as const satisfies Record<PublicationDto, PublicationStatus>
const availability = { AVAILABLE: 'Available', SEASONAL: 'Seasonal', UNAVAILABLE: 'Unavailable' } as const satisfies Record<AvailabilityDto, AvailabilityStatus>
const durationUnit = { MINUTES: 'minutes', HOURS: 'hours', DAYS: 'days', WEEKS: 'weeks' } as const satisfies Record<DurationUnitDto, DurationUnit>
const difficulty = { EASY: 'Easy', MODERATE: 'Moderate', CHALLENGING: 'Challenging', EXTREME: 'Extreme' } as const satisfies Record<DifficultyDto, DifficultyLevel>
const courseLevel = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced', ALL_LEVELS: 'All levels' } as const satisfies Record<CourseLevelDto, CourseLevel>
const offeringStatus = { CONFIRMED: 'Confirmed', PREVIEW: 'Preview', PLANNED: 'Planned' } as const satisfies Record<OfferingStatusDto, OfferingStatus>

const invert = <K extends string, V extends string>(map: Record<K, V>) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<V, K>
const toPublicationDto = invert(publication)
const toAvailabilityDto = invert(availability)
const toDurationUnitDto = invert(durationUnit)
const toCourseLevelDto = invert(courseLevel)
const toDifficultyDto = invert(difficulty)
const toOfferingStatusDto = invert(offeringStatus)

const apiUrl = (path: string) => new URL(path, API_URL).toString()

function toWebsiteFields(dto: ActivityDto): ActivityWebsiteFields {
  return {
    websiteCategory: dto.websiteCategory ?? '',
    imageAlt: dto.imageAlt ?? '',
    featured: dto.featured ?? false,
    skillLevel: dto.skillLevel ? courseLevel[dto.skillLevel] : null,
    groupSize: dto.groupSize ?? '',
    sessionFormat: dto.sessionFormat ?? '',
    swimmingRequirement: dto.swimmingRequirement ?? '',
    healthRequirement: dto.healthRequirement ?? '',
    learningOutcomes: dto.learningOutcomes ?? [],
    inclusions: dto.inclusions ?? [],
    whatToBring: dto.whatToBring ?? [],
    safetyEquipment: dto.safetyEquipment ?? '',
    safetySupervision: dto.safetySupervision ?? '',
    safetyWeather: dto.safetyWeather ?? '',
    faqs: dto.faqs ?? [],
    relatedSlugs: dto.relatedSlugs ?? [],
    nextSteps: dto.nextSteps ?? [],
    offerings: (dto.offerings ?? []).map((o) => ({ ...o, status: offeringStatus[o.status] })),
  }
}

export function toCatalogItem(dto: CatalogItemDto): CatalogItem {
  const base = {
    id: dto.id,
    companyId: dto.companyId,
    name: dto.name,
    slug: dto.slug,
    shortDescription: dto.shortDescription,
    description: dto.description,
    coverImage: dto.coverImage,
    gallery: dto.gallery,
    price: dto.price,
    currency: dto.currency,
    duration: { value: dto.duration.value, unit: durationUnit[dto.duration.unit] },
    availability: availability[dto.availability],
    publication: publication[dto.publication],
    seoTitle: dto.seoTitle,
    seoDescription: dto.seoDescription,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  }
  if (dto.kind === 'course') {
    const imageUrl = dto.imageUrl ? apiUrl(dto.imageUrl) : null
    return {
      ...base, kind: 'course', category: dto.category, level: courseLevel[dto.level],
      modules: dto.modules.map((title, i) => ({ id: `${dto.id}-m${i + 1}`, title })),
      prerequisites: dto.prerequisites, instructor: dto.instructor,
      coverImage: imageUrl ?? dto.coverImage, imageUrl,
      galleryImages: dto.galleryImages.map((g) => ({ id: g.id, url: apiUrl(g.url) })),
      gallery: [...dto.galleryImages.map((g) => apiUrl(g.url)), ...dto.gallery],
    }
  }
  const imageUrl = dto.imageUrl ? apiUrl(dto.imageUrl) : null
  return {
    ...base, ...toWebsiteFields(dto), kind: 'activity', category: dto.category, tags: dto.tags, locations: dto.locations, totalSlots: dto.totalSlots,
    highlights: dto.highlights, timeSlots: dto.timeSlots, minAge: dto.minAge, maxAltitude: dto.maxAltitude,
    difficulty: dto.difficulty ? difficulty[dto.difficulty] : null, bestSeasonMonths: dto.bestSeasonMonths,
    // The uploaded image replaces the cover URL everywhere the admin shows a thumbnail.
    coverImage: imageUrl ?? dto.coverImage, imageUrl,
    // Uploaded images first; any gallery URLs saved before uploads existed follow them.
    galleryImages: dto.galleryImages.map((g) => ({ id: g.id, url: apiUrl(g.url) })),
    gallery: [...dto.galleryImages.map((g) => apiUrl(g.url)), ...dto.gallery],
    itinerary: dto.itinerary ? { ...dto.itinerary, url: apiUrl(dto.itinerary.url) } : null,
  }
}

const optionalNumber = (text: string) => (text.trim() ? Number(text) : null)
const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)
const cleanList = (list: string[]) => list.map((l) => l.trim()).filter(Boolean)

function websitePayload(v: CatalogFormValues) {
  return {
    websiteCategory: v.websiteCategory.trim(),
    imageAlt: v.imageAlt.trim(),
    featured: v.featured,
    skillLevel: v.skillLevel ? toCourseLevelDto[v.skillLevel as CourseLevel] : null,
    groupSize: v.groupSize.trim(),
    sessionFormat: v.sessionFormat.trim(),
    swimmingRequirement: v.swimmingRequirement.trim(),
    healthRequirement: v.healthRequirement.trim(),
    learningOutcomes: cleanList(v.learningOutcomes),
    inclusions: cleanList(v.inclusions),
    whatToBring: cleanList(v.whatToBring),
    safetyEquipment: v.safetyEquipment.trim(),
    safetySupervision: v.safetySupervision.trim(),
    safetyWeather: v.safetyWeather.trim(),
    faqs: v.faqs.map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })).filter((f) => f.question),
    relatedSlugs: v.relatedSlugs,
    nextSteps: v.nextSteps,
    offerings: v.offerings.filter((o) => o.locationSlug.trim()).map((o) => ({
      locationSlug: o.locationSlug.trim(),
      status: toOfferingStatusDto[o.status],
      price: optionalNumber(o.price),
      duration: o.duration.trim(),
      meetingPoint: o.meetingPoint.trim(),
    })),
  }
}

const noWebsiteDetails = JSON.stringify(websitePayload(toFormValues(null, 'activity')))
const hasWebsiteDetails = (v: CatalogFormValues) => JSON.stringify(websitePayload(v)) !== noWebsiteDetails

/**
 * Validated form values → request body. Every field is sent, so an edit can also clear values.
 * The exception is website details: the API rejects keys it doesn't know, so they are sent only
 * when the form or the saved record `item` has some, keeping other companies' saves unchanged.
 */
export function toCatalogPayload(kind: CatalogKind, v: CatalogFormValues, item: CatalogItem | null = null) {
  const base = {
    name: v.name.trim(),
    slug: v.slug.trim(),
    shortDescription: v.shortDescription.trim(),
    description: v.description.trim(),
    category: v.category,
    price: Number(v.price),
    currency: v.currency,
    duration: { value: Number(v.durationValue), unit: toDurationUnitDto[v.durationUnit] },
    availability: toAvailabilityDto[v.availability],
    publication: toPublicationDto[v.publication],
    seoTitle: v.seoTitle.trim(),
    seoDescription: v.seoDescription.trim(),
  }
  if (kind === 'course') {
    return {
      ...base, level: toCourseLevelDto[v.level as CourseLevel],
      modules: v.modules.map((m) => m.trim()).filter(Boolean),
      prerequisites: v.prerequisites.trim(), instructor: v.instructor.trim(),
    }
  }
  return {
    ...base,
    // Activity images and gallery are uploaded separately; coverImage and gallery URLs are not sent.
    locations: v.locations.split(',').map((l) => l.trim()).filter(Boolean),
    totalSlots: optionalNumber(v.totalSlots),
    highlights: v.highlights.map((h) => h.trim()).filter(Boolean),
    tags: v.tags,
    timeSlots: v.timeSlots.map((t) => t.trim()).filter(Boolean),
    minAge: optionalNumber(v.minAge),
    maxAltitude: optionalNumber(v.maxAltitude),
    difficulty: v.difficulty ? toDifficultyDto[v.difficulty as DifficultyLevel] : null,
    bestSeasonMonths: v.bestSeasonMonths,
    ...(hasWebsiteDetails(v) || (item && hasWebsiteDetails(toFormValues(item, kind))) ? websitePayload(v) : {}),
  }
}

export type CatalogPayload = ReturnType<typeof toCatalogPayload> | { publication: PublicationDto }

export const publicationToDto = (value: PublicationStatus) => toPublicationDto[value]

// ---- Requests --------------------------------------------------------------------------

const collection = (companyId: string, kind: CatalogKind) => `/companies/${companyId}/${kind === 'activity' ? 'activities' : 'courses'}`
const withKind = <K extends CatalogKind>(kind: K, dto: ActivityDto | CourseDto) => ({ ...dto, kind }) as CatalogItemDto

const MAX_PAGE_SIZE = 100

export type ActivityFile = 'image' | 'itinerary'

/** Upload limits enforced by the backend (activity-assets.service.ts). */
export const ACTIVITY_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const ITINERARY_MAX_BYTES = 5 * 1024 * 1024
export const GALLERY_MAX_IMAGES = 8

export const catalogService = {
  /** Every activity or course of one company, drafts included. */
  async list(companyId: string, kind: CatalogKind): Promise<CatalogItemDto[]> {
    const items: CatalogItemDto[] = []
    for (let page = 1; ; page++) {
      const res = await apiClient.get<ApiPage<ActivityDto | CourseDto>>(collection(companyId, kind), { params: { page, pageSize: MAX_PAGE_SIZE, sort: 'name' } })
      items.push(...res.data.data.map((dto) => withKind(kind, dto)))
      if (page >= res.data.meta.pagination.totalPages) return items
    }
  },

  async create(companyId: string, kind: CatalogKind, payload: CatalogPayload): Promise<CatalogItemDto> {
    const res = await apiClient.post<ApiEnvelope<ActivityDto | CourseDto>>(collection(companyId, kind), payload)
    return withKind(kind, res.data.data)
  },

  async update(companyId: string, kind: CatalogKind, id: string, payload: CatalogPayload): Promise<CatalogItemDto> {
    const res = await apiClient.patch<ApiEnvelope<ActivityDto | CourseDto>>(`${collection(companyId, kind)}/${id}`, payload)
    return withKind(kind, res.data.data)
  },

  async remove(companyId: string, kind: CatalogKind, id: string): Promise<void> {
    await apiClient.delete(`${collection(companyId, kind)}/${id}`)
  },

  /** Raw file upload; the backend checks the real type from the file's bytes. */
  async uploadActivityFile(companyId: string, id: string, file: ActivityFile, data: File): Promise<CatalogItemDto> {
    const url = `${collection(companyId, 'activity')}/${id}/${file}`
    const res = await apiClient.put<ApiEnvelope<ActivityDto>>(url, data, {
      headers: { 'Content-Type': data.type },
      ...(file === 'itinerary' ? { params: { fileName: data.name } } : {}),
    })
    return withKind('activity', res.data.data)
  },

  async addGalleryImage(companyId: string, id: string, data: File): Promise<CatalogItemDto> {
    const res = await apiClient.post<ApiEnvelope<ActivityDto>>(`${collection(companyId, 'activity')}/${id}/gallery`, data, { headers: { 'Content-Type': data.type } })
    return withKind('activity', res.data.data)
  },

  async uploadCourseImage(companyId: string, id: string, data: File): Promise<CatalogItemDto> {
    const res = await apiClient.put<ApiEnvelope<CourseDto>>(`${collection(companyId, 'course')}/${id}/image`, data, { headers: { 'Content-Type': data.type } })
    return withKind('course', res.data.data)
  },

  async removeCourseImage(companyId: string, id: string): Promise<CatalogItemDto> {
    const res = await apiClient.delete<ApiEnvelope<CourseDto>>(`${collection(companyId, 'course')}/${id}/image`)
    return withKind('course', res.data.data)
  },

  async addCourseGalleryImage(companyId: string, id: string, data: File): Promise<CatalogItemDto> {
    const res = await apiClient.post<ApiEnvelope<CourseDto>>(`${collection(companyId, 'course')}/${id}/gallery`, data, { headers: { 'Content-Type': data.type } })
    return withKind('course', res.data.data)
  },

  async removeCourseGalleryImage(companyId: string, id: string, imageId: string): Promise<CatalogItemDto> {
    const res = await apiClient.delete<ApiEnvelope<CourseDto>>(`${collection(companyId, 'course')}/${id}/gallery/${imageId}`)
    return withKind('course', res.data.data)
  },

  async removeGalleryImage(companyId: string, id: string, imageId: string): Promise<CatalogItemDto> {
    const res = await apiClient.delete<ApiEnvelope<ActivityDto>>(`${collection(companyId, 'activity')}/${id}/gallery/${imageId}`)
    return withKind('activity', res.data.data)
  },

  async removeActivityFile(companyId: string, id: string, file: ActivityFile): Promise<CatalogItemDto> {
    const res = await apiClient.delete<ApiEnvelope<ActivityDto>>(`${collection(companyId, 'activity')}/${id}/${file}`)
    return withKind('activity', res.data.data)
  },
}
