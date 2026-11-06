'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompaniesTable } from '@/components/companies/companies-table'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { CompanySummaryCards } from '@/components/companies/company-summary-cards'
import { useCompanies } from '@/hooks/use-companies'
import { useDemo } from '@/components/providers/demo-provider'
import { EmptyState } from '@/components/shared/empty-state'
import { NoticeBanner } from '@/components/shared/feedback'
import { FilterSelect, SearchInput } from '@/components/shared/form-controls'
import { PageContainer, PageHeader } from '@/components/shared/page-layout'
import { SectionCard } from '@/components/shared/section-card'
import { useCompanyPermissions } from '@/hooks/use-company-permissions'
import { useDemoResult, type DemoResult } from '@/hooks/use-demo-result'
import { filterCompanies, getCompanyRecords, summarize, type CompanyRecord, type CompanySort, type CompanySortKey, type StatusFilter } from '@/lib/companies'
import { demoDataset } from '@/lib/mock/dashboard-data'
import { useAppDispatch } from '@/store/hooks'
import { fetchCompanies } from '@/store/slices/companies-slice'
import type { Company } from '@/types/company'

const statusItems: Record<StatusFilter, string> = { all: 'All statuses', Active: 'Active', Inactive: 'Inactive' }

export default function CompaniesPage() {
  const { permissions, demoState } = useDemo()
  const { companies, loading, error } = useCompanies()
  const { canCreateCompany, canManageCompanies, canEditCompany } = useCompanyPermissions()
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<CompanySort>({ key: 'name', desc: false })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // The backend only returns companies this user can access. Bookings and revenue are still demo data.
  const demoResult = useDemoResult(
    (empty) => getCompanyRecords(empty ? [] : companies, demoDataset),
    [companies.map((c) => [c.id, c.name, c.code, c.status, c.category])],
    demoState,
  )
  const result: DemoResult<CompanyRecord[]> = loading ? { status: 'loading' }
    : error ? { status: 'error', retry: () => void dispatch(fetchCompanies()) }
    : demoResult
  const records = result.status === 'ready' ? result.data : null
  const visible = records ? filterCompanies(records, query, status, sort) : []
  const filtered = query.trim() !== '' || status !== 'all'

  // Numeric columns start high-to-low; text columns start A–Z.
  const onSort = (key: CompanySortKey) => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key === 'bookings' || key === 'revenue' || key === 'lastActivity' }))
  const openForm = (company: Company | null) => { setEditing(company); setFormOpen(true) }
  const clearFilters = () => { setQuery(''); setStatus('all') }

  return <PageContainer>
    <PageHeader
      meta={error ? error.message : undefined}
      title="Companies"
      description="Manage and monitor all companies across Bond Group."
      actions={<>
        <SearchInput value={query} onChange={setQuery} label="Search companies by name or code" placeholder="Search by company name or code" className="w-full sm:w-[300px]" />
        <FilterSelect label="Filter by status" items={statusItems} value={status} onChange={setStatus} className="w-[150px]" />
        {canCreateCompany && <Button onClick={() => openForm(null)} className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light"><Plus data-icon="inline-start" />Add Company</Button>}
      </>} />

    {notice && <NoticeBanner message={notice} onDismiss={() => setNotice(null)} />}

    <CompanySummaryCards summary={records ? summarize(records) : null} showRevenue={permissions.viewRevenue} />
    {records && <p className="mt-2 text-[11px] text-slate-400">Totals cover all {records.length} {records.length === 1 ? 'company' : 'companies'} you can access, and aren&apos;t affected by search or filters. Bookings and revenue use the last 30 days, as on the Overview.</p>}

    <SectionCard className="mt-6" title="All companies" description={records ? `Showing ${visible.length} of ${records.length}` : undefined} result={result} minHeight={320} contentClassName="px-3 md:px-0"
      isEmpty={(d) => d.length === 0} emptyText={canCreateCompany ? 'No companies yet. Use “Add Company” to create the first one.' : 'No companies are assigned to your role.'}>
      {() => visible.length === 0
        ? <div className="px-3 md:px-6"><EmptyState minHeight={220} text={`No companies match${query.trim() ? ` “${query.trim()}”` : ''}${status !== 'all' ? ` with status ${status}` : ''}.`} />
          {filtered && <div className="mt-3 flex justify-center"><Button variant="outline" size="sm" className="h-8 rounded-full px-3.5 text-xs" onClick={clearFilters}>Clear search and filters</Button></div>}</div>
        : <CompaniesTable records={visible} sort={sort} onSort={onSort} showRevenue={permissions.viewRevenue} canEdit={canEditCompany} onEdit={openForm} />}
    </SectionCard>

    <CompanyFormDialog open={formOpen} onOpenChange={setFormOpen} company={editing} canManageStatus={canManageCompanies} canDelete={canManageCompanies}
      onSaved={(company, mode, warning) => setNotice(`${company.name} ${mode === 'added' ? 'added' : 'updated'}.${warning ? ` ${warning}` : ''}`)}
      onDeleted={(company) => setNotice(`${company.name} deleted.`)} />
  </PageContainer>
}
