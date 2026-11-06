import { apiClient, type TokenResponse } from '@/lib/api/client'
import type { ApiEnvelope } from '@/lib/api/types'

/** GET /auth/me (backend CurrentUser schema). */
export interface CurrentUser {
  id: string
  email: string
  firstName: string
  lastName: string
  status: 'ACTIVE' | 'DISABLED'
  lastLoginAt: string | null
  platformRole: { key: string, name: string } | null
  platformPermissions: string[]
  canAccessAllCompanies: boolean
  companies: { id: string, name: string, slug: string, role: { key: string, name: string }, permissions: string[] }[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const res = await apiClient.post<ApiEnvelope<TokenResponse>>('/auth/login', credentials)
    return res.data.data
  },

  /** Pass the token explicitly: right after login/refresh the store may not hold it yet. */
  async me(accessToken?: string): Promise<CurrentUser> {
    const res = await apiClient.get<ApiEnvelope<CurrentUser>>('/auth/me', accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined)
    return res.data.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {})
  },
}
