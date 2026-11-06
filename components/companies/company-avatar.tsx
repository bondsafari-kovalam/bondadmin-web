'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Company } from '@/types/company'

const sizes = {
  sm: 'size-5 rounded-md text-[7px]',
  md: 'size-9 rounded-xl text-[10px]',
  lg: 'size-16 rounded-2xl text-sm',
}

/** Company logo, or its code on the company colour when there is no logo (or it fails to load). */
export function CompanyAvatar({ company, size = 'md', className }: { company: Pick<Company, 'code' | 'color' | 'name' | 'logoUrl'>, size?: keyof typeof sizes, className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showLogo = !!company.logoUrl && failedUrl !== company.logoUrl

  if (showLogo) {
    // Plain <img>: logos come from the API origin and are already small, versioned and cached.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={company.logoUrl} alt="" aria-hidden="true" loading="lazy" decoding="async" onError={() => setFailedUrl(company.logoUrl!)}
      className={cn('shrink-0 border border-slate-100 bg-white object-contain p-0.5', sizes[size], className)} />
  }
  return <span aria-hidden="true" className={cn('flex shrink-0 items-center justify-center font-bold text-white', sizes[size], className)} style={{ backgroundColor: company.color }}>
    {company.code}
  </span>
}
