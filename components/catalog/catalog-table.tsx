'use client'

import type { ReactNode } from 'react'
import { Eye, EyeOff, Pencil, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDuration, formatPrice } from '@/lib/catalog'
import type { Activity, CatalogItem, Course } from '@/types/catalog'
import { AvailabilityBadge, CatalogThumb, PublicationBadge } from './catalog-bits'

export interface CatalogRowActions<T extends CatalogItem> {
  onPreview: (item: T) => void
  /** Omit the editing callbacks for read-only roles. */
  onEdit?: (item: T) => void
  onTogglePublish?: (item: T) => void
  onDelete?: (item: T) => void
}

interface Column<T> { header: string, cell: (item: T) => ReactNode, className?: string }

interface CatalogTableProps<T extends CatalogItem> extends CatalogRowActions<T> {
  label: string
  items: T[]
  color: string
  /** Kind-specific columns shown between the name and the status. */
  columns: Column<T>[]
}

function RowActions<T extends CatalogItem>({ item, onPreview, onEdit, onTogglePublish, onDelete }: CatalogRowActions<T> & { item: T }) {
  const published = item.publication === 'Published'
  return <div className="flex items-center justify-end gap-1">
    <Button variant="ghost" size="icon" title="Preview" aria-label={`Preview ${item.name}`} onClick={() => onPreview(item)}><Eye className="size-4 text-slate-500" /></Button>
    {onEdit && <Button variant="ghost" size="icon" title="Edit" aria-label={`Edit ${item.name}`} onClick={() => onEdit(item)}><Pencil className="size-4 text-slate-500" /></Button>}
    {onTogglePublish && <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs" aria-label={`${published ? 'Unpublish' : 'Publish'} ${item.name}`} onClick={() => onTogglePublish(item)}>
      {published ? <><EyeOff data-icon="inline-start" />Unpublish</> : <><Send data-icon="inline-start" />Publish</>}
    </Button>}
    {onDelete && <Button variant="ghost" size="icon" title="Delete" aria-label={`Delete ${item.name}`} onClick={() => onDelete(item)}><Trash2 className="size-4 text-red-500" /></Button>}
  </div>
}

/** Shared table (desktop) + card list (mobile) for activities and courses. */
export function CatalogTable<T extends CatalogItem>({ label, items, color, columns, ...actions }: CatalogTableProps<T>) {
  return <>
    <Table aria-label={label} className="hidden min-w-[760px] text-xs md:table">
      <TableHeader><TableRow className="border-slate-100 hover:bg-transparent">
        <TableHead className="pl-6 text-xs font-medium text-slate-400">Name</TableHead>
        {columns.map((c) => <TableHead key={c.header} className={`px-3 text-xs font-medium text-slate-400 ${c.className ?? ''}`}>{c.header}</TableHead>)}
        <TableHead className="px-3 text-xs font-medium text-slate-400">Status</TableHead>
        <TableHead className="pr-6 text-right text-xs font-medium text-slate-400">Actions</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {items.map((item) => <TableRow key={item.id} className="border-slate-50 hover:bg-gold-soft/30">
          <TableCell className="py-3 pr-3 pl-6">
            <div className="flex items-center gap-3">
              <CatalogThumb src={item.coverImage} alt={item.name} color={color} />
              <div className="min-w-0 max-w-[260px]">
                <div className="truncate font-semibold text-slate-700">{item.name}</div>
                <div className="truncate text-[11px] text-slate-400" title={item.shortDescription}>{item.shortDescription}</div>
              </div>
            </div>
          </TableCell>
          {columns.map((c) => <TableCell key={c.header} className={`px-3 text-slate-600 ${c.className ?? ''}`}>{c.cell(item)}</TableCell>)}
          <TableCell className="px-3"><PublicationBadge status={item.publication} /></TableCell>
          <TableCell className="pr-6"><RowActions item={item} {...actions} /></TableCell>
        </TableRow>)}
      </TableBody>
    </Table>

    <ul aria-label={label} className="flex flex-col gap-3 md:hidden">
      {items.map((item) => <li key={item.id} className="rounded-2xl border border-slate-100 p-4">
        <div className="flex items-start gap-3">
          <CatalogThumb src={item.coverImage} alt={item.name} color={color} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-700">{item.name}</div>
            <div className="text-[11px] text-slate-400">{item.category}</div>
          </div>
          <PublicationBadge status={item.publication} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {columns.filter((c) => c.header !== 'Category').map((c) => <div key={c.header}><dt className="text-[11px] text-slate-400">{c.header}</dt><dd className="mt-0.5 font-medium">{c.cell(item)}</dd></div>)}
        </dl>
        <div className="mt-3 border-t border-slate-50 pt-3"><RowActions item={item} {...actions} /></div>
      </li>)}
    </ul>
  </>
}

const price = (item: CatalogItem) => <span className="font-medium tabular-nums text-slate-700">{formatPrice(item.price, item.currency)}</span>
const duration = (item: CatalogItem) => <span className={item.duration ? '' : 'text-slate-400 italic'}>{formatDuration(item.duration)}</span>

export function ActivityTable(props: CatalogRowActions<Activity> & { items: Activity[], color: string }) {
  return <CatalogTable label="Activities" {...props} columns={[
    { header: 'Category', cell: (a) => a.category },
    { header: 'Price', cell: price },
    { header: 'Duration', cell: duration },
    { header: 'Availability', cell: (a) => <AvailabilityBadge status={a.availability} /> },
  ]} />
}

export function CourseTable(props: CatalogRowActions<Course> & { items: Course[], color: string }) {
  return <CatalogTable label="Courses" {...props} columns={[
    { header: 'Category', cell: (c) => c.category },
    { header: 'Level', cell: (c) => c.level },
    { header: 'Duration', cell: duration },
    { header: 'Price', cell: price },
    { header: 'Availability', cell: (c) => <AvailabilityBadge status={c.availability} /> },
  ]} />
}
