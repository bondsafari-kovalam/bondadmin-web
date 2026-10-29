import { KpiCard, KpiCardSkeleton } from '@/components/shared/kpi-card'
import { cn } from '@/lib/utils'
import type { Kpi } from '@/types/dashboard'

/** Row of KPI cards; the first two use the filled gold / forest style. Shows skeletons while `kpis` is null. */
export function KpiGrid({ kpis, comparisonLabel, placeholderCount }: { kpis: Kpi[] | null, comparisonLabel: string, placeholderCount: number }) {
  const count = kpis?.length ?? placeholderCount
  return <div className={cn('grid gap-4 sm:grid-cols-2', count > 4 ? 'lg:grid-cols-3 2xl:grid-cols-6' : 'lg:grid-cols-4')}>
    {kpis ? kpis.map((kpi, i) => <KpiCard key={kpi.key} kpi={kpi} comparisonLabel={comparisonLabel} variant={i === 0 ? 'gold' : i === 1 ? 'forest' : 'plain'} />)
      : Array.from({ length: placeholderCount }, (_, i) => <KpiCardSkeleton key={i} />)}
  </div>
}
