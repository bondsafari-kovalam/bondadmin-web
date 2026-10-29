'use client'

import { useState } from 'react'
import { Lock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCatalog } from '@/components/providers/catalog-provider'
import { useDemo } from '@/components/providers/demo-provider'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { NoticeBanner } from '@/components/shared/feedback'
import { FilterSelect, SearchInput } from '@/components/shared/form-controls'
import { SectionCard } from '@/components/shared/section-card'
import { useDemoResult, type DemoResult } from '@/hooks/use-demo-result'
import { filterCatalog, itemsFor, type AvailabilityFilter, type PublicationFilter } from '@/lib/catalog'
import type { CatalogItem, CatalogKind } from '@/types/catalog'
import type { Company } from '@/types/company'
import { ActivityForm, CourseForm } from './catalog-form'
import { CatalogPreviewDialog } from './catalog-preview-dialog'
import { ActivityTable, CourseTable, type CatalogRowActions } from './catalog-table'

const publicationItems: Record<PublicationFilter, string> = { all: 'All statuses', Published: 'Published', Draft: 'Draft' }
const availabilityItems: Record<AvailabilityFilter, string> = { all: 'Any availability', Available: 'Available', Seasonal: 'Seasonal', Unavailable: 'Unavailable' }

/** Activities or courses of one company: search, filters, table, add / edit / delete / publish / preview. */
export function CatalogManager({ kind, company }: { kind: CatalogKind, company: Company }) {
  const { items, remove, publish } = useCatalog()
  const { permissions, demoState } = useDemo()
  const [query, setQuery] = useState('')
  const [publication, setPublication] = useState<PublicationFilter>('all')
  const [availability, setAvailability] = useState<AvailabilityFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [previewing, setPreviewing] = useState<CatalogItem | null>(null)
  const [deleting, setDeleting] = useState<CatalogItem | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const noun = kind === 'activity' ? 'activity' : 'course'
  const plural = kind === 'activity' ? 'activities' : 'courses'
  const Noun = noun[0].toUpperCase() + noun.slice(1)
  const canManage = permissions.manageCatalog

  // The demo state switcher gates loading / error / empty; records come live from the store so edits show instantly.
  const gate = useDemoResult((empty) => empty, [company.id, kind], demoState)
  const all = gate.status === 'ready' && !gate.data ? itemsFor(items, company.id, kind) : []
  const result: DemoResult<CatalogItem[]> = gate.status === 'ready' ? { status: 'ready', data: all } : gate
  const visible = filterCatalog(all, query, publication, availability)
  const filtered = query.trim() !== '' || publication !== 'all' || availability !== 'all'

  const openForm = (item: CatalogItem | null) => { setEditing(item); setFormOpen(true) }
  const actions: CatalogRowActions<CatalogItem> = {
    onPreview: setPreviewing,
    ...(canManage ? {
      onEdit: (item) => openForm(item),
      onTogglePublish: (item) => {
        const next = item.publication === 'Published' ? 'Draft' : 'Published'
        publish(company.id, item.id, next)
        setNotice(`${item.name} ${next === 'Published' ? 'published' : 'moved to draft'}.`)
      },
      onDelete: setDeleting,
    } : {}),
  }
  const addButton = canManage && <Button onClick={() => openForm(null)} className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light"><Plus data-icon="inline-start" />Add {Noun}</Button>

  return <>
    {notice && <NoticeBanner message={`${notice} Demo only — kept for this session.`} onDismiss={() => setNotice(null)} />}

    <SectionCard title={kind === 'activity' ? 'Activities' : 'Courses'} description={result.status === 'ready' ? `Showing ${visible.length} of ${all.length} · ${company.name} only` : `${company.name} only`}
      result={result} minHeight={300} contentClassName="px-3 md:px-0" action={addButton}
      isEmpty={(d) => d.length === 0} emptyText={`${company.name} has no ${plural} yet.${canManage ? ` Use “Add ${Noun}” to create the first one.` : ''}`}>
      {() => <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 px-3 md:px-6">
          <SearchInput value={query} onChange={setQuery} label={`Search ${plural}`} placeholder="Search by name, slug or category" className="w-full sm:w-[280px]" />
          <FilterSelect label="Filter by publication status" items={publicationItems} value={publication} onChange={setPublication} className="w-[150px]" />
          <FilterSelect label="Filter by availability" items={availabilityItems} value={availability} onChange={setAvailability} className="w-[170px]" />
          {!canManage && <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400"><Lock className="size-3.5" />Read-only for your role</span>}
        </div>
        {visible.length === 0
          ? <div className="px-3 md:px-6"><EmptyState minHeight={200} text={`No ${plural} match your search and filters.`} />
            {filtered && <div className="mt-3 flex justify-center"><Button variant="outline" size="sm" className="h-8 rounded-full px-3.5 text-xs" onClick={() => { setQuery(''); setPublication('all'); setAvailability('all') }}>Clear search and filters</Button></div>}</div>
          : kind === 'activity'
            ? <ActivityTable items={visible.filter((i) => i.kind === 'activity')} color={company.color} {...actions} />
            : <CourseTable items={visible.filter((i) => i.kind === 'course')} color={company.color} {...actions} />}
      </div>}
    </SectionCard>

    {canManage && (kind === 'activity'
      ? <ActivityForm open={formOpen} onOpenChange={setFormOpen} company={company} item={editing} onSaved={(_, mode, name) => setNotice(`${name} ${mode}.`)} />
      : <CourseForm open={formOpen} onOpenChange={setFormOpen} company={company} item={editing} onSaved={(_, mode, name) => setNotice(`${name} ${mode}.`)} />)}

    <CatalogPreviewDialog item={previewing} company={company} onOpenChange={(open) => !open && setPreviewing(null)} />

    <ConfirmDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)} destructive
      title={`Delete this ${noun}?`} confirmLabel={`Delete ${noun}`}
      description={<>“{deleting?.name}” will be removed from {company.name}. Other companies are not affected. In this demo it comes back when the page is reloaded.</>}
      onConfirm={() => { if (deleting) { remove(company.id, deleting.id); setNotice(`${deleting.name} deleted.`) } }} />
  </>
}
