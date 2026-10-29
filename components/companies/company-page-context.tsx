'use client'

import { createContext, useContext } from 'react'
import type { Company } from '@/types/company'

interface CompanyPage {
  company: Company
  /** Opens the shared "Edit company" form owned by the company layout. */
  openEdit: () => void
}

export const CompanyPageContext = createContext<CompanyPage | null>(null)

/** The company of the current /companies/[id]/… route. Only available inside that layout. */
export function useCompanyPage() {
  const value = useContext(CompanyPageContext)
  if (!value) throw new Error('useCompanyPage must be used inside the company layout')
  return value
}
