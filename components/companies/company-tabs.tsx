'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export const companyTabs = [
  { segment: '', label: 'Overview' },
  { segment: 'activities', label: 'Activities' },
  { segment: 'courses', label: 'Courses' },
  { segment: 'bookings', label: 'Bookings' },
  { segment: 'team', label: 'Team & Administrators' },
  { segment: 'settings', label: 'Settings' },
] as const

/** Tab links for a company's pages; each tab is its own route under /companies/[id]. */
export function CompanyTabs({ companyId, counts }: { companyId: string, counts: Partial<Record<string, number>> }) {
  const pathname = usePathname()
  const base = `/companies/${encodeURIComponent(companyId)}`
  return <nav aria-label="Company sections" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
    <ul className="flex w-max gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-100">
      {companyTabs.map(({ segment, label }) => {
        const href = segment ? `${base}/${segment}` : base
        const active = segment ? pathname.startsWith(href) : pathname === base
        const count = counts[segment]
        return <li key={label}>
          <Link href={href} aria-current={active ? 'page' : undefined}
            className={cn('flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors', active ? 'bg-forest text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}>
            {label}
            {count !== undefined && <span className={cn('rounded-full px-1.5 text-[10px]', active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>{count}</span>}
          </Link>
        </li>
      })}
    </ul>
  </nav>
}
