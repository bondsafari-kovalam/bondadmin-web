'use client'

import { useState } from 'react'
import { TrendChart } from '@/components/charts/trend-chart'
import { SegmentedControl } from '@/components/shared/form-controls'
import { SectionCard } from '@/components/shared/section-card'
import type { DashboardResult } from '@/hooks/use-dashboard-data'
import { formatKpi } from '@/lib/format'

type Metric = 'bookings' | 'revenue'

/** Trend of bookings (and revenue, when the role may see it) with the period total above the chart. */
export function PerformanceCard({ result, showRevenue }: { result: DashboardResult, showRevenue: boolean }) {
  const [selected, setSelected] = useState<Metric>('bookings')
  const metric = showRevenue ? selected : 'bookings'

  return <SectionCard title="Performance overview" description={showRevenue ? 'Bookings and booked revenue by creation date' : 'Bookings by creation date'} result={result} minHeight={290}
    isEmpty={(d) => d.trend.every((p) => p.bookings === 0)} emptyText="No bookings were created in this period."
    action={showRevenue && <SegmentedControl label="Chart metric" value={selected} onChange={setSelected} options={[{ value: 'bookings', label: 'Bookings' }, { value: 'revenue', label: 'Revenue' }]} />}>
    {(d) => {
      const kpi = d.kpis.find((k) => k.key === metric)!
      return <>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><div className="text-2xl font-bold">{formatKpi(kpi, kpi.value)}</div><div className="mt-1 text-xs text-slate-400">{kpi.label} · total of the chart</div></div>
          <div className="text-right text-xs text-slate-400">{d.period.label}</div>
        </div>
        <TrendChart data={d.trend} metric={metric} />
      </>
    }}
  </SectionCard>
}
