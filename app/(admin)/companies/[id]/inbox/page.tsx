'use client'

import { Lock } from 'lucide-react'
import { InboxView } from '@/components/inbox/inbox-view'
import { useCompanyPage } from '@/components/companies/company-page-context'
import { StatusMessage } from '@/components/shared/feedback'
import { useCompanyPermissions } from '@/hooks/use-company-permissions'

export default function CompanyInboxPage() {
  const { company } = useCompanyPage()
  const { canReadInbox, canReplyInbox, canManageSocialChannels } = useCompanyPermissions()
  if (!canReadInbox(company.id)) return <StatusMessage icon={Lock} title="No access to the inbox" text="Your role in this company can't read customer messages." />
  return <InboxView key={company.id} company={company} canReply={canReplyInbox(company.id)}
    settingsHref={canManageSocialChannels(company.id) ? `/companies/${encodeURIComponent(company.id)}/settings` : undefined} />
}
