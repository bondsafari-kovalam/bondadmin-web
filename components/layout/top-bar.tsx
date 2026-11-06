'use client'

import Link from 'next/link'
import { Bell, ChevronDown, ChevronRight, FlaskConical, LogOut, Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MobileNav } from '@/components/layout/mobile-nav'
import { avatarGradient } from '@/components/layout/sidebar-parts'
import type { DemoState } from '@/hooks/use-demo-result'
import { cn } from '@/lib/utils'
import type { Alert, DemoUser, Role } from '@/types/dashboard'

export const roleLabels: Record<Role, string> = { owner: 'Owner / Super Admin', companyAdmin: 'Company Admin', sales: 'Sales Team' }
const stateLabels: Record<DemoState, string> = { normal: 'Demo data', loading: 'Loading', empty: 'Empty', error: 'Error' }

export interface Crumb { label: string, href?: string }

export interface TopBarProps {
  user: DemoUser
  role: Role
  onRoleChange: (role: Role) => void
  demoState: DemoState
  onDemoStateChange: (state: DemoState) => void
  alerts: Alert[] | null
  scopeLabel: string
  crumbs: Crumb[]
  /** Signed-in backend account; the name/avatar shown are still the demo user's. */
  accountEmail?: string
  onSignOut: () => void
}

export function TopBar({ user, role, onRoleChange, demoState, onDemoStateChange, alerts, scopeLabel, crumbs, accountEmail, onSignOut }: TopBarProps) {
  return <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between gap-3 bg-white/30 px-4 backdrop-blur md:px-8">
    <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-sea/50 via-sea/15 to-transparent md:inset-x-8" />
    <div className="flex items-center gap-3">
      <MobileNav user={user} scopeLabel={scopeLabel} />
      <nav aria-label="Breadcrumb"><ol className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1
          return <li key={i} className={cn('flex min-w-0 items-center gap-2', !last && 'hidden md:flex')}>
            {i > 0 && <ChevronRight className="hidden size-3 shrink-0 md:block" />}
            {last ? <span aria-current="page" className="truncate text-base font-bold text-ink md:text-lg">{crumb.label}</span>
              : crumb.href ? <Link href={crumb.href} className="hover:text-slate-700">{crumb.label}</Link> : <span>{crumb.label}</span>}
          </li>
        })}
      </ol></nav>
    </div>
    <div className="flex items-center gap-1.5 sm:gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-10 items-center gap-1.5 rounded-full border border-gold/25 bg-gold-soft/80 px-4 text-xs font-medium text-gold-dark shadow-sm hover:bg-gold-soft">
          <FlaskConical className="size-3.5" /><span className="hidden sm:inline">Demo: {roleLabels[role]}{demoState !== 'normal' && ` · ${stateLabels[demoState]}`}</span><ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>View dashboard as (demo role)</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={role} onValueChange={(value: Role) => onRoleChange(value)}>
              {(Object.keys(roleLabels) as Role[]).map((r) => <DropdownMenuRadioItem key={r} value={r} closeOnClick>{roleLabels[r]}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Preview UI state</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={demoState} onValueChange={(value: DemoState) => onDemoStateChange(value)}>
              {(Object.keys(stateLabels) as DemoState[]).map((s) => <DropdownMenuRadioItem key={s} value={s} closeOnClick>{stateLabels[s]}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger aria-label={`Notifications${alerts?.length ? `, ${alerts.length} need attention` : ''}`} className="relative flex size-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-slate-50">
          <Bell className="size-[18px] text-ink" />
          {!!alerts?.length && <span aria-hidden="true" className="absolute top-2 right-2.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
            {alerts === null ? <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
              : alerts.length === 0 ? <DropdownMenuItem disabled>You&apos;re all caught up</DropdownMenuItem>
              : alerts.map((a) => <DropdownMenuItem key={a.kind} render={<a href={a.href} />} className="flex flex-col items-start gap-0.5 py-1.5">
                <span className="text-xs font-semibold">{a.title}</span><span className="text-[11px] text-muted-foreground">{a.description}</span>
              </DropdownMenuItem>)}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full bg-white p-1 shadow-sm hover:bg-slate-50 md:pr-3">
          <Avatar className="size-8"><AvatarFallback className={cn(avatarGradient, 'text-xs')}>{user.initials}</AvatarFallback></Avatar>
          <span className="hidden text-left md:block"><span className="block text-xs font-semibold">{user.name}</span><span className="block text-[11px] text-slate-400">{user.title}</span></span>
          <ChevronDown className="hidden size-3.5 text-slate-400 md:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup><DropdownMenuLabel className="truncate">{accountEmail ? `Signed in as ${accountEmail}` : 'Signed in'}</DropdownMenuLabel></DropdownMenuGroup>
          <DropdownMenuItem disabled><Settings />Account settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut}><LogOut />Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
}
