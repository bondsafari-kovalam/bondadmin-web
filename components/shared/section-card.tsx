'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cardClass } from '@/components/shared/card-styles'
import { EmptyState } from '@/components/shared/empty-state'
import type { DemoResult } from '@/hooks/use-demo-result'
import { cn } from '@/lib/utils'
import type { DashboardData } from '@/types/dashboard'

interface SectionCardProps<T> {
  id?: string
  title: string
  description?: ReactNode
  action?: ReactNode
  result: DemoResult<T>
  /** Return true when there is nothing to show for the current filters. */
  isEmpty?: (data: T) => boolean
  emptyText?: string
  /** Height of the loading / empty / error placeholder. */
  minHeight?: number
  className?: string
  contentClassName?: string
  children: (data: T) => ReactNode
}

export function SectionCard<T = DashboardData>({ id, title, description, action, result, isEmpty, emptyText = 'Nothing to show for the selected filters.', minHeight = 200, className, contentClassName, children }: SectionCardProps<T>) {
  return <Card id={id} className={cn(cardClass, 'min-w-0 scroll-mt-24', className)}>
    <CardHeader className="flex flex-row items-start justify-between gap-3 px-6 pt-1 pb-1">
      <div className="min-w-0">
        <CardTitle className="text-[15px] font-semibold text-ink">{title}</CardTitle>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </div>
      {action && result.status === 'ready' && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </CardHeader>
    <CardContent className={cn('px-6', contentClassName)}>
      {result.status === 'loading' && <LoadingState minHeight={minHeight} />}
      {result.status === 'error' && <ErrorState minHeight={minHeight} onRetry={result.retry} />}
      {result.status === 'ready' && (isEmpty?.(result.data) ? <EmptyState minHeight={minHeight} text={emptyText} /> : children(result.data))}
    </CardContent>
  </Card>
}

function LoadingState({ minHeight }: { minHeight: number }) {
  return <div role="status" aria-label="Loading" className="flex flex-col gap-3" style={{ minHeight }}>
    <Skeleton className="h-4 w-1/3 rounded-full" />
    <Skeleton className="w-full flex-1 rounded-xl" />
    <Skeleton className="h-4 w-2/3 rounded-full" />
  </div>
}

function ErrorState({ minHeight, onRetry }: { minHeight: number, onRetry: () => void }) {
  return <div role="alert" className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-red-50/60 px-6 text-center" style={{ minHeight }}>
    <div className="flex size-10 items-center justify-center rounded-full bg-white text-red-500 shadow-sm"><AlertTriangle className="size-5" /></div>
    <p className="text-xs font-medium text-slate-700">Couldn&apos;t load this section</p>
    <Button variant="outline" size="sm" className="mt-1 h-8 rounded-full px-3.5 text-xs" onClick={onRetry}><RotateCw data-icon="inline-start" />Try again</Button>
  </div>
}
