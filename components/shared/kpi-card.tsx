'use client'

import { ArrowDownRight, ArrowUpRight, CalendarCheck2, CalendarDays, CircleDollarSign, Clock3, Info, MessageSquareText, Minus, Target, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cardClass } from '@/components/shared/card-styles'
import { formatKpi, kpiChange } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Kpi } from '@/types/dashboard'

export type KpiVariant = 'gold' | 'forest' | 'plain'

const look: Record<Kpi['key'], { icon: LucideIcon, tone: string }> = {
  bookings: { icon: CalendarDays, tone: 'bg-gold-soft text-gold-dark' },
  confirmed: { icon: CalendarCheck2, tone: 'bg-sea/10 text-sea' },
  revenue: { icon: CircleDollarSign, tone: 'bg-forest/10 text-forest' },
  enquiries: { icon: MessageSquareText, tone: 'bg-[#1b8fb5]/10 text-[#1b8fb5]' },
  conversion: { icon: Target, tone: 'bg-sea/10 text-sea' },
  pending: { icon: Clock3, tone: 'bg-gold-soft text-gold-dark' },
}

const variants: Record<KpiVariant, { card: string, label: string, value: string, detail: string, info: string }> = {
  gold: { card: 'bg-gold text-white ring-0', label: 'text-white/85', value: 'text-white', detail: 'text-white/75', info: 'text-white/60 hover:text-white' },
  forest: { card: 'bg-forest text-white ring-0', label: 'text-white/80', value: 'text-white', detail: 'text-white/65', info: 'text-white/50 hover:text-white' },
  plain: { card: '', label: 'text-slate-500', value: 'text-ink', detail: 'text-slate-400', info: 'text-slate-300 hover:text-slate-500' },
}

export function KpiCard({ kpi, comparisonLabel, variant = 'plain' }: { kpi: Kpi, comparisonLabel: string, variant?: KpiVariant }) {
  const { icon: Icon, tone } = look[kpi.key]
  const v = variants[variant]
  const filled = variant !== 'plain'
  const change = kpiChange(kpi)
  const Arrow = change?.direction === 'up' ? ArrowUpRight : change?.direction === 'down' ? ArrowDownRight : Minus
  const changeTone = !change || change.direction === 'flat' ? (filled ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500')
    : change.good ? (filled ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600')
    : (filled ? 'bg-white text-red-600' : 'bg-red-50 text-red-600')

  return <Card className={cn(cardClass, 'relative', v.card)}>
    {/* Soft decorative rings, echoing the travel-card style. */}
    {filled && <div aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full border-[18px] border-white/10" />}
    <CardContent className="relative px-5 py-1">
      <div className="flex items-start justify-between gap-2">
        <div className={cn('flex size-11 items-center justify-center rounded-2xl', filled ? 'bg-white/15 text-white' : tone)}><Icon className="size-5" /></div>
        {change && <span className={cn('flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold', changeTone)}>
          <Arrow className="size-3.5" />{change.text}
        </span>}
      </div>
      <div className={cn('mt-4 flex items-center gap-1 text-[13px] font-medium', v.label)}>
        {kpi.label}
        <Tooltip>
          <TooltipTrigger aria-label={`How ${kpi.label.toLowerCase()} is calculated`} className={cn('rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50', v.info)}><Info className="size-3.5" /></TooltipTrigger>
          <TooltipContent className="max-w-[260px] leading-relaxed">{kpi.definition}</TooltipContent>
        </Tooltip>
      </div>
      <div className={cn('mt-1 text-[26px] font-bold tracking-tight', v.value)}>{formatKpi(kpi, kpi.value)}</div>
      <div className={cn('mt-1 text-xs', v.detail)}>{kpi.detail ?? (kpi.previous === null ? 'Current snapshot' : `vs. ${formatKpi(kpi, kpi.previous)} ${comparisonLabel}`)}</div>
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
