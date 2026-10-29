import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BookingStatus, EnquiryStage, PaymentStatus } from '@/types/dashboard'

type Status = BookingStatus | PaymentStatus | EnquiryStage

const sea = 'border-sea/25 bg-sea/10 text-[#13857b]'
const gold = 'border-gold/30 bg-gold-soft text-gold-dark'
const forest = 'border-forest/20 bg-forest/10 text-forest'
const muted = 'border-slate-200 bg-slate-50 text-slate-600'

const tones: Record<Status, string> = {
  Confirmed: sea,
  Paid: sea,
  Converted: sea,
  Completed: forest,
  Contacted: forest,
  Pending: gold,
  Interested: gold,
  New: 'border-forest/15 bg-white text-forest',
  Failed: 'border-red-200 bg-red-50 text-red-700',
  Cancelled: muted,
  Refunded: muted,
  Void: muted,
  Lost: muted,
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge variant="outline" className={cn('font-medium', tones[status])}>{status}</Badge>
}

/** Chart colours for booking statuses, shared by the donut and its legend. */
export const bookingStatusColors: Record<BookingStatus, string> = {
  Confirmed: '#1fb2a6',
  Pending: '#d4a42e',
  Completed: '#3e5b56',
  Cancelled: '#cfd9d6',
}
