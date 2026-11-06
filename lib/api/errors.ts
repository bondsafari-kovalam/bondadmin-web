import { isAxiosError } from 'axios'
import type { ApiErrorBody } from '@/lib/api/types'

/** Serializable error shape stored in Redux and shown in the UI. */
export interface ApiError {
  /** HTTP status, or 0 when the server could not be reached. */
  status: number
  /** Backend error code, e.g. `VALIDATION_ERROR`, `CONFLICT`, `FORBIDDEN`. */
  code: string
  message: string
  /** Validation messages keyed by request body field (`name`, `email`, …). */
  fieldErrors?: Record<string, string>
}

export function toApiError(err: unknown): ApiError {
  if (isAxiosError<ApiErrorBody>(err)) {
    if (!err.response) {
      return { status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server. Check your connection and that the API is running.' }
    }
    const body = err.response.data?.error
    const issues = body?.details?.issues?.filter((i) => i.location === 'body' && i.path)
    return {
      status: err.response.status,
      code: body?.code ?? 'UNKNOWN_ERROR',
      message: body?.message ?? `Request failed (${err.response.status}).`,
      ...(issues?.length ? { fieldErrors: Object.fromEntries(issues.map((i) => [i.path.split('.')[0], i.message])) } : {}),
    }
  }
  return { status: 0, code: 'UNKNOWN_ERROR', message: err instanceof Error ? err.message : 'Something went wrong.' }
}
