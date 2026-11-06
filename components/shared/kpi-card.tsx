'use client'

import { ArrowDownRight, ArrowUpRight, CalendarCheck2, CalendarDays, CircleDollarSign, Clock3, Info, MessageSquareText, Minus, Target, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cardClass } from '@/components/shared/card-styles'
import { WaveAccent } from '@/components/shared/wave-accent'
import { formatKpi, kpiChange } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Kpi } from '@/types/dashboard'

const look: Record<Kpi['key'], { icon: LucideIcon, tone: string, wave: string }> = {
  bookings: { icon: CalendarDays, tone: 'bg-orange-100 text-orange-600', wave: 'text-orange-300' },
  confirmed: { icon: CalendarCheck2, tone: 'bg-emerald-100 text-emerald-700', wave: 'text-teal-300' },
  revenue: { icon: CircleDollarSign, tone: 'bg-cyan-100 text-cyan-700', wave: 'text-cyan-300' },
  enquiries: { icon: MessageSquareText, tone: 'bg-violet-100 text-violet-700', wave: 'text-violet-300' },
  conversion: { icon: Target, tone: 'bg-emerald-100 text-emerald-700', wave: 'text-teal-300' },
  pending: { icon: Clock3, tone: 'bg-orange-100 text-orange-600', wave: 'text-orange-300' },
}

export function KpiCard({ kpi, comparisonLabel }: { kpi: Kpi, comparisonLabel: string }) {
  const { icon: Icon, tone, wave } = look[kpi.key]
  const change = kpiChange(kpi)
  const Arrow = change?.direction === 'up' ? ArrowUpRight : change?.direction === 'down' ? ArrowDownRight : Minus
  const changeTone = !change || change.direction === 'flat' ? 'bg-slate-100 text-slate-500'
    : change.good ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'

  return <Card className={cn(cardClass, 'relative')}>
    <WaveAccent className={wave} />
    <CardContent className="relative px-5 pt-1 pb-5">
      <div className="flex items-start justify-between gap-2">
        <div className={cn('flex size-11 items-center justify-center rounded-lg', tone)}><Icon className="size-5" /></div>
        {change && <span className={cn('flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold', changeTone)}>
          <Arrow className="size-3.5" />{change.text}
        </span>}
      </div>
      <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-ink">
        {kpi.label}
        <Tooltip>
          <TooltipTrigger aria-label={`How ${kpi.label.toLowerCase()} is calculated`} className="rounded-full text-slate-300 outline-none hover:text-slate-500 focus-visible:ring-2 focus-visible:ring-ring/50"><Info className="size-3.5" /></TooltipTrigger>
          <TooltipContent className="max-w-[260px] leading-relaxed">{kpi.definition}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-1 text-[26px] font-bold tracking-tight text-ink">{formatKpi(kpi, kpi.value)}</div>
      <div className="mt-1 text-xs text-slate-500">{kpi.detail ?? (kpi.previous === null ? 'Current snapshot' : `vs. ${formatKpi(kpi, kpi.previous)} ${comparisonLabel}`)}</div>
    </CardContent>
  </Card>
}

export function KpiCardSkeleton() {
  return <Card className={cardClass}>
    <CardContent className="flex flex-col gap-3 px-5 py-1" role="status" aria-label="Loading">
      <Skeleton className="size-11 rounded-2xl" />
      <Skeleton className="mt-1 h-3.5 w-24 rounded-full" />
      <Skeleton className="h-7 w-28 rounded-lg" />
      <Skeleton className="h-3 w-32 rounded-full" />
    </CardContent>
  </Card>
}
