'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { buildItem, newItemId, removeItem, setPublication, updateItem } from '@/lib/catalog'
import { seedCatalog } from '@/lib/mock/catalog'
import { DEMO_NOW } from '@/lib/mock/dashboard-data'
import type { CatalogFormValues, CatalogItem, CatalogKind, PublicationStatus } from '@/types/catalog'
import type { CompanyId } from '@/types/company'

interface CatalogStore {
  items: CatalogItem[]
  create: (kind: CatalogKind, companyId: CompanyId, values: CatalogFormValues) => CatalogItem
  update: (companyId: CompanyId, id: string, values: CatalogFormValues) => void
  remove: (companyId: CompanyId, id: string) => void
  publish: (companyId: CompanyId, id: string, publication: PublicationStatus) => void
}

const CatalogContext = createContext<CatalogStore | null>(null)

/** The demo runs on a fixed clock, so new and edited records are stamped with DEMO_NOW. */
const now = () => DEMO_NOW

/**
 * In-memory activities and courses for every company, keyed by companyId. Changes last
 * until the page is reloaded. Replace the setters with API calls when the backend exists.
 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CatalogItem[]>(seedCatalog)

  const create = useCallback((kind: CatalogKind, companyId: CompanyId, values: CatalogFormValues) => {
    const at = now()
    const item = buildItem(kind, values, { id: newItemId(kind, companyId), companyId, createdAt: at }, at)
    setItems((list) => [...list, item])
    return item
  }, [])

  const update = useCallback((companyId: CompanyId, id: string, values: CatalogFormValues) => {
    setItems((list) => updateItem(list, companyId, id, (item) => buildItem(item.kind, values, { id: item.id, companyId: item.companyId, createdAt: item.createdAt }, now())))
  }, [])

  const remove = useCallback((companyId: CompanyId, id: string) => setItems((list) => removeItem(list, companyId, id)), [])
  const publish = useCallback((companyId: CompanyId, id: string, publication: PublicationStatus) => setItems((list) => setPublication(list, companyId, id, publication, now())), [])

  const value = useMemo(() => ({ items, create, update, remove, publish }), [items, create, update, remove, publish])
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const store = useContext(CatalogContext)
  if (!store) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return store
}
