import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CompanyStatus } from '@/types/company'

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const active = status === 'Active'
  return <Badge variant="outline" className={cn('gap-1.5 font-medium', active ? 'border-sea/25 bg-sea/10 text-[#13857b]' : 'border-slate-200 bg-slate-50 text-slate-600')}>
    <span aria-hidden="true" className={cn('size-1.5 rounded-full', active ? 'bg-sea' : 'bg-slate-400')} />{status}
  </Badge>
}
