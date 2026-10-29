'use client'

import { CalendarDays, CreditCard, MessageSquareText, RotateCcw, type LucideIcon } from 'lucide-react'
import { timeAgo } from '@/lib/format'
import { DEMO_NOW } from '@/lib/mock/dashboard-data'
import { cn } from '@/lib/utils'
import type { ActivityEvent } from '@/types/dashboard'

const eventLook: Record<ActivityEvent['kind'], { icon: LucideIcon, tone: string }> = {
  booking: { icon: CalendarDays, tone: 'bg-gold-soft text-gold-dark' },
  payment: { icon: CreditCard, tone: 'bg-sea/10 text-sea' },
  refund: { icon: RotateCcw, tone: 'bg-slate-100 text-slate-600' },
  enquiry: { icon: MessageSquareText, tone: 'bg-forest/10 text-forest' },
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return <div className="flex flex-col gap-4">
    <ul className="flex flex-col gap-4">
      {events.map((event) => {
        const { icon: Icon, tone } = eventLook[event.kind]
        return <li key={event.id} className="flex gap-3">
          <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', tone)}><Icon className="size-3.5" /></span>
          <div className="min-w-0"><div className="text-xs font-semibold text-slate-700">{event.title}</div><div className="truncate text-xs text-slate-400">{event.description}</div><div className="mt-0.5 text-[11px] text-slate-300">{timeAgo(event.at, DEMO_NOW)}</div></div>
        </li>
      })}
    </ul>
    <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-400">Generated from demo records — not a live audit log.</div>
  </div>
}
