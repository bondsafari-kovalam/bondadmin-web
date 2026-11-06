import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiEnvelope } from '@/lib/api/types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export interface TokenResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

/**
 * Hooks the store registers so this module never imports Redux (avoids a circular import).
 * The access token lives only in memory; the refresh token is an httpOnly cookie set by the API.
 */
interface AuthBridge {
  getAccessToken: () => string | null
  onTokenRefreshed: (token: string) => void
  onSessionExpired: () => void
}

let bridge: AuthBridge = { getAccessToken: () => null, onTokenRefreshed: () => {}, onSessionExpired: () => {} }

export function configureApiClient(next: AuthBridge) {
  bridge = next
}

export const apiClient = axios.create({
  baseURL: API_URL,
  // Sends the refresh-token cookie to /auth/* endpoints.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

apiClient.interceptors.request.use((config) => {
  const token = bridge.getAccessToken()
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Exchanges the refresh cookie for a new access token. Shared so parallel 401s refresh once. */
let refreshing: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  refreshing ??= axios
    .post<ApiEnvelope<TokenResponse>>(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
    .then((res) => {
      bridge.onTokenRefreshed(res.data.data.accessToken)
      return res.data.data.accessToken
    })
    .finally(() => { refreshing = null })
  return refreshing
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined
  const isAuthCall = config?.url?.startsWith('/auth/')
  if (error.response?.status !== 401 || !config || config._retried || isAuthCall) throw error

  config._retried = true
  try {
    const token = await refreshAccessToken()
    config.headers.Authorization = `Bearer ${token}`
    return apiClient(config)
  } catch {
    bridge.onSessionExpired()
    throw error
  }
})
