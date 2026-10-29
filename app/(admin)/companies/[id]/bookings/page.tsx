'use client'

import { RecentBookingsTable } from '@/components/companies/company-detail-cards'
import { useCompanyPage } from '@/components/companies/company-page-context'
import { UpcomingBookings } from '@/components/overview/upcoming-bookings'
import { useCompanies } from '@/components/providers/companies-provider'
import { useDemo } from '@/components/providers/demo-provider'
import { SectionCard } from '@/components/shared/section-card'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { getCompanyProfile } from '@/lib/companies'
import { demoDataset } from '@/lib/mock/dashboard-data'

export default function CompanyBookingsPage() {
  const { company } = useCompanyPage()
  const { role, permissions, demoState } = useDemo()
  const { companies } = useCompanies()
  const result = useDashboardData({ role, company: company.id, range: '30d' }, demoState, companies)
  const { recentBookings } = getCompanyProfile(company.id, demoDataset, 20)

  return <div className="grid gap-6">
    <SectionCard title="Upcoming bookings" description="Activities in the next 7 days" result={result} minHeight={220}
      isEmpty={(d) => d.upcoming.length === 0} emptyText="No activities scheduled in the next 7 days.">
      {(d) => <UpcomingBookings key={company.id} bookings={d.upcoming} />}
    </SectionCard>
    <SectionCard title="Recent bookings" description="The 20 most recently created bookings" result={result} minHeight={220} contentClassName="px-3"
      isEmpty={() => recentBookings.length === 0} emptyText="No bookings yet.">
      {() => <RecentBookingsTable bookings={recentBookings} showAmount={permissions.viewRevenue} />}
    </SectionCard>
  </div>
}
