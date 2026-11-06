'use client'

import { CalendarDays, Clock3, FileText, Gauge, GraduationCap, MapPin, Mountain, User, UserCheck, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatDuration, formatPrice } from '@/lib/catalog'
import { monthNames, type CatalogItem } from '@/types/catalog'
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
          <div className="mb-1.5 flex flex-wrap items-center gap-2"><PublicationBadge status={item.publication} /><AvailabilityBadge status={item.availability} /><span className="text-xs text-slate-400">{item.category}</span>
            {item.kind === 'activity' && item.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{t}</span>)}</div>
          <DialogTitle className="text-xl text-ink">{item.name}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-slate-600">{item.shortDescription}</DialogDescription>
        </div>
        <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-mint/60 p-4 text-xs">
          <div><dt className="text-slate-400">Price</dt><dd className="mt-0.5 text-base font-bold text-ink">{formatPrice(item.price, item.currency)}<span className="text-xs font-normal text-slate-400"> / guest</span></dd></div>
          <div><dt className="flex items-center gap-1 text-slate-400"><Clock3 className="size-3" />Duration</dt><dd className="mt-0.5 font-semibold text-slate-700">{formatDuration(item.duration)}</dd></div>
          {item.kind === 'activity' && <>
            {item.timeSlots.length > 0 && <div><dt className="flex items-center gap-1 text-slate-400"><Clock3 className="size-3" />Time slots</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.timeSlots.join(', ')}</dd></div>}
            {item.totalSlots !== null && <div><dt className="flex items-center gap-1 text-slate-400"><Users className="size-3" />Total slots</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.totalSlots} per time slot</dd></div>}
            {item.difficulty && <div><dt className="flex items-center gap-1 text-slate-400"><Gauge className="size-3" />Difficulty</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.difficulty}</dd></div>}
            {item.minAge !== null && <div><dt className="flex items-center gap-1 text-slate-400"><UserCheck className="size-3" />Min age</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.minAge}+ years</dd></div>}
            {item.maxAltitude !== null && <div><dt className="flex items-center gap-1 text-slate-400"><Mountain className="size-3" />Max altitude</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.maxAltitude.toLocaleString('en-IN')} m</dd></div>}
            {item.bestSeasonMonths.length > 0 && <div><dt className="flex items-center gap-1 text-slate-400"><CalendarDays className="size-3" />Best season</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.bestSeasonMonths.map((m) => monthNames[m - 1]).join(', ')}</dd></div>}
            {item.locations.length > 0 && <div><dt className="flex items-center gap-1 text-slate-400"><MapPin className="size-3" />Locations</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.locations.join(', ')}</dd></div>}
            {item.skillLevel && <div><dt className="flex items-center gap-1 text-slate-400"><GraduationCap className="size-3" />Skill level</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.skillLevel}</dd></div>}
            {item.groupSize && <div><dt className="flex items-center gap-1 text-slate-400"><Users className="size-3" />Group size</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.groupSize}</dd></div>}
          </>}
          {item.kind === 'course' && <>
            <div><dt className="flex items-center gap-1 text-slate-400"><GraduationCap className="size-3" />Level</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.level}</dd></div>
            {item.instructor && <div><dt className="flex items-center gap-1 text-slate-400"><User className="size-3" />Instructor</dt><dd className="mt-0.5 font-semibold text-slate-700">{item.instructor}</dd></div>}
          </>}
        </dl>
        {item.description && <div>{item.kind === 'activity' && <h3 className="mb-1 text-xs font-semibold text-slate-700">About the experience</h3>}<p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">{item.description}</p></div>}
        {item.kind === 'activity' && item.highlights.length > 0 && <div>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">Highlights</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">{item.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
        </div>}
        {item.kind === 'activity' && ([['Learning outcomes', item.learningOutcomes], ['What’s included', item.inclusions], ['What to bring', item.whatToBring]] as const).map(([title, list]) => list.length > 0 && <div key={title}>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">{title}</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">{list.map((entry) => <li key={entry}>{entry}</li>)}</ul>
        </div>)}
        {item.kind === 'activity' && item.offerings.length > 0 && <div>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">Location details</h3>
          <ul className="space-y-1 text-sm text-slate-600">{item.offerings.map((o) => <li key={o.locationSlug}><span className="font-medium text-slate-700">{o.locationSlug}</span> · {o.status} · {formatPrice(o.price ?? item.price, item.currency)} · {o.duration || formatDuration(item.duration)}{o.meetingPoint && ` · ${o.meetingPoint}`}</li>)}</ul>
        </div>}
        {item.kind === 'activity' && item.faqs.length > 0 && <div>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">FAQs</h3>
          <dl className="space-y-2 text-sm">{item.faqs.map((f) => <div key={f.question}><dt className="font-medium text-slate-700">{f.question}</dt>{f.answer && <dd className="text-slate-600">{f.answer}</dd>}</div>)}</dl>
        </div>}
        {item.kind === 'activity' && item.itinerary && <a href={item.itinerary.url} className="flex w-fit items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-forest hover:bg-slate-50"><FileText className="size-3.5" />Download itinerary ({item.itinerary.fileName})</a>}
        {item.kind === 'course' && item.modules.length > 0 && <div>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">Curriculum</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">{item.modules.map((m) => <li key={m.id}>{m.title}</li>)}</ol>
        </div>}
        {item.kind === 'course' && item.prerequisites && <div><h3 className="mb-1 text-xs font-semibold text-slate-700">Prerequisites</h3><p className="text-sm text-slate-600">{item.prerequisites}</p></div>}
        {item.gallery.length > 0 && <div className="grid grid-cols-4 gap-2">{item.gallery.map((src) => <CatalogThumb key={src} src={src} alt={`${item.name} gallery image`} color={company.color} />)}</div>}
        <p className="text-[11px] text-slate-400">Preview only — an approximation of the customer view. Only published records are returned by the website API.</p>
      </>}
    </DialogContent>
  </Dialog>
}
