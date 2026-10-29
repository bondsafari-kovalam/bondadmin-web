'use client'

import { useState } from 'react'
import { BriefcaseBusiness, CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RevenueByCompany } from '@/components/charts/revenue-by-company-chart'
import { StatusDonut } from '@/components/charts/status-donut'
import { AttentionList } from '@/components/overview/attention-list'
import { CompanyPerformanceTable } from '@/components/overview/company-performance-table'
import { CompanyScopeBanner } from '@/components/overview/company-scope-banner'
import { EnquiriesCard } from '@/components/overview/enquiries-card'
import { PaymentsSummary } from '@/components/overview/payments-summary'
import { PerformanceCard } from '@/components/overview/performance-card'
import { Pipeline } from '@/components/overview/pipeline'
import { SalesTeam } from '@/components/overview/sales-team'
import { UpcomingBookings } from '@/components/overview/upcoming-bookings'
import { useCompanies } from '@/components/providers/companies-provider'
import { useDemo } from '@/components/providers/demo-provider'
import { ActivityFeed } from '@/components/shared/activity-feed'
import { FilterSelect } from '@/components/shared/form-controls'
import { KpiGrid } from '@/components/shared/kpi-grid'
import { PageContainer, PageHeader } from '@/components/shared/page-layout'
import { SectionCard } from '@/components/shared/section-card'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { rangeLabels } from '@/lib/dashboard'
import { DEMO_NOW } from '@/lib/mock/dashboard-data'
import { visibleCompanies } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import type { CompanyId } from '@/types/company'
import type { RangeKey } from '@/types/dashboard'

const asOf = DEMO_NOW.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const greeting = DEMO_NOW.getHours() < 12 ? 'Good morning' : DEMO_NOW.getHours() < 17 ? 'Good afternoon' : 'Good evening'

