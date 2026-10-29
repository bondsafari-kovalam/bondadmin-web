'use client'

import type { ReactNode } from 'react'
import { CircleCheck, X, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cardClass } from '@/components/shared/card-styles'

/** Dismissible success message shown after a save. */
export function NoticeBanner({ message, onDismiss }: { message: string, onDismiss: () => void }) {
  return <div role="status" className="mb-5 flex items-center gap-2 rounded-2xl border border-sea/25 bg-sea/10 px-4 py-2.5 text-xs text-[#13857b]">
    <CircleCheck className="size-4 shrink-0" />{message}
    <button type="button" onClick={onDismiss} aria-label="Dismiss" className="ml-auto rounded-full p-1 hover:bg-sea/10"><X className="size-3.5" /></button>
  </div>
}

/** Full-card message for not-found / no-access pages. */
export function StatusMessage({ icon: Icon, title, text, action }: { icon: LucideIcon, title: string, text: string, action?: ReactNode }) {
  return <Card className={cardClass}><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
    <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Icon className="size-5" /></span>
    <h1 className="text-lg font-semibold text-ink">{title}</h1>
    <p className="max-w-sm text-sm text-slate-500">{text}</p>
    {action && <div className="mt-2">{action}</div>}
  </CardContent></Card>
}
