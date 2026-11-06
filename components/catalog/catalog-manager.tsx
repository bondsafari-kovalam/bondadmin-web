'use client'

import { useState } from 'react'
import { Lock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { NoticeBanner } from '@/components/shared/feedback'
import { FilterSelect, SearchInput } from '@/components/shared/form-controls'
import { SectionCard } from '@/components/shared/section-card'
import { useCatalog } from '@/hooks/use-catalog'
import { useCompanyPermissions } from '@/hooks/use-company-permissions'
import type { DemoResult } from '@/hooks/use-demo-result'
import { filterCatalog, itemsFor, type AvailabilityFilter, type PublicationFilter } from '@/lib/catalog'
import { publicationToDto } from '@/services/catalog.service'
import { useAppDispatch } from '@/store/hooks'
import { deleteCatalogItem, updateCatalogItem } from '@/store/slices/catalog-slice'
import type { CatalogItem, CatalogKind } from '@/types/catalog'
import type { Company } from '@/types/company'
import { ActivityForm, CourseForm } from './catalog-form'
import { CatalogPreviewDialog } from './catalog-preview-dialog'
import { ActivityTable, CourseTable, type CatalogRowActions } from './catalog-table'

const publicationItems: Record<PublicationFilter, string> = { all: 'All statuses', Published: 'Published', Draft: 'Draft' }
const availabilityItems: Record<AvailabilityFilter, string> = { all: 'Any availability', Available: 'Available', Seasonal: 'Seasonal', Unavailable: 'Unavailable' }

/** Activities or courses of one company: search, filters, table, add / edit / delete / publish / preview. */
export function CatalogManager({ kind, company }: { kind: CatalogKind, company: Company }) {
  const { items, loading, error, reload } = useCatalog(company.id)
  const { canManageCatalog } = useCompanyPermissions()
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState('')
  const [publication, setPublication] = useState<PublicationFilter>('all')
  const [availability, setAvailability] = useState<AvailabilityFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [previewing, setPreviewing] = useState<CatalogItem | null>(null)
  const [deleting, setDeleting] = useState<CatalogItem | null>(null)
  const [notice, setNotice] = useState<{ message: string, tone: 'success' | 'error' } | null>(null)
  const success = (message: string) => setNotice({ message, tone: 'success' })
  const failure = (message: string) => setNotice({ message, tone: 'error' })

  const noun = kind === 'activity' ? 'activity' : 'course'
  const plural = kind === 'activity' ? 'activities' : 'courses'
  const Noun = noun[0].toUpperCase() + noun.slice(1)
  const canManage = canManageCatalog(company.id)

  const all = loading || error ? [] : itemsFor(items, company.id, kind)
  const result: DemoResult<CatalogItem[]> = loading ? { status: 'loading' } : error ? { status: 'error', retry: reload } : { status: 'ready', data: all }
  const visible = filterCatalog(all, query, publication, availability)
  const filtered = query.trim() !== '' || publication !== 'all' || availability !== 'all'

  const openForm = (item: CatalogItem | null) => { setEditing(item); setFormOpen(true) }
  const actions: CatalogRowActions<CatalogItem> = {
    onPreview: setPreviewing,
    ...(canManage ? {
      onEdit: (item) => openForm(item),
      onTogglePublish: async (item) => {
        const next = item.publication === 'Published' ? 'Draft' : 'Published'
        const action = await dispatch(updateCatalogItem({ companyId: company.id, kind: item.kind, id: item.id, payload: { publication: publicationToDto(next) } }))
        if (updateCatalogItem.fulfilled.match(action)) success(`${item.name} ${next === 'Published' ? 'published — it now appears on the website' : 'moved to draft and hidden from the website'}.`)
        else failure(`Couldn’t update ${item.name}: ${action.payload?.message ?? 'please try again.'}`)
      },
      onDelete: setDeleting,
    } : {}),
  }
  const remove = async (item: CatalogItem) => {
    const action = await dispatch(deleteCatalogItem({ companyId: company.id, kind: item.kind, id: item.id }))
    if (deleteCatalogItem.fulfilled.match(action)) success(`${item.name} deleted.`)
    else failure(`Couldn’t delete ${item.name}: ${action.payload?.message ?? 'please try again.'}`)
  }

  const addButton = canManage && <Button onClick={() => openForm(null)} className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light"><Plus data-icon="inline-start" />Add {Noun}</Button>

  return <>
    {notice && <NoticeBanner message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />}

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
      ? <ActivityForm open={formOpen} onOpenChange={setFormOpen} company={company} item={editing} onSaved={(_, mode, name) => success(`${name} ${mode}.`)} />
      : <CourseForm open={formOpen} onOpenChange={setFormOpen} company={company} item={editing} onSaved={(_, mode, name) => success(`${name} ${mode}.`)} />)}

    <CatalogPreviewDialog item={previewing} company={company} onOpenChange={(open) => !open && setPreviewing(null)} />

    <ConfirmDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)} destructive
      title={`Delete this ${noun}?`} confirmLabel={`Delete ${noun}`}
      description={<>“{deleting?.name}” will be permanently removed from {company.name} and from the website. Other companies are not affected.</>}
      onConfirm={() => { if (deleting) void remove(deleting) }} />
  </>
}
