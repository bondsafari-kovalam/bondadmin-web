import { cn } from '@/lib/utils'
import type { Company } from '@/types/company'

export function CompanyAvatar({ company, size = 'md' }: { company: Pick<Company, 'code' | 'color' | 'name'>, size?: 'md' | 'lg' }) {
  return <span aria-hidden="true" className={cn('flex shrink-0 items-center justify-center font-bold text-white', size === 'lg' ? 'size-16 rounded-2xl text-sm' : 'size-9 rounded-xl text-[10px]')} style={{ backgroundColor: company.color }}>
    {company.code}
  </span>
}
