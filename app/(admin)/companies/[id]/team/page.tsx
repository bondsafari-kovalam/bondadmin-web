'use client'

import { CompanyTeamCard } from '@/components/companies/company-detail-cards'
import { useCompanyPage } from '@/components/companies/company-page-context'
import { getCompanyProfile } from '@/lib/companies'
import { demoDataset } from '@/lib/mock/dashboard-data'

export default function CompanyTeamPage() {
  const { company } = useCompanyPage()
  const { admins, reps } = getCompanyProfile(company.id, demoDataset)
  return <div className="max-w-3xl"><CompanyTeamCard admins={admins} reps={reps} /></div>
}
