'use client'

import { CatalogManager } from '@/components/catalog/catalog-manager'
import { useCompanyPage } from '@/components/companies/company-page-context'

export default function CompanyCoursesPage() {
  const { company } = useCompanyPage()
  return <CatalogManager key={company.id} kind="course" company={company} />
}
