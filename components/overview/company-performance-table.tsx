'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { count, money, percent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CompanyId } from '@/types/company'
import type { CompanyRow } from '@/types/dashboard'

type SortKey = 'bookings' | 'revenue' | 'enquiries' | 'conversion'

export function CompanyPerformanceTable({ rows, showRevenue, onSelect }: { rows: CompanyRow[], showRevenue: boolean, onSelect: (id: CompanyId) => void }) {
  const [sort, setSort] = useState<{ key: SortKey, desc: boolean }>({ key: showRevenue ? 'revenue' : 'bookings', desc: true })
  const sorted = [...rows].sort((a, b) => (a[sort.key] - b[sort.key]) * (sort.desc ? -1 : 1))
  const columns: { key: SortKey, label: string }[] = [
    { key: 'bookings', label: 'Bookings' },
    ...(showRevenue ? [{ key: 'revenue' as const, label: 'Revenue' }] : []),
    { key: 'enquiries', label: 'Enquiries' },
    { key: 'conversion', label: 'Conversion' },
  ]

  return <Table aria-label="Company performance comparison" className="min-w-[600px] text-xs">
    <TableHeader><TableRow className="border-slate-100 hover:bg-transparent">
      <TableHead className="px-6 text-xs font-medium text-slate-400">Company</TableHead>
      {columns.map((c) => <TableHead key={c.key} className="px-3 text-xs font-medium text-slate-400" aria-sort={sort.key === c.key ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
        <button type="button" onClick={() => setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : true }))} className={cn('inline-flex items-center gap-1 rounded-md hover:text-slate-600', sort.key === c.key && 'text-slate-700')}>
          {c.label}{sort.key === c.key && (sort.desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
        </button>
      </TableHead>)}
      <TableHead className="w-8" />
    </TableRow></TableHeader>
    <TableBody>
      {sorted.map((row) => <TableRow key={row.company.id} onClick={() => onSelect(row.company.id)} className="cursor-pointer border-slate-50 hover:bg-gold-soft/40">
        <TableCell className="px-6 py-3">
          <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(row.company.id) }} className="flex items-center gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={`Show ${row.company.name} only`}>
            <span className="flex size-9 items-center justify-center rounded-xl text-[10px] font-bold text-white" style={{ backgroundColor: row.company.color }}>{row.company.code}</span>
            <span><span className="block font-semibold text-slate-700">{row.company.name}</span><span className="block text-[11px] text-slate-400">{row.company.category}</span></span>
          </button>
        </TableCell>
        <TableCell className="px-3 font-medium">{count(row.bookings)}</TableCell>
        {showRevenue && <TableCell className="px-3 font-medium">{money(row.revenue)}</TableCell>}
        <TableCell className="px-3">{count(row.enquiries)}</TableCell>
        <TableCell className="px-3"><span className="font-semibold text-sea">{percent(row.conversion)}</span> <span className="text-[11px] text-slate-400">({row.converted}/{row.enquiries})</span></TableCell>
        <TableCell className="pr-4"><ChevronRight className="size-3.5 text-slate-300" /></TableCell>
      </TableRow>)}
    </TableBody>
  </Table>
}
