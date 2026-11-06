'use client'

import { CompanySettingsCard } from '@/components/companies/company-detail-cards'
import { useCompanyPage } from '@/components/companies/company-page-context'
import { SocialChannelsCard } from '@/components/inbox/social-channels-card'
import { useCompanyPermissions } from '@/hooks/use-company-permissions'

export default function CompanySettingsPage() {
  const { company, openEdit } = useCompanyPage()
  const { canEditCompany, canReadInbox, canManageSocialChannels } = useCompanyPermissions()
  return <div className="flex max-w-3xl flex-col gap-6">
    <CompanySettingsCard company={company} onEdit={canEditCompany(company.id) ? openEdit : undefined} />
    {canReadInbox(company.id) && <SocialChannelsCard key={company.id} company={company} canManage={canManageSocialChannels(company.id)} />}
  </div>
}
