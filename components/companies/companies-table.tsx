'use client'

import type { MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CompanyAvatar } from '@/components/companies/company-avatar'
import { CompanyStatusBadge } from '@/components/companies/company-status-badge'
import type { CompanyRecord, CompanySort, CompanySortKey } from '@/lib/companies'
import { count, money, timeAgo } from '@/lib/format'
import { DEMO_NOW } from '@/lib/mock/dashboard-data'
import { cn } from '@/lib/utils'
import type { Company } from '@/types/company'

interface CompaniesTableProps {
  records: CompanyRecord[]
  sort: CompanySort
  onSort: (key: CompanySortKey) => void
  showRevenue: boolean
  canEdit: boolean
  onEdit: (company: Company) => void
}

const detailsHref = (company: Company) => `/companies/${encodeURIComponent(company.id)}`
const lastActivity = (date: Date | null) => (date ? timeAgo(date, DEMO_NOW) : 'No activity yet')

function Actions({ company, canEdit, onEdit }: { company: Company, canEdit: boolean, onEdit: (company: Company) => void }) {
  return <div className="flex items-center justify-end gap-1.5">
    <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs" nativeButton={false} render={<Link href={detailsHref(company)} aria-label={`View details for ${company.name}`} />}><Eye data-icon="inline-start" />View</Button>
    {canEdit && <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={() => onEdit(company)} aria-label={`Edit ${company.name}`}><Pencil data-icon="inline-start" />Edit</Button>}
  </div>
}

export function CompaniesTable({ records, sort, onSort, showRevenue, canEdit, onEdit }: CompaniesTableProps) {
  const router = useRouter()
  // Whole-row click opens details, except when the click came from a link or button inside the row.
  const openRow = (e: MouseEvent, company: Company) => {
    if ((e.target as HTMLElement).closest('a, button')) return
    router.push(detailsHref(company))
  }

  const columns: { key: CompanySortKey, label: string, className?: string }[] = [
    { key: 'name', label: 'Company', className: 'pl-6' },
    { key: 'category', label: 'Business type', className: 'hidden lg:table-cell' },
    { key: 'status', label: 'Status' },
    { key: 'bookings', label: 'Bookings (30d)', className: 'text-right' },
    ...(showRevenue ? [{ key: 'revenue' as const, label: 'Revenue (30d)', className: 'text-right' }] : []),
    { key: 'lastActivity', label: 'Last activity', className: 'hidden xl:table-cell' },
  ]

  return <>
    {/* Tablet and desktop */}
    <Table aria-label="Companies" className="hidden min-w-[680px] text-xs md:table">
      <TableHeader><TableRow className="border-slate-100 hover:bg-transparent">
        {columns.map((c) => <TableHead key={c.key} className={cn('px-3 text-xs font-medium text-slate-400', c.className)} aria-sort={sort.key === c.key ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
          <button type="button" onClick={() => onSort(c.key)} className={cn('inline-flex items-center gap-1 rounded-md hover:text-slate-600', sort.key === c.key && 'text-slate-700')}>
            {c.label}{sort.key === c.key ? (sort.desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
          </button>
        </TableHead>)}
        <TableHead className="pr-6 text-right text-xs font-medium text-slate-400">Actions</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {records.map(({ company, metrics }) => <TableRow key={company.id} onClick={(e) => openRow(e, company)} className="cursor-pointer border-slate-50 hover:bg-gold-soft/40">
          <TableCell className="py-3 pr-3 pl-6">
            <div className="flex items-center gap-3">
              <CompanyAvatar company={company} />
              <div className="min-w-0">
                <Link href={detailsHref(company)} className="block truncate font-semibold text-slate-700 hover:text-forest hover:underline">{company.name}</Link>
                <span className="text-[11px] text-slate-400">{company.code}</span>
              </div>
            </div>
          </TableCell>
          <TableCell className="hidden px-3 text-slate-600 lg:table-cell">{company.category}</TableCell>
          <TableCell className="px-3"><CompanyStatusBadge status={company.status} /></TableCell>
          <TableCell className="px-3 text-right font-medium tabular-nums">{count(metrics.bookings)}</TableCell>
          {showRevenue && <TableCell className="px-3 text-right font-medium tabular-nums">{money(metrics.revenue)}</TableCell>}
          <TableCell className="hidden px-3 text-slate-500 xl:table-cell">{lastActivity(metrics.lastActivity)}</TableCell>
          <TableCell className="pr-6"><Actions company={company} canEdit={canEdit} onEdit={onEdit} /></TableCell>
        </TableRow>)}
      </TableBody>
    </Table>

    {/* Mobile */}
    <ul className="flex flex-col gap-3 md:hidden" aria-label="Companies">
      {records.map(({ company, metrics }) => <li key={company.id} className="rounded-2xl border border-slate-100 p-4">
        <div className="flex items-start gap-3">
          <CompanyAvatar company={company} />
          <div className="min-w-0 flex-1">
            <Link href={detailsHref(company)} className="block truncate text-sm font-semibold text-slate-700">{company.name}</Link>
            <div className="text-[11px] text-slate-400">{company.code} · {company.category}</div>
          </div>
          <CompanyStatusBadge status={company.status} />
        </div>
        <dl className={cn('mt-3 grid gap-2 text-xs', showRevenue ? 'grid-cols-3' : 'grid-cols-2')}>
          <div><dt className="text-[11px] text-slate-400">Bookings (30d)</dt><dd className="font-semibold">{count(metrics.bookings)}</dd></div>
          {showRevenue && <div><dt className="text-[11px] text-slate-400">Revenue (30d)</dt><dd className="font-semibold">{money(metrics.revenue)}</dd></div>}
          <div><dt className="text-[11px] text-slate-400">Last activity</dt><dd className="font-semibold">{lastActivity(metrics.lastActivity)}</dd></div>
        </dl>
        <div className="mt-3 border-t border-slate-50 pt-3"><Actions company={company} canEdit={canEdit} onEdit={onEdit} /></div>
      </li>)}
    </ul>
  </>
}
