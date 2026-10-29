'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Compass, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useCatalog } from '@/components/providers/catalog-provider'
import { cardClass } from '@/components/shared/card-styles'
import { formatPrice, itemsFor } from '@/lib/catalog'
import type { CatalogItem } from '@/types/catalog'
import type { Company } from '@/types/company'

function Group({ icon: Icon, title, items, href, empty }: { icon: LucideIcon, title: string, items: CatalogItem[], href: string, empty: string }) {
  const published = items.filter((i) => i.publication === 'Published').length
  return <div>
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Icon className="size-3.5 text-gold-dark" />{title}<span className="font-normal text-slate-400">{published} published · {items.length - published} draft</span></h3>
      <Link href={href} className="flex items-center gap-1 text-xs font-medium text-forest hover:underline">Manage<ArrowRight className="size-3" /></Link>
    </div>
    {items.length === 0 ? <p className="rounded-xl bg-slate-50/70 px-3 py-3 text-xs text-slate-500">{empty}</p>
      : <ul className="flex flex-col divide-y divide-slate-50">{items.slice(0, 4).map((i) => <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-xs">
        <span className="truncate font-medium text-slate-700">{i.name}</span>
        <span className="shrink-0 text-slate-500">{formatPrice(i.price, i.currency)}</span>
      </li>)}{items.length > 4 && <li className="py-2 text-[11px] text-slate-400">+{items.length - 4} more</li>}</ul>}
  </div>
}

/** Activities & courses at a glance, with links to the management tabs. */
export function CatalogSummaryCard({ company }: { company: Company }) {
  const { items } = useCatalog()
  const base = `/companies/${encodeURIComponent(company.id)}`
  return <Card className={cardClass}><CardContent className="flex flex-col gap-5 px-6 py-1">
    <h2 className="text-[15px] font-semibold text-ink">Activities &amp; courses</h2>
    <Group icon={Compass} title="Activities" items={itemsFor(items, company.id, 'activity')} href={`${base}/activities`} empty="No activities yet." />
    <Group icon={BookOpen} title="Courses" items={itemsFor(items, company.id, 'course')} href={`${base}/courses`} empty="No courses yet." />
  </CardContent></Card>
}
