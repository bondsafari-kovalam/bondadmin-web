import { cn } from '@/lib/utils'

/** Soft coloured wave along the bottom of a stat card. Set the colour with a text-* class. */
export function WaveAccent({ className }: { className: string }) {
  return <svg aria-hidden="true" viewBox="0 0 320 64" preserveAspectRatio="none" fill="currentColor" className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full', className)}>
    <path fillOpacity="0.28" d="M0 64V40C60 56 120 58 180 40C235 24 280 12 320 4V64Z" />
    <path fillOpacity="0.5" d="M0 64V54C70 64 140 62 205 48C250 38 290 28 320 22V64Z" />
  </svg>
}
