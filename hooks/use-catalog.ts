'use client'

import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectCatalogItems, selectCatalogLoad } from '@/store/selectors'
import { fetchCatalog } from '@/store/slices/catalog-slice'
import type { CompanyId } from '@/types/company'

/**
 * Activities and courses of one company, loaded from the API on first use and cached in
 * Redux. `items` holds every loaded company's records; narrow it with `itemsFor()`.
 */
export function useCatalog(companyId: CompanyId) {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectCatalogItems)
  const load = useAppSelector((state) => selectCatalogLoad(state, companyId))
  const status = load?.status ?? 'idle'

  useEffect(() => {
    if (status === 'idle') void dispatch(fetchCatalog(companyId))
  }, [status, companyId, dispatch])

  const reload = useCallback(() => void dispatch(fetchCatalog(companyId)), [dispatch, companyId])

  return { items, status, error: load?.error ?? null, loading: status === 'idle' || status === 'loading', reload }
}
