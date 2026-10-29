'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { DemoState } from '@/hooks/use-demo-result'
import { demoUsers } from '@/lib/mock/dashboard-data'
import { rolePermissions, type RolePermissions } from '@/lib/permissions'
import type { DemoUser, Role } from '@/types/dashboard'

interface DemoContextValue {
  role: Role
  setRole: (role: Role) => void
  user: DemoUser
  permissions: RolePermissions
  demoState: DemoState
  setDemoState: (state: DemoState) => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

/** Demo role + UI-state switcher shared by every admin page. Not authentication. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('owner')
  const [demoState, setDemoState] = useState<DemoState>('normal')
  const value = useMemo(() => ({ role, setRole, user: demoUsers[role], permissions: rolePermissions[role], demoState, setDemoState }), [role, demoState])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const value = useContext(DemoContext)
  if (!value) throw new Error('useDemo must be used inside <DemoProvider>')
  return value
}
