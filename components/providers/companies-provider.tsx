'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { seedCompanies } from '@/lib/mock/companies'
import { DEMO_NOW } from '@/lib/mock/dashboard-data'
import type { Company, CompanyId, CompanyInput } from '@/types/company'

interface CompaniesStore {
  companies: Company[]
  addCompany: (input: CompanyInput) => Company
  updateCompany: (id: CompanyId, input: CompanyInput) => void
}

const CompaniesContext = createContext<CompaniesStore | null>(null)

const palette = ['#d4a42e', '#3e5b56', '#1fb2a6', '#1b8fb5', '#e07a5f', '#7fa38f', '#9a7414', '#557670']

function toCompanyFields(input: CompanyInput) {
  return {
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    category: input.category,
    status: input.status,
    description: input.description.trim() || undefined,
    contact: {
      email: input.email.trim() || undefined,
      phone: input.phone.trim() || undefined,
      location: input.location.trim() || undefined,
    },
  }
}

/**
 * In-memory company records for the prototype. Adds and edits last until the page is
 * reloaded. Replace the setters with API calls when the backend exists.
 */
export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(seedCompanies)
  const latest = useRef(companies)
  latest.current = companies

  const addCompany = useCallback((input: CompanyInput) => {
    const current = latest.current
    const base = input.code.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company'
    let id = base
    for (let n = 2; current.some((c) => c.id === id); n++) id = `${base}-${n}`
    const created: Company = { id, color: palette[current.length % palette.length], createdAt: DEMO_NOW, ...toCompanyFields(input) }
    setCompanies((list) => [...list, created])
    return created
  }, [])

  const updateCompany = useCallback((id: CompanyId, input: CompanyInput) => {
    setCompanies((current) => current.map((c) => (c.id === id ? { ...c, ...toCompanyFields(input) } : c)))
  }, [])

  const value = useMemo(() => ({ companies, addCompany, updateCompany }), [companies, addCompany, updateCompany])
  return <CompaniesContext.Provider value={value}>{children}</CompaniesContext.Provider>
}

export function useCompanies() {
  const store = useContext(CompaniesContext)
  if (!store) throw new Error('useCompanies must be used inside <CompaniesProvider>')
  return store
}
