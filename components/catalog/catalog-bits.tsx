'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AvailabilityStatus, PublicationStatus } from '@/types/catalog'

/** Cover image / thumbnail with a neutral placeholder when there is no image or it fails to load. */
export function CatalogThumb({ src, alt, color, size = 'md' }: { src: string | null, alt: string, color: string, size?: 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false)
  const box = size === 'lg' ? 'aspect-[16/9] w-full rounded-2xl' : 'size-11 shrink-0 rounded-xl'
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary URLs from the form; next/image would need every host whitelisted
    return <img src={src} alt={alt} onError={() => setFailed(true)} className={cn(box, 'bg-slate-100 object-cover')} />
  }
  if (size === 'lg') {
    // Large placeholder uses a soft tint so an empty preview doesn't dominate the dialog.
    return <span role="img" aria-label={`${alt} (no image yet)`} className={cn(box, 'flex flex-col items-center justify-center gap-2 text-xs font-medium')} style={{ backgroundColor: `${color}1f`, color }}>
      <ImageIcon className="size-8" />No image yet
    </span>
  }
  return <span role="img" aria-label={`${alt} (no image yet)`} className={cn(box, 'flex items-center justify-center text-white/90')} style={{ backgroundColor: color }}>
    <ImageIcon className="size-4" />
  </span>
}

export function PublicationBadge({ status }: { status: PublicationStatus }) {
  const published = status === 'Published'
  return <Badge variant="outline" className={cn('gap-1.5 font-medium', published ? 'border-sea/25 bg-sea/10 text-[#13857b]' : 'border-slate-200 bg-slate-50 text-slate-600')}>
    <span aria-hidden="true" className={cn('size-1.5 rounded-full', published ? 'bg-sea' : 'bg-slate-400')} />{status}
  </Badge>
}

const availabilityTone: Record<AvailabilityStatus, string> = {
  Available: 'border-forest/15 bg-white text-forest',
  Seasonal: 'border-gold/30 bg-gold-soft text-gold-dark',
  Unavailable: 'border-red-200 bg-red-50 text-red-700',
}

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  return <Badge variant="outline" className={cn('font-medium', availabilityTone[status])}>{status}</Badge>
}
