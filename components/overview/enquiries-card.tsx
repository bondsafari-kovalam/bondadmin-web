'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCompanies } from '@/components/providers/companies-provider'
import { EmptyState } from '@/components/shared/empty-state'
import { SegmentedControl } from '@/components/shared/form-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import { dateTime, timeAgo } from '@/lib/format'
import { DEMO_NOW, salesReps } from '@/lib/mock/dashboard-data'
import { cn } from '@/lib/utils'
import type { DashboardData, Enquiry } from '@/types/dashboard'

type Tab = 'recent' | 'unassigned' | 'followUps'
const PAGE = 6
const repName = (id: string | null) => salesReps.find((r) => r.id === id)?.name ?? null

export function EnquiriesCard({ enquiries, periodLabel }: { enquiries: DashboardData['enquiries'], periodLabel: string }) {
  const { companies } = useCompanies()
  const companyShort = (id: Enquiry['companyId']) => companies.find((c) => c.id === id)?.code ?? id
  const [tab, setTab] = useState<Tab>('recent')
  const [limit, setLimit] = useState(PAGE)
  const tabs: { key: Tab, label: string, items: Enquiry[], empty: string }[] = [
    { key: 'recent', label: 'Recent', items: enquiries.recent, empty: 'No enquiries received in the selected period.' },
    { key: 'unassigned', label: 'Unassigned', items: enquiries.unassigned, empty: 'Every open enquiry has an owner.' },
    { key: 'followUps', label: 'Follow-ups due', items: enquiries.followUps, empty: 'No follow-ups due today.' },
  ]
  const current = tabs.find((t) => t.key === tab)!
  const items = current.items.slice(0, limit)

  return <div className="flex flex-col gap-3">
    <SegmentedControl label="Enquiry views" tone="white" value={tab} onChange={(t) => { setTab(t); setLimit(PAGE) }} options={tabs.map((t) => ({ value: t.key, label: t.label, count: t.items.length }))} />
    <p className="text-[11px] text-slate-400">{tab === 'recent' ? `Received in the selected period (${periodLabel}).` : 'Open right now — not affected by the date range.'}</p>
    {items.length === 0 ? <EmptyState minHeight={180} text={current.empty} /> : <ul className="flex flex-col divide-y divide-slate-50">
      {items.map((e) => {
        const owner = repName(e.ownerId)
        const overdue = tab === 'followUps' && e.followUpDue && e.followUpDue < new Date(DEMO_NOW.getFullYear(), DEMO_NOW.getMonth(), DEMO_NOW.getDate())
        return <li key={e.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="truncate">{e.customer}</span><span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{companyShort(e.companyId)}</span></div>
            <div className="mt-0.5 truncate text-[11px] text-slate-400">{e.interest} · {e.source} · {owner ?? <span className="font-medium text-amber-600">Unassigned</span>}</div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={e.stage} />
            <span className={cn('text-[10px]', overdue ? 'font-semibold text-red-600' : 'text-slate-400')}>{tab === 'followUps' && e.followUpDue ? `${overdue ? 'Overdue · ' : 'Due '}${dateTime(e.followUpDue, DEMO_NOW)}` : timeAgo(e.createdAt, DEMO_NOW)}</span>
          </div>
        </li>
      })}
    </ul>}
    {current.items.length > 0 && <div className="flex items-center justify-between text-xs text-slate-400">
      <span>Showing {items.length} of {current.items.length}</span>
      {current.items.length > limit && <Button variant="outline" size="sm" className="h-8 rounded-full px-3.5 text-xs" onClick={() => setLimit((n) => n + PAGE * 2)}>Show more</Button>}
    </div>}
  </div>
}
