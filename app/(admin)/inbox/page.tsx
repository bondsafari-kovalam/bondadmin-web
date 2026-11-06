'use client'

import { useState } from 'react'
import { CloudOff, MessageSquareText } from 'lucide-react'
import { InboxView } from '@/components/inbox/inbox-view'
import { FilterSelect } from '@/components/shared/form-controls'
import { StatusMessage } from '@/components/shared/feedback'
import { PageContainer, PageHeader } from '@/components/shared/page-layout'
import { LoadingState } from '@/components/shared/section-card'
import { useCompanies } from '@/hooks/use-companies'
import { useCompanyPermissions } from '@/hooks/use-company-permissions'

/** Social inbox across companies: pick a company, then read and reply to its messages. */
export default function InboxPage() {
  const { companies, loading, error } = useCompanies()
  const { canReadInbox, canReplyInbox, canManageSocialChannels } = useCompanyPermissions()
  const readable = companies.filter((c) => canReadInbox(c.id))
  const [picked, setPicked] = useState<string | null>(null)
  const company = readable.find((c) => c.id === picked) ?? readable[0]

  return <PageContainer>
    <PageHeader
      title="Social Inbox"
      description="Facebook, Instagram and WhatsApp messages from customers, in one place."
      actions={readable.length > 1 && company && <FilterSelect label="Company" items={Object.fromEntries(readable.map((c) => [c.id, c.name]))} value={company.id} onChange={setPicked} className="w-[240px]" />} />

    {loading ? <LoadingState minHeight={420} />
      : error ? <StatusMessage icon={CloudOff} title="Couldn’t load companies" text={error.message} />
      : !company ? <StatusMessage icon={MessageSquareText} title="No inbox available" text="None of your companies give your role access to customer messages." />
      : <InboxView key={company.id} company={company} canReply={canReplyInbox(company.id)}
          settingsHref={canManageSocialChannels(company.id) ? `/companies/${encodeURIComponent(company.id)}/settings` : undefined} />}
  </PageContainer>
}
