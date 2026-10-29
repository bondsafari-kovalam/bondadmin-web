'use client'

import { useMemo, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { type Crumb, TopBar } from '@/components/layout/top-bar'
import { useCompanies, CompaniesProvider } from '@/components/providers/companies-provider'
import { CatalogProvider } from '@/components/providers/catalog-provider'
import { companyTabs } from '@/components/companies/company-tabs'
import { DemoProvider, useDemo } from '@/components/providers/demo-provider'
import { getDashboardData } from '@/lib/dashboard'
import { demoDataset } from '@/lib/mock/dashboard-data'
import { visibleCompanies } from '@/lib/permissions'

const sectionNames: Record<string, string> = { companies: 'Companies' }
const tabNames: Record<string, string> = Object.fromEntries(companyTabs.filter((t) => t.segment).map((t) => [t.segment, t.label]))

/** Shared chrome for every admin page: demo role, company store, sidebar and header. */
export function AdminShell({ children }: { children: ReactNode }) {
  return <DemoProvider><CompaniesProvider><CatalogProvider><ShellFrame>{children}</ShellFrame></CatalogProvider></CompaniesProvider></DemoProvider>
}

function ShellFrame({ children }: { children: ReactNode }) {
  const { role, setRole, user, demoState, setDemoState } = useDemo()
  const { companies } = useCompanies()
  const pathname = usePathname()
  const allowed = visibleCompanies(user, companies)
  const scopeLabel = role === 'owner' ? `Viewing all ${allowed.length} companies` : allowed.length === 1 ? `Viewing ${allowed[0].name}` : `Viewing your ${allowed.length} companies`

  // Role-wide alerts for the bell, independent of any page's filters.
  const alerts = useMemo(
    () => (demoState === 'normal' ? getDashboardData({ role, company: 'all', range: '30d' }, { ...demoDataset, companies }).alerts : demoState === 'loading' ? null : []),
    [role, demoState, companies],
  )

  const [section, id, tab] = pathname.split('/').filter(Boolean)
  const crumbs: Crumb[] = [{ label: 'Dashboard', href: '/' }]
  if (!section) crumbs.push({ label: 'Overview' })
  else {
    crumbs.push({ label: sectionNames[section] ?? section, href: `/${section}` })
    if (id) crumbs.push({ label: companies.find((c) => c.id === decodeURIComponent(id))?.name ?? 'Not found', href: tab ? `/${section}/${id}` : undefined })
    if (tab) crumbs.push({ label: tabNames[tab] ?? tab })
  }

  return <div className="flex min-h-screen bg-mint text-ink [color-scheme:light]">
    <Sidebar user={user} scopeLabel={scopeLabel} />
    <div className="min-w-0 flex-1">
      <TopBar user={user} role={role} onRoleChange={setRole} demoState={demoState} onDemoStateChange={setDemoState} alerts={alerts} scopeLabel={scopeLabel} crumbs={crumbs} />
      {children}
    </div>
  </div>
}
