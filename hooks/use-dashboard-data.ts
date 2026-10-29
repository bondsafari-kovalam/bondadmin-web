'use client'

import { type DemoState, type DemoResult, useDemoResult } from '@/hooks/use-demo-result'
import { getDashboardData } from '@/lib/dashboard'
import { demoDataset, emptyDataset } from '@/lib/mock/dashboard-data'
import type { Company } from '@/types/company'
import type { DashboardData, DashboardFilters } from '@/types/dashboard'

export type DashboardResult = DemoResult<DashboardData>

/** Single source for every Overview card. */
export function useDashboardData(filters: DashboardFilters, demoState: DemoState, companies: Company[]): DashboardResult {
  const { role, company, range } = filters
  return useDemoResult(
    (empty) => getDashboardData({ role, company, range }, { ...(empty ? emptyDataset : demoDataset), companies }),
    [role, company, range, companies.map((c) => [c.id, c.name, c.code, c.status, c.color])],
    demoState,
  )
}
