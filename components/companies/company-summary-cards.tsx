import { BriefcaseBusiness, CalendarDays, CircleCheck, CircleDollarSign, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cardClass } from '@/components/shared/card-styles'
import { WaveAccent } from '@/components/shared/wave-accent'
import type { CompanySummary } from '@/lib/companies'
import { count, money } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Tile { label: string, value: string, detail: string, icon: LucideIcon, tone: string, wave: string }

export function CompanySummaryCards({ summary, showRevenue }: { summary: CompanySummary | null, showRevenue: boolean }) {
  const tiles: Tile[] = summary ? [
    { label: 'Total companies', value: count(summary.total), detail: 'You have access to', icon: BriefcaseBusiness, tone: 'bg-emerald-100 text-emerald-700', wave: 'text-teal-300' },
    { label: 'Active companies', value: count(summary.active), detail: `${count(summary.total - summary.active)} inactive`, icon: CircleCheck, tone: 'bg-violet-100 text-violet-700', wave: 'text-violet-300' },
    { label: 'Total bookings', value: count(summary.bookings), detail: 'Last 30 days, all statuses', icon: CalendarDays, tone: 'bg-orange-100 text-orange-600', wave: 'text-orange-300' },
    ...(showRevenue ? [{ label: 'Total revenue', value: money(summary.revenue), detail: 'Booked revenue, last 30 days', icon: CircleDollarSign, tone: 'bg-cyan-100 text-cyan-700', wave: 'text-cyan-300' }] : []),
  ] : []

  const columns = showRevenue ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
  if (!summary) return <div className={cn('grid gap-3 sm:gap-4', columns)} role="status" aria-label="Loading summary">
    {Array.from({ length: showRevenue ? 4 : 3 }, (_, i) => <Card key={i} className={cardClass}><CardContent className="flex items-center gap-4 px-5 py-0.5"><Skeleton className="size-11 rounded-2xl" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-3 w-24 rounded-full" /><Skeleton className="h-6 w-16 rounded-lg" /></div></CardContent></Card>)}
  </div>

  return <div className={cn('grid gap-3 sm:gap-4', columns)}>
    {tiles.map(({ label, value, detail, icon: Icon, tone, wave }) => <Card key={label} className={cn(cardClass, 'relative')}>
      <WaveAccent className={wave} />
      <CardContent className="relative flex flex-col items-start gap-3 px-4 pt-1 pb-6 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
        <span className={cn('flex size-10 shrink-0 sm:size-11 items-center justify-center rounded-lg', tone)}><Icon className="size-5" /></span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink">{label}</div>
          <div className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{value}</div>
          <div className="text-[11px] text-slate-500 sm:truncate">{detail}</div>
        </div>
      </CardContent>
    </Card>)}
  </div>
}
