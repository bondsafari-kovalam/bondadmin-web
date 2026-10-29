import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Lock, Mail, MapPin, Pencil, Phone } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CompanyStatusBadge } from '@/components/companies/company-status-badge'
import { cardClass } from '@/components/shared/card-styles'
import { StatusBadge } from '@/components/shared/status-badge'
import { dateTime, money } from '@/lib/format'
import { DEMO_NOW } from '@/lib/mock/dashboard-data'
import type { Company, CompanyAdmin } from '@/types/company'
import type { Booking, SalesRep } from '@/types/dashboard'

export function BackToCompaniesLink() {
  return <Link href="/companies" className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-forest"><ArrowLeft className="size-3.5" />All companies</Link>
}

export function CompanyProfileCard({ company }: { company: Company }) {
  const { contact } = company
  return <Card className={cardClass}><CardContent className="flex flex-col gap-4 px-6 py-1">
    <h2 className="text-[15px] font-semibold text-ink">Company profile</h2>
    {company.description && <p className="text-sm leading-relaxed text-slate-600">{company.description}</p>}
    <dl className="grid gap-3 text-xs sm:grid-cols-2">
      <div><dt className="text-slate-400">Company code</dt><dd className="mt-0.5 font-semibold text-slate-700">{company.code}</dd></div>
      <div><dt className="text-slate-400">Business type</dt><dd className="mt-0.5 font-semibold text-slate-700">{company.category}</dd></div>
      <div><dt className="text-slate-400">Status</dt><dd className="mt-1"><CompanyStatusBadge status={company.status} /></dd></div>
      <div><dt className="text-slate-400">On Bond Central since</dt><dd className="mt-0.5 font-semibold text-slate-700">{company.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</dd></div>
    </dl>
    {(contact.email || contact.phone || contact.location) && <div className="border-t border-slate-100 pt-4">
      <h3 className="mb-2 text-xs font-semibold text-slate-700">Contact</h3>
      <ul className="flex flex-col gap-2 text-xs text-slate-600">
        {contact.email && <li className="flex items-center gap-2"><Mail className="size-3.5 text-slate-400" /><a href={`mailto:${contact.email}`} className="hover:text-forest hover:underline">{contact.email}</a></li>}
        {contact.phone && <li className="flex items-center gap-2"><Phone className="size-3.5 text-slate-400" />{contact.phone}</li>}
        {contact.location && <li className="flex items-center gap-2"><MapPin className="size-3.5 text-slate-400" />{contact.location}</li>}
      </ul>
    </div>}
  </CardContent></Card>
}

interface Person { id: string, name: string, initials: string, detail: string }

export function CompanyTeamCard({ admins, reps }: { admins: CompanyAdmin[], reps: SalesRep[] }) {
  const groups: { title: string, people: Person[] }[] = [
    { title: 'Company administrators', people: admins.map((a) => ({ id: a.id, name: a.name, initials: a.initials, detail: a.email })) },
    { title: 'Sales team', people: reps.map((r) => ({ id: r.id, name: r.name, initials: r.initials, detail: `Covers ${r.companyIds.length} ${r.companyIds.length === 1 ? 'company' : 'companies'}` })) },
  ]
  return <Card className={cardClass}><CardContent className="flex flex-col gap-4 px-6 py-1">
    <h2 className="text-[15px] font-semibold text-ink">Team</h2>
    {groups.map((group) => <div key={group.title}>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gold-dark">{group.title}</h3>
      {group.people.length === 0 ? <p className="text-xs text-slate-400">No one assigned yet.</p>
        : <ul className="flex flex-col gap-2.5">{group.people.map((p) => <li key={p.id} className="flex items-center gap-3">
          <Avatar className="size-9"><AvatarFallback className="bg-forest/10 text-[11px] font-semibold text-forest">{p.initials}</AvatarFallback></Avatar>
          <div className="min-w-0"><div className="text-xs font-semibold text-slate-700">{p.name}</div><div className="truncate text-[11px] text-slate-400">{p.detail}</div></div>
        </li>)}</ul>}
    </div>)}
  </CardContent></Card>
}

export function RecentBookingsTable({ bookings, showAmount }: { bookings: Booking[], showAmount: boolean }) {
  const headers = ['Booking', 'Activity', 'Date & time', 'Status', 'Payment', ...(showAmount ? ['Amount'] : [])]
  return <Table aria-label="Recent bookings" className="min-w-[620px] text-xs">
    <TableHeader><TableRow className="border-slate-100 hover:bg-transparent">
      {headers.map((h, i) => <TableHead key={h} className={i === 0 ? 'pl-3 text-xs font-medium text-slate-400' : h === 'Amount' ? 'pr-3 text-right text-xs font-medium text-slate-400' : 'px-3 text-xs font-medium text-slate-400'}>{h}</TableHead>)}
    </TableRow></TableHeader>
    <TableBody>
      {bookings.map((b) => <TableRow key={b.id} className="border-slate-50">
        <TableCell className="py-3 pl-3"><div className="font-semibold text-slate-700">{b.id}</div><div className="text-[11px] text-slate-400">{b.customer} · {b.guests} {b.guests === 1 ? 'guest' : 'guests'}</div></TableCell>
        <TableCell className="px-3 text-slate-600">{b.activity}</TableCell>
        <TableCell className="px-3 text-slate-600"><span className="flex items-center gap-1.5"><CalendarDays className="size-3 text-slate-400" />{dateTime(b.activityDate, DEMO_NOW)}</span></TableCell>
        <TableCell className="px-3"><StatusBadge status={b.status} /></TableCell>
        <TableCell className="px-3"><StatusBadge status={b.paymentStatus} /></TableCell>
        {showAmount && <TableCell className="pr-3 text-right font-medium tabular-nums">{money(b.amount)}</TableCell>}
      </TableRow>)}
    </TableBody>
  </Table>
}

/** Company profile fields as stored, with the entry point to edit them. */
export function CompanySettingsCard({ company, onEdit }: { company: Company, onEdit?: () => void }) {
  const rows: [string, ReactNode][] = [
    ['Company name', company.name],
    ['Company code', company.code],
    ['Business type', company.category],
    ['Status', <CompanyStatusBadge key="status" status={company.status} />],
    ['Contact email', company.contact.email ?? <span className="text-slate-400">Not set</span>],
    ['Phone', company.contact.phone ?? <span className="text-slate-400">Not set</span>],
    ['Location', company.contact.location ?? <span className="text-slate-400">Not set</span>],
    ['Description', company.description ?? <span className="text-slate-400">Not set</span>],
  ]
  return <Card className={cardClass}><CardContent className="flex flex-col gap-4 px-6 py-1">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-[15px] font-semibold text-ink">Company settings</h2><p className="mt-1 text-xs text-slate-400">Profile details used across Bond Central.</p></div>
      {onEdit ? <Button onClick={onEdit} className="h-9 rounded-full bg-forest px-4 text-xs hover:bg-forest-light"><Pencil data-icon="inline-start" />Edit settings</Button>
        : <span className="flex items-center gap-1.5 text-xs text-slate-400"><Lock className="size-3.5" />Read-only for your role</span>}
    </div>
    <dl className="divide-y divide-slate-50 text-xs">
      {rows.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]"><dt className="text-slate-400">{label}</dt><dd className="font-medium text-slate-700">{value}</dd></div>)}
    </dl>
  </CardContent></Card>
}
