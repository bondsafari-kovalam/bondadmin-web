'use client'

import { CompanySettingsCard } from '@/components/companies/company-detail-cards'
import { useCompanyPage } from '@/components/companies/company-page-context'
import { useDemo } from '@/components/providers/demo-provider'

export default function CompanySettingsPage() {
  const { company, openEdit } = useCompanyPage()
  const { permissions } = useDemo()
  return <div className="max-w-3xl"><CompanySettingsCard company={company} onEdit={permissions.editCompany ? openEdit : undefined} /></div>
}
