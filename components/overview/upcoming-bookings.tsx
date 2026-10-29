'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCompanies } from '@/components/providers/companies-provider'
import { EmptyState } from '@/components/shared/empty-state'
import { SearchInput } from '@/components/shared/form-controls'
import { StatusBadge } from '@/components/shared/status-badge'
import { dateTime } from '@/lib/format'
import { DEMO_NOW } from '@/lib/mock/dashboard-data'
import type { Booking } from '@/types/dashboard'

const PAGE = 6

export function UpcomingBookings({ bookings }: { bookings: Booking[] }) {
  const { companies } = useCompanies()
  const companyName = (id: Booking['companyId']) => companies.find((c) => c.id === id)?.name ?? id
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const q = query.trim().toLowerCase()
  const matches = q ? bookings.filter((b) => [b.id, b.customer, b.activity, companyName(b.companyId), b.status, b.paymentStatus].join(' ').toLowerCase().includes(q)) : bookings
  const visible = matches.slice(0, limit)

  return <div className="flex flex-col gap-3">
    <SearchInput value={query} onChange={(value) => { setQuery(value); setLimit(PAGE) }} label="Search upcoming bookings" placeholder="Search booking, customer, activity…" size="sm" className="w-full sm:w-[260px]" />
    {matches.length === 0 ? <EmptyState minHeight={160} text={`No upcoming bookings match “${query}”.`} /> : <>
      <Table aria-label="Upcoming bookings" className="min-w-[720px] text-xs">
        <TableHeader><TableRow className="border-slate-100 hover:bg-transparent">
          {['Booking', 'Company / activity', 'Date & time', 'Guests', 'Status', 'Payment'].map((h, i) => <TableHead key={h} className={i === 0 ? 'pr-3 pl-0 text-xs font-medium text-slate-400' : 'px-3 text-xs font-medium text-slate-400'}>{h}</TableHead>)}
        </TableRow></TableHeader>
        <TableBody>
          {visible.map((b) => <TableRow key={b.id} className="border-slate-50 hover:bg-gold-soft/40">
            <TableCell className="py-3 pr-3 pl-0"><div className="font-semibold text-slate-700">{b.id}</div><div className="text-[11px] text-slate-400">{b.customer}</div></TableCell>
            <TableCell className="px-3"><div className="font-medium text-slate-700">{companyName(b.companyId)}</div><div className="text-[11px] text-slate-400">{b.activity}</div></TableCell>
            <TableCell className="px-3 text-slate-600">{dateTime(b.activityDate, DEMO_NOW)}</TableCell>
            <TableCell className="px-3 text-slate-600">{b.guests}</TableCell>
            <TableCell className="px-3"><StatusBadge status={b.status} /></TableCell>
            <TableCell className="px-3"><StatusBadge status={b.paymentStatus} /></TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>Showing {visible.length} of {matches.length}</span>
        {matches.length > limit && <Button variant="outline" size="sm" className="h-8 rounded-full px-3.5 text-xs" onClick={() => setLimit((n) => n + PAGE * 2)}>Show more</Button>}
      </div>
    </>}
  </div>
}
