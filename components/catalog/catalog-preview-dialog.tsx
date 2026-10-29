'use client'

import { Clock3, GraduationCap, MapPin, User, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatDuration, formatPrice } from '@/lib/catalog'
import type { CatalogItem } from '@/types/catalog'
import type { Company } from '@/types/company'
import { AvailabilityBadge, CatalogThumb, PublicationBadge } from './catalog-bits'

/** Approximates how the record would appear to customers. Not the live website. */
export function CatalogPreviewDialog({ item, company, onOpenChange }: { item: CatalogItem | null, company: Company, onOpenChange: (open: boolean) => void }) {
  return <Dialog open={item !== null} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-xl bg-white">
      {item && <>
        <div className="flex items-center gap-2 pr-8 text-[11px] text-slate-400">
          <span className="rounded-full bg-gold-soft px-2 py-0.5 font-bold uppercase tracking-wider text-gold-dark">Preview</span>
          <span className="truncate font-mono">/{company.code.toLowerCase().replace(/[^a-z0-9]/g, '')}/{item.kind === 'activity' ? 'activities' : 'courses'}/{item.slug}</span>
        </div>
        <CatalogThumb src={item.coverImage} alt={item.name} color={company.color} size="lg" />
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2"><PublicationBadge status={item.publication} /><AvailabilityBadge status={item.availability} /><span className="text-xs text-slate-400">{item.category}</span></div>
          <DialogTitle className="text-xl text-ink">{item.name}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-slate-600">{item.shortDescription}</DialogDescription>
        </div>
        <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-mint/60 p-4 text-xs">
          <div><dt className="text-slate-400">Price</dt><dd className="mt-0.5 text-base font-bold text-ink">{formatPrice(item.price, item.currency)}<span className="text-xs font-normal text-slate-400"> / guest</span></dd></div>
          <div><dt className="flex items-center gap-1 text-slate-400"><Clock3 className="size-3" />Duration</dt><dd className="mt-0.5 font-semibold text-slate-700">{formatDuration(item.duration)}</dd></div>
          {item.kind === 'activity' && <>
            {item.capacity !== null && <div><dt className="flex items-center gap-1 text-slate-400"><Users className="size-3" />Group size</dt><dd className="mt-0.5 font-semibold text-slate-700">Up to {item.capacity}</dd></div>}
            {item.locations.length > 0 && <div><dt className="flex items-center gap-1 text-slate-400"><MapPin className="size-3" />Locations</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.locations.join(', ')}</dd></div>}
          </>}
          {item.kind === 'course' && <>
            <div><dt className="flex items-center gap-1 text-slate-400"><GraduationCap className="size-3" />Level</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.level}</dd></div>
            {item.instructor && <div><dt className="flex items-center gap-1 text-slate-400"><User className="size-3" />Instructor</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.instructor}</dd></div>}
          </>}
        </dl>
        {item.description && <p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">{item.description}</p>}
        {item.kind === 'course' && item.modules.length > 0 && <div>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">Curriculum</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">{item.modules.map((m) => <li key={m.id}>{m.title}</li>)}</ol>
        </div>}
        {item.kind === 'course' && item.prerequisites && <div><h3 className="mb-1 text-xs font-semibold text-slate-700">Prerequisites</h3><p className="text-sm text-slate-600">{item.prerequisites}</p></div>}
        {item.gallery.length > 0 && <div className="grid grid-cols-4 gap-2">{item.gallery.map((src) => <CatalogThumb key={src} src={src} alt={`${item.name} gallery image`} color={company.color} />)}</div>}
        <p className="text-[11px] text-slate-400">Preview only — an approximation of the customer view. Nothing is published to a live website from this demo.</p>
      </>}
    </DialogContent>
  </Dialog>
}
