'use client'

import { count, percent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardData, EnquiryStage } from '@/types/dashboard'

const stageColors: Record<EnquiryStage, string> = { New: 'bg-slate-300', Contacted: 'bg-forest-light', Interested: 'bg-gold', Converted: 'bg-sea', Lost: 'bg-slate-200' }

export function Pipeline({ stages }: { stages: DashboardData['pipeline'] }) {
  const total = stages.reduce((sum, s) => sum + s.value, 0)
  return <div className="flex flex-col gap-4">
    {stages.map((s) => <div key={s.stage}>
      <div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-600">{s.stage}</span><span className="font-semibold text-slate-700">{count(s.value)} <span className="ml-1 font-normal text-slate-400">{percent(total ? s.value / total * 100 : 0)}</span></span></div>
      <div className="h-2.5 rounded-full bg-slate-100"><div className={cn('h-full rounded-full', stageColors[s.stage])} style={{ width: `${total ? s.value / total * 100 : 0}%` }} /></div>
    </div>)}
    <p className="text-[11px] text-slate-400">Current stage of the {count(total)} enquiries received in the period.</p>
  </div>
}
