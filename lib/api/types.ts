// Response envelopes shared by every backend endpoint (see backend src/common/utils/response.ts).

export interface ApiEnvelope<T> {
  data: T
}

export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface ApiPage<T> {
  data: T[]
  meta: { pagination: Pagination }
}

export interface ApiValidationIssue {
  location: 'body' | 'query' | 'params'
  path: string
  message: string
  code: string
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    requestId?: string
    details?: { issues?: ApiValidationIssue[] }
  }
}
