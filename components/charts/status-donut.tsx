'use client'

import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { bookingStatusColors } from '@/components/shared/status-badge'
import { count, percent } from '@/lib/format'
import type { BookingStatus } from '@/types/dashboard'

const statusConfig = Object.fromEntries(Object.entries(bookingStatusColors).map(([name, color]) => [name, { label: name, color }])) satisfies ChartConfig

export function StatusDonut({ data }: { data: { name: BookingStatus, value: number }[] }) {
  const total = data.reduce((sum, s) => sum + s.value, 0)
  return <div className="flex flex-col items-center gap-5 sm:flex-row">
    <div className="relative size-[156px] shrink-0">
      <ChartContainer config={statusConfig} className="aspect-square size-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" formatter={(value, name) => <span className="flex w-full justify-between gap-4"><span className="text-muted-foreground">{name}</span><span className="font-mono font-medium tabular-nums">{count(Number(value))} · {percent(total ? Number(value) / total * 100 : 0)}</span></span>} />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={3} strokeWidth={0}>
            {data.map((s) => <Cell key={s.name} fill={bookingStatusColors[s.name]} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold">{count(total)}</span><span className="text-[11px] text-slate-400">bookings</span></div>
    </div>
    <ul className="flex w-full min-w-0 flex-1 flex-col gap-3">
      {data.map((status) => <li key={status.name} className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: bookingStatusColors[status.name] }} />{status.name}</span>
        <span className="font-semibold text-slate-700">{count(status.value)} <span className="ml-1 inline-block w-11 text-right font-normal text-slate-400">{percent(total ? status.value / total * 100 : 0)}</span></span>
      </li>)}
    </ul>
  </div>
}
