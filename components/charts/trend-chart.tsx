'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { count, money } from '@/lib/format'
import type { TrendPoint } from '@/types/dashboard'

const trendConfig = {
  bookings: { label: 'Bookings', color: 'var(--chart-1)' },
  revenue: { label: 'Booked revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function TrendChart({ data, metric }: { data: TrendPoint[], metric: 'bookings' | 'revenue' }) {
  // Thin out x-axis labels on long ranges so they don't collide.
  const interval = data.length > 16 ? Math.ceil(data.length / 8) - 1 : 0
  return <ChartContainer config={trendConfig} className="aspect-auto h-[250px] w-full">
    <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }} accessibilityLayer>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`var(--color-${metric})`} stopOpacity={0.25} />
          <stop offset="100%" stopColor={`var(--color-${metric})`} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="label" axisLine={false} tickLine={false} interval={interval} tickMargin={8} />
      <YAxis axisLine={false} tickLine={false} width={metric === 'revenue' ? 56 : 36} tickFormatter={(v: number) => metric === 'revenue' ? money(v) : count(v)} />
      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" formatter={(value) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">{trendConfig[metric].label}</span><span className="font-mono font-medium tabular-nums">{metric === 'revenue' ? money(Number(value)) : count(Number(value))}</span></span>} />} />
      <Area type="monotone" dataKey={metric} stroke={`var(--color-${metric})`} strokeWidth={3} fill="url(#trendFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
    </AreaChart>
  </ChartContainer>
}
