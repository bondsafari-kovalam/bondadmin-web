'use client'

import { Inbox } from 'lucide-react'

export function EmptyState({ minHeight, text }: { minHeight: number, text: string }) {
  return <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50/70 px-6 text-center" style={{ minHeight }}>
    <div className="flex size-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm"><Inbox className="size-5" /></div>
    <p className="max-w-[260px] text-xs text-slate-500">{text}</p>
  </div>
}
