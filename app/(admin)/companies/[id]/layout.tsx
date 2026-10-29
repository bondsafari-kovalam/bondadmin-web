'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Lock, Pencil, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompanyAvatar } from '@/components/companies/company-avatar'
import { BackToCompaniesLink } from '@/components/companies/company-detail-cards'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { CompanyPageContext } from '@/components/companies/company-page-context'
import { CompanyStatusBadge } from '@/components/companies/company-status-badge'
import { CompanyTabs } from '@/components/companies/company-tabs'
import { useCatalog } from '@/components/providers/catalog-provider'
import { useCompanies } from '@/components/providers/companies-provider'
import { useDemo } from '@/components/providers/demo-provider'
import { NoticeBanner, StatusMessage } from '@/components/shared/feedback'
import { PageContainer, PageHeader } from '@/components/shared/page-layout'
import { itemsFor } from '@/lib/catalog'
import { canAccessCompany } from '@/lib/permissions'

const backButton = <Button className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light" nativeButton={false} render={<Link href="/companies" />}>Back to companies</Button>

/** Shared header, tabs and access check for every /companies/[id]/… page. */
export default function CompanyLayout({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const companyId = decodeURIComponent(id)
  const { user, permissions } = useDemo()
  const { companies } = useCompanies()
  const { items } = useCatalog()
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const company = companies.find((c) => c.id === companyId)
  const allowed = !!company && canAccessCompany(user, company.id)
  const context = useMemo(() => (company ? { company, openEdit: () => setFormOpen(true) } : null), [company])

  if (!company || !allowed) return <PageContainer>
    <BackToCompaniesLink />
    <div className="mt-6">
      {!company
        ? <StatusMessage icon={SearchX} title="Company not found" text="This company doesn’t exist, or it was added in an earlier session (demo changes aren’t saved)." action={backButton} />
        : <StatusMessage icon={Lock} title="No access to this company" text="Your demo role can’t view this company. In production this must also be enforced by the backend." action={backButton} />}
    </div>
  </PageContainer>

  return <CompanyPageContext.Provider value={context}>
    <PageContainer>
      <BackToCompaniesLink />
      <div className="mt-4">
        <PageHeader
          leading={<CompanyAvatar company={company} size="lg" />}
          badges={<><span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm">{company.code}</span><CompanyStatusBadge status={company.status} /></>}
          title={company.name}
          description={`${company.category}${company.contact.location ? ` · ${company.contact.location}` : ''}`}
          actions={permissions.editCompany && <Button onClick={() => setFormOpen(true)} className="h-10 w-fit rounded-full bg-forest px-5 text-xs hover:bg-forest-light"><Pencil data-icon="inline-start" />Edit company</Button>} />
      </div>

      {notice && <NoticeBanner message={notice} onDismiss={() => setNotice(null)} />}

      <CompanyTabs companyId={company.id} counts={{ activities: itemsFor(items, company.id, 'activity').length, courses: itemsFor(items, company.id, 'course').length }} />
      <div className="mt-6">{children}</div>

      <CompanyFormDialog open={formOpen} onOpenChange={setFormOpen} company={company} canManageStatus={permissions.manageCompanyStatus}
        onSaved={(saved) => setNotice(`${saved.name} updated. Demo only — kept for this session.`)} />
    </PageContainer>
  </CompanyPageContext.Provider>
}
