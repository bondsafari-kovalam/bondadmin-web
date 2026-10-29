'use client'

import { ChevronRight, ClipboardList, Clock3, CreditCard, Users, type LucideIcon } from 'lucide-react'
import { count } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Alert } from '@/types/dashboard'

const alertIcons: Record<Alert['kind'], LucideIcon> = { unassigned: Users, followups: Clock3, confirmations: ClipboardList, payments: CreditCard }
const toneClass: Record<Alert['tone'], string> = { amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', blue: 'bg-blue-50 text-blue-600' }

export function AttentionList({ alerts }: { alerts: Alert[] }) {
  return <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
    {alerts.map((alert) => {
      const Icon = alertIcons[alert.kind]
      return <li key={alert.kind}>
        <a href={alert.href} className="flex items-center gap-3 rounded-2xl bg-slate-50/70 p-3.5 transition-colors outline-none hover:bg-slate-100/80 focus-visible:ring-2 focus-visible:ring-ring/50">
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', toneClass[alert.tone])}><Icon className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-700">{alert.title}</span><span className="mt-0.5 block text-xs leading-snug text-slate-400">{alert.description}</span></span>
          <span className="text-sm font-bold text-slate-700">{count(alert.count)}</span>
          <ChevronRight className="size-3.5 text-slate-300" />
        </a>
      </li>
    })}
  </ul>
}
