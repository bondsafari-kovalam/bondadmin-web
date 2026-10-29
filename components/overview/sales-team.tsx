'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { count, percent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RepRow } from '@/types/dashboard'

export function SalesTeam({ team }: { team: RepRow[] }) {
  return <ul className="flex flex-col divide-y divide-slate-50">
    {team.map((row) => <li key={row.rep.id} className={cn('flex items-center gap-3 py-3', row.isCurrentUser && '-mx-3 rounded-xl bg-gold-soft/60 px-3')}>
      <Avatar className="size-9"><AvatarFallback className="bg-slate-100 text-[11px] text-slate-600">{row.rep.initials}</AvatarFallback></Avatar>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-slate-700">{row.rep.name}{row.isCurrentUser && <span className="ml-1.5 rounded-full bg-gold px-1.5 py-0.5 text-[10px] text-white">You</span>}</div>
        <div className="text-[11px] text-slate-400">{count(row.converted)} of {count(row.assigned)} converted · {row.followUpsDue} follow-ups due</div>
      </div>
      <div className="text-right"><div className="text-xs font-semibold text-sea">{percent(row.conversion)}</div><div className="text-[10px] text-slate-400">conversion</div></div>
    </li>)}
  </ul>
}