export default function OverviewPage() {
  const { role, user, permissions, demoState } = useDemo()
  const { companies } = useCompanies()
  const [selectedId, setCompany] = useState<CompanyId | 'all'>('all')
  const [range, setRange] = useState<RangeKey>('30d')

  const allowed = visibleCompanies(user, companies)
  // A selection made under another demo role falls back to "all" when it isn't visible any more.
  const company = selectedId !== 'all' && allowed.some((c) => c.id === selectedId) ? selectedId : 'all'
  const result = useDashboardData({ role, company, range }, demoState, companies)
  const singleCompany = allowed.length === 1
  const selected = singleCompany ? allowed[0] : allowed.find((c) => c.id === company)
  const showRevenue = permissions.viewRevenue
  const data = result.status === 'ready' ? result.data : null
  const companyItems: Record<string, string> = { ...(singleCompany ? {} : { all: role === 'sales' ? 'All my companies' : 'All companies' }), ...Object.fromEntries(allowed.map((c) => [c.id, c.name])) }

  return <PageContainer>
    <PageHeader
      meta={`Generated sample records · as of ${asOf}`}
      title={<>{greeting}, {user.name.split(' ')[0]} <span aria-hidden="true">👋</span></>}
      description={data ? <>Here&apos;s {selected ? selected.name : role === 'sales' ? 'your companies' : 'the Bond Group'} for <span className="font-medium text-slate-700">{data.period.label}</span>.</> : 'Here’s what’s happening across your companies.'}
      actions={<>
        <FilterSelect label="Date range" items={rangeLabels} value={range} onChange={setRange} icon={<CalendarDays className="mr-1.5 size-3.5 text-slate-400" />} className="w-40" />
        <FilterSelect label="Company" items={companyItems} value={singleCompany ? allowed[0].id : company} onChange={setCompany} disabled={singleCompany} title={singleCompany ? 'Your role is limited to this company' : undefined}
          icon={<BriefcaseBusiness className="mr-1.5 size-3.5 text-slate-400" />} className="w-50" />
        <Button size="sm" disabled title="Booking form isn't built yet" className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light"><Plus data-icon="inline-start" />Add booking</Button>
      </>} />

    {selected && !singleCompany && <CompanyScopeBanner company={selected} onClear={() => setCompany('all')} />}

    <KpiGrid kpis={data?.kpis ?? null} comparisonLabel={data?.previousPeriod.label ?? ''} placeholderCount={showRevenue ? 6 : 4} />
    {result.status === 'error' && <p role="alert" className="mt-3 text-xs text-red-600">Figures couldn&apos;t be loaded. Use “Try again” on any card.</p>}

    <SectionCard className="mt-6" title="Needs attention" description="Open right now for the selected companies — not affected by the date range" result={result} minHeight={80}
      isEmpty={(d) => d.alerts.length === 0} emptyText="Nothing needs your attention right now.">
      {(d) => <AttentionList alerts={d.alerts} />}
    </SectionCard>

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)]">
      <PerformanceCard result={result} showRevenue={showRevenue} />
      <SectionCard title="Booking status" description="Bookings created in the period, by current status" result={result} minHeight={170}
        isEmpty={(d) => d.statuses.every((s) => s.value === 0)} emptyText="No bookings were created in this period.">
        {(d) => <StatusDonut data={d.statuses} />}
      </SectionCard>
    </div>

    {!selected && <div className={cn('mt-6 grid gap-6', showRevenue && 'xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,1fr)]')}>
      <SectionCard title="Company performance" description="Select a company to inspect it on its own" result={result} minHeight={260} contentClassName="px-3" isEmpty={(d) => d.companyRows.length === 0}>
        {(d) => <CompanyPerformanceTable rows={d.companyRows} showRevenue={showRevenue} onSelect={setCompany} />}
      </SectionCard>
      {showRevenue && <SectionCard title="Revenue by company" description="Booked revenue in the period" result={result} minHeight={240}
        isEmpty={(d) => d.companyRows.every((r) => r.revenue === 0)} emptyText="No booked revenue in this period.">
        {(d) => <RevenueByCompany rows={d.companyRows} />}
      </SectionCard>}
    </div>}

    <div className={cn('mt-6 grid gap-6', showRevenue && 'xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]')}>
      <SectionCard id="upcoming-bookings" title="Upcoming bookings" description="Activities in the next 7 days — not affected by the date range" result={result} minHeight={260}
        isEmpty={(d) => d.upcoming.length === 0} emptyText="No activities scheduled in the next 7 days.">
        {(d) => <UpcomingBookings key={`${role}-${company}`} bookings={d.upcoming} />}
      </SectionCard>
      {showRevenue && <SectionCard id="payments" title="Payments" description="For bookings created in the period" result={result} minHeight={260}
        isEmpty={(d) => Object.values(d.payments).every((p) => p.count === 0)} emptyText="No payments for bookings in this period.">
        {(d) => <PaymentsSummary payments={d.payments} />}
      </SectionCard>}
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
      <SectionCard id="enquiries" title={role === 'sales' ? 'Your enquiries' : 'Enquiries'} description={role === 'sales' ? 'Assigned to you, plus the unassigned pool' : 'Recent leads, unassigned leads and follow-ups'} result={result} minHeight={260}>
        {(d) => <EnquiriesCard key={`${role}-${company}-${range}`} enquiries={d.enquiries} periodLabel={d.period.label} />}
      </SectionCard>
      <SectionCard title="Sales pipeline" description="Enquiries received in the period, by current stage" result={result} minHeight={220}
        isEmpty={(d) => d.pipeline.every((s) => s.value === 0)} emptyText="No enquiries were received in this period.">
        {(d) => <Pipeline stages={d.pipeline} />}
      </SectionCard>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <SectionCard title="Sales team" description="Enquiries assigned in the period, and follow-ups due now" result={result} minHeight={200}
        isEmpty={(d) => d.team.length === 0} emptyText="No sales reps cover the selected companies.">
        {(d) => <SalesTeam team={d.team} />}
      </SectionCard>
      <SectionCard title="Recent activity" description="Latest events for the selected companies" result={result} minHeight={200}
        isEmpty={(d) => d.activity.length === 0} emptyText="No recent activity.">
        {(d) => <ActivityFeed events={d.activity} />}
      </SectionCard>
    </div>
  </PageContainer>
}
