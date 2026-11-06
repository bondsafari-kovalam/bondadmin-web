import { API_URL, apiClient } from '@/lib/api/client'
import type { ApiEnvelope, ApiPage } from '@/lib/api/types'
import type { BusinessType, Company, CompanyInput, CompanyStatus } from '@/types/company'

type CompanyStatusDto = 'ACTIVE' | 'INACTIVE'

/** Company as returned by the backend (backend `Company` schema). Serializable, so it lives in Redux. */
export interface CompanyDto {
  id: string
  name: string
  code: string | null
  category: BusinessType | null
  slug: string
  status: CompanyStatusDto
  timezone: string
  description: string | null
  email: string | null
  phone: string | null
  location: string | null
  /** Path relative to the API origin, e.g. `/api/v1/companies/:id/logo?v=…`. */
  logoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CompanyPayload {
  name?: string
  code?: string
  category?: BusinessType
  status?: CompanyStatusDto
  description?: string
  email?: string
  phone?: string
  location?: string
}

const toStatus: Record<CompanyStatusDto, CompanyStatus> = { ACTIVE: 'Active', INACTIVE: 'Inactive' }
const fromStatus: Record<CompanyStatus, CompanyStatusDto> = { Active: 'ACTIVE', Inactive: 'INACTIVE' }

const palette = ['#d4a42e', '#3e5b56', '#1fb2a6', '#1b8fb5', '#e07a5f', '#7fa38f', '#9a7414', '#557670']

/** Stable avatar colour per company; the backend does not store one. */
function colorFor(id: string) {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return palette[Math.abs(hash) % palette.length]
}

export function toCompany(dto: CompanyDto): Company {
  return {
    id: dto.id,
    name: dto.name,
    // Companies created before these fields existed may not have them yet.
    code: dto.code ?? '',
    category: (dto.category ?? '') as BusinessType,
    status: toStatus[dto.status],
    color: colorFor(dto.id),
    logoUrl: dto.logoUrl ? new URL(dto.logoUrl, API_URL).toString() : undefined,
    description: dto.description ?? undefined,
    contact: { email: dto.email ?? undefined, phone: dto.phone ?? undefined, location: dto.location ?? undefined },
    createdAt: new Date(dto.createdAt),
  }
}

/**
 * Form values → request body. Empty optional fields are sent as '' so an edit can clear them.
 * `includeRestricted` adds code and status, which need the owner-level permission to change.
 */
export function toCompanyPayload(input: CompanyInput, includeRestricted: boolean): CompanyPayload {
  return {
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    location: input.location.trim(),
    ...(includeRestricted ? { code: input.code.trim().toUpperCase(), status: fromStatus[input.status] } : {}),
  }
}

const MAX_PAGE_SIZE = 100

/** Upload limit enforced by the backend (company-logo.service.ts). */
export const LOGO_MAX_BYTES = 1024 * 1024

export const companiesService = {
  /** All companies the signed-in user can access (the backend applies the access rules). */
  async list(): Promise<CompanyDto[]> {
    const items: CompanyDto[] = []
    for (let page = 1; ; page++) {
      const res = await apiClient.get<ApiPage<CompanyDto>>('/companies', { params: { page, pageSize: MAX_PAGE_SIZE, sort: 'name' } })
      items.push(...res.data.data)
      if (page >= res.data.meta.pagination.totalPages) return items
    }
  },

  async get(id: string): Promise<CompanyDto> {
    const res = await apiClient.get<ApiEnvelope<CompanyDto>>(`/companies/${id}`)
    return res.data.data
  },

  async create(payload: CompanyPayload): Promise<CompanyDto> {
    const res = await apiClient.post<ApiEnvelope<CompanyDto>>('/companies', payload)
    return res.data.data
  },

  async update(id: string, payload: CompanyPayload): Promise<CompanyDto> {
    const res = await apiClient.patch<ApiEnvelope<CompanyDto>>(`/companies/${id}`, payload)
    return res.data.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/companies/${id}`)
  },

  /** Uploads the raw file bytes; the backend checks the real type from the file signature. */
  async uploadLogo(id: string, file: File): Promise<CompanyDto> {
    const res = await apiClient.put<ApiEnvelope<CompanyDto>>(`/companies/${id}/logo`, file, { headers: { 'Content-Type': file.type } })
    return res.data.data
  },

  async removeLogo(id: string): Promise<CompanyDto> {
    const res = await apiClient.delete<ApiEnvelope<CompanyDto>>(`/companies/${id}/logo`)
    return res.data.data
  },
}
