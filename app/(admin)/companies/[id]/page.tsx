'use client'

import { CatalogSummaryCard } from '@/components/catalog/catalog-summary-card'
import { CompanyProfileCard } from '@/components/companies/company-detail-cards'
import { useCompanyPage } from '@/components/companies/company-page-context'
import { useCompanies } from '@/components/providers/companies-provider'
import { useDemo } from '@/components/providers/demo-provider'
import { ActivityFeed } from '@/components/shared/activity-feed'
import { KpiGrid } from '@/components/shared/kpi-grid'
import { SectionCard } from '@/components/shared/section-card'
import { useDashboardData } from '@/hooks/use-dashboard-data'

export default function CompanyOverviewPage() {
  const { company } = useCompanyPage()
  const { role, permissions, demoState } = useDemo()
  const { companies } = useCompanies()
  const result = useDashboardData({ role, company: company.id, range: '30d' }, demoState, companies)
  const data = result.status === 'ready' ? result.data : null

  return <>
    <KpiGrid kpis={data?.kpis ?? null} comparisonLabel={data?.previousPeriod.label ?? ''} placeholderCount={permissions.viewRevenue ? 6 : 4} />
    <p className="mt-2 text-[11px] text-slate-400">Last 30 days ({data?.period.label ?? '…'}). Same definitions as the Overview — hover ⓘ on a card for details.</p>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <CompanyProfileCard company={company} />
      <CatalogSummaryCard company={company} />
    </div>

    <SectionCard className="mt-6" title="Recent activity" description="Latest events for this company" result={result} minHeight={180}
      isEmpty={(d) => d.activity.length === 0} emptyText="No activity yet.">
      {(d) => <ActivityFeed events={d.activity} />}
    </SectionCard>
  </>
}
