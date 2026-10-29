import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Standard content width and padding for every admin page. */
export function PageContainer({ children, className }: { children: ReactNode, className?: string }) {
  return <main className={cn('mx-auto max-w-[1680px] p-4 sm:p-6 lg:p-8 xl:px-10', className)}>{children}</main>
}

/** Pill that marks sample data until the backend is connected. */
export function DemoBadge() {
  return <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-dark">Demo data</span>
}

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Small line next to the demo badge, e.g. "as of 29 Oct". */
  meta?: ReactNode
  /** Filters and primary actions, shown on the right on wide screens. */
  actions?: ReactNode
  /** Optional visual before the title, e.g. a company avatar. */
  leading?: ReactNode
  /** Extra chips shown above the title, after the demo badge. */
  badges?: ReactNode
}

export function PageHeader({ title, description, meta, actions, leading, badges }: PageHeaderProps) {
  return <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
    <div className="flex min-w-0 items-center gap-4">
      {leading}
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">{badges}<DemoBadge />{meta && <span className="text-xs text-slate-400">{meta}</span>}</div>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
}
