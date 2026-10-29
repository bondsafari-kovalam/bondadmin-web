'use client'

import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { money } from '@/lib/format'
import type { CompanyRow } from '@/types/dashboard'

const revenueConfig = { revenue: { label: 'Booked revenue', color: 'var(--chart-2)' } } satisfies ChartConfig

export function RevenueByCompany({ rows }: { rows: CompanyRow[] }) {
  const data = [...rows].sort((a, b) => b.revenue - a.revenue).map((r) => ({ name: r.company.name, revenue: r.revenue, fill: r.company.color }))
  return <ChartContainer config={revenueConfig} className="aspect-auto w-full" style={{ height: Math.max(160, data.length * 34) }}>
    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 56 }} accessibilityLayer>
      <XAxis type="number" hide />
      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fontSize: 11 }} />
      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} indicator="line" formatter={(value) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">Booked revenue</span><span className="font-mono font-medium tabular-nums">{money(Number(value))}</span></span>} />} />
      <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={16} label={{ position: 'right', fontSize: 11, fill: '#64748b', formatter: (v: unknown) => money(Number(v)) }}>
        {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
      </Bar>
    </BarChart>
  </ChartContainer>
}
