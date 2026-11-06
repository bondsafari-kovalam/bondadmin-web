import { API_URL, apiClient } from '@/lib/api/client'
import type { ApiEnvelope, ApiPage } from '@/lib/api/types'
import type { ActivityCategory, AvailabilityStatus, CatalogFormValues, CatalogItem, CatalogKind, CourseCategory, CourseLevel, Currency, DifficultyLevel, DurationUnit, PublicationStatus } from '@/types/catalog'

// ---- API shapes (backend `Activity` / `Course` schemas) ------------------------------

type PublicationDto = 'DRAFT' | 'PUBLISHED'
type AvailabilityDto = 'AVAILABLE' | 'SEASONAL' | 'UNAVAILABLE'
type DurationUnitDto = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS'
type CourseLevelDto = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS'
type DifficultyDto = 'EASY' | 'MODERATE' | 'CHALLENGING' | 'EXTREME'

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

export interface ActivityDto extends CatalogItemDtoBase {
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

const invert = <K extends string, V extends string>(map: Record<K, V>) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<V, K>
const toPublicationDto = invert(publication)
const toAvailabilityDto = invert(availability)
const toDurationUnitDto = invert(durationUnit)
const toCourseLevelDto = invert(courseLevel)
const toDifficultyDto = invert(difficulty)

const apiUrl = (path: string) => new URL(path, API_URL).toString()

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
    ...base, kind: 'activity', category: dto.category, tags: dto.tags, locations: dto.locations, totalSlots: dto.totalSlots,
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

/** Validated form values → request body. Every field is sent, so an edit can also clear values. */
export function toCatalogPayload(kind: CatalogKind, v: CatalogFormValues) {
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
