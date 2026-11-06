'use client'

import { useAppSelector } from '@/store/hooks'
import { selectCompanies, selectCompaniesError, selectCompaniesStatus } from '@/store/selectors'

/** Companies from the backend, as loaded into the Redux store by the admin shell. */
export function useCompanies() {
  const companies = useAppSelector(selectCompanies)
  const status = useAppSelector(selectCompaniesStatus)
  const error = useAppSelector(selectCompaniesError)
  return { companies, status, error, loading: status === 'idle' || status === 'loading' }
}
