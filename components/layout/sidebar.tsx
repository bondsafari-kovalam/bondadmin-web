'use client'

import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Logo, NavGroups, Profile, TeamStrip, WorkspaceNote } from '@/components/layout/sidebar-parts'
import { cn } from '@/lib/utils'
import type { DemoUser } from '@/types/dashboard'

/**
 * Header and footer stay pinned inside the panel; only the middle (profile + menu) scrolls,
 * so nothing spills outside the rounded panel on short screens.
 */
export function Sidebar({ user, scopeLabel }: { user: DemoUser, scopeLabel: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose
  return <aside className={cn('sticky top-4 my-4 ml-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col rounded-[28px] bg-forest text-white shadow-[0_24px_48px_-24px_rgba(38,64,60,0.6)] transition-[width] lg:flex', collapsed ? 'w-[88px]' : 'w-[264px]')}>
    <div className={cn('flex shrink-0 items-center gap-2 pt-5 pb-4', collapsed ? 'flex-col px-2' : 'justify-between pr-4 pl-6')}>
      <Logo compact={collapsed} />
      <button type="button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex size-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white">
        <Toggle className="size-[17px]" />
      </button>
    </div>

    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Profile user={user} compact={collapsed} />
      <nav aria-label="Main" className="mt-5">
        <NavGroups role={user.role} collapsed={collapsed} tab />
      </nav>
    </div>

    {!collapsed && <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 px-4 pt-3 pb-4">
      <TeamStrip user={user} />
      <WorkspaceNote scopeLabel={scopeLabel} />
    </div>}
  </aside>
}
