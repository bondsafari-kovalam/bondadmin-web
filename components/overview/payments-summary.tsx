'use client'

import { RotateCcw } from 'lucide-react'
import { count, money, percent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PaymentSummary } from '@/types/dashboard'

export function PaymentsSummary({ payments }: { payments: PaymentSummary }) {
  const booked = payments.collected.amount + payments.pending.amount + payments.failed.amount
  const rows = [
    { label: 'Collected', value: payments.collected, color: 'bg-sea', text: 'text-sea' },
    { label: 'Pending', value: payments.pending, color: 'bg-gold', text: 'text-gold-dark' },
    { label: 'Failed', value: payments.failed, color: 'bg-red-400', text: 'text-red-600' },
  ]
  return <div className="flex flex-col gap-4">
    <div>
      <div className="text-[11px] text-slate-400">Collection rate</div>
      <div className="text-2xl font-bold text-ink">{percent(booked ? payments.collected.amount / booked * 100 : 0)}</div>
    </div>
    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
      {rows.map((r) => <div key={r.label} className={r.color} style={{ width: `${booked ? r.value.amount / booked * 100 : 0}%` }} />)}
    </div>
    <ul className="flex flex-col gap-2.5 text-xs">
      {rows.map((r) => <li key={r.label} className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-slate-600"><span className={cn('size-2.5 rounded-full', r.color)} />{r.label} <span className="text-slate-400">· {count(r.value.count)}</span></span>
        <span className={cn('font-semibold', r.text)}>{money(r.value.amount)}</span>
      </li>)}
      <li className="flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span className="flex items-center gap-2 text-slate-600"><RotateCcw className="size-3 text-slate-400" />Refunded <span className="text-slate-400">· {count(payments.refunded.count)} cancelled</span></span>
        <span className="font-semibold text-slate-600">{money(payments.refunded.amount)}</span>
      </li>
    </ul>
    <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-400">Collected + pending + failed = booked revenue ({money(booked)}). Refunds are on cancelled bookings, so they aren&apos;t in booked revenue.</p>
  </div>
}
