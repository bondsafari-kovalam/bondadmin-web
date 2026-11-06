'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { CloudOff, Pencil, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompanyAvatar } from '@/components/companies/company-avatar'
import { BackToCompaniesLink } from '@/components/companies/company-detail-cards'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { CompanyPageContext } from '@/components/companies/company-page-context'
import { CompanyStatusBadge } from '@/components/companies/company-status-badge'
import { CompanyTabs } from '@/components/companies/company-tabs'
import { useCompanies } from '@/hooks/use-companies'
import { LoadingState } from '@/components/shared/section-card'
import { NoticeBanner, StatusMessage } from '@/components/shared/feedback'
import { PageContainer, PageHeader } from '@/components/shared/page-layout'
import { useCatalog } from '@/hooks/use-catalog'
import { useCompanyPermissions } from '@/hooks/use-company-permissions'
import { itemsFor } from '@/lib/catalog'

const backButton = <Button className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light" nativeButton={false} render={<Link href="/companies" />}>Back to companies</Button>

/** Shared header, tabs and access check for every /companies/[id]/… page. */
export default function CompanyLayout({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const companyId = decodeURIComponent(id)
  const router = useRouter()
  const { companies, loading, error } = useCompanies()
  const { canEditCompany, canManageCompanies } = useCompanyPermissions()
  const { items } = useCatalog(companyId)
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const company = companies.find((c) => c.id === companyId)
  const context = useMemo(() => (company ? { company, openEdit: () => setFormOpen(true) } : null), [company])

  // The backend only lists companies this user can access, so "missing" covers "no access" too.
  if (!company) return <PageContainer>
    <BackToCompaniesLink />
    <div className="mt-6">
      {loading ? <LoadingState minHeight={240} />
        : error ? <StatusMessage icon={CloudOff} title="Couldn’t load companies" text={error.message} action={backButton} />
        : <StatusMessage icon={SearchX} title="Company not found" text="This company doesn’t exist, was deleted, or you don’t have access to it." action={backButton} />}
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
          actions={canEditCompany(company.id) && <Button onClick={() => setFormOpen(true)} className="h-10 w-fit rounded-full bg-forest px-5 text-xs hover:bg-forest-light"><Pencil data-icon="inline-start" />Edit company</Button>} />
      </div>

      {notice && <NoticeBanner message={notice} onDismiss={() => setNotice(null)} />}

      <CompanyTabs companyId={company.id} counts={{ activities: itemsFor(items, company.id, 'activity').length, courses: itemsFor(items, company.id, 'course').length }} />
      <div className="mt-6">{children}</div>

      <CompanyFormDialog open={formOpen} onOpenChange={setFormOpen} company={company} canManageStatus={canManageCompanies} canDelete={canManageCompanies}
        onSaved={(saved, _mode, warning) => setNotice(`${saved.name} updated.${warning ? ` ${warning}` : ''}`)}
        onDeleted={() => router.replace('/companies')} />
    </PageContainer>
  </CompanyPageContext.Provider>
}
