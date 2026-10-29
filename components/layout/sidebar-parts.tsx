'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { navGroupsFor, type NavItem } from '@/components/layout/nav-items'
import { salesReps } from '@/lib/mock/dashboard-data'
import { canAccessCompany } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import type { DemoUser, Role } from '@/types/dashboard'

/** Brand logo; the collapsed sidebar shows only the emblem, since the wordmark would be too small to read. */
export function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) return <Image src="/brand/bond-mark.png" alt="Bond" width={256} height={177} priority className="h-9 w-auto" />
  return <Link href="/" aria-label="Bond Central — go to Overview" className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
    <Image src="/brand/bond-logo.png" alt="Bond" width={640} height={368} priority className="h-16 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]" />
    <span className="text-[10px] leading-tight font-semibold uppercase tracking-[0.2em] text-white/55">Central<br />Admin</span>
  </Link>
}

/** Centered avatar card; switches to a single row on short screens. */
export function Profile({ user, compact = false }: { user: DemoUser, compact?: boolean }) {
  if (compact) return <div className="flex justify-center py-3" title={`${user.name} · ${user.title}`}>
    <Avatar className="size-10 ring-2 ring-white/15"><AvatarFallback className="bg-gold text-xs font-bold text-white">{user.initials}</AvatarFallback></Avatar>
  </div>
  return <div className={cn('mx-4 flex flex-col items-center rounded-2xl bg-white/5 px-3 py-4 text-center', '[@media(max-height:820px)]:flex-row [@media(max-height:820px)]:gap-3 [@media(max-height:820px)]:py-2.5 [@media(max-height:820px)]:text-left')}>
    <Avatar className={cn('size-16 shrink-0 ring-4 ring-white/15', '[@media(max-height:820px)]:size-10 [@media(max-height:820px)]:ring-2')}><AvatarFallback className={cn('bg-gold text-lg font-bold text-white', '[@media(max-height:820px)]:text-xs')}>{user.initials}</AvatarFallback></Avatar>
    <div className={cn('mt-3 min-w-0', '[@media(max-height:820px)]:mt-0')}>
      <div className="truncate text-sm font-bold uppercase tracking-wider text-white">{user.name}</div>
      <div className="truncate text-[11px] text-white/60">{user.title}</div>
    </div>
  </div>
}

// Two transparent corner squares whose box-shadows paint the inverted curves above and below the tab.
const navTab = "rounded-l-full before:pointer-events-none before:absolute before:-top-5 before:right-0 before:size-5 before:rounded-br-[20px] before:shadow-[6px_6px_0_6px_var(--color-mint)] before:content-[''] after:pointer-events-none after:absolute after:right-0 after:-bottom-5 after:size-5 after:rounded-tr-[20px] after:shadow-[6px_-6px_0_6px_var(--color-mint)] after:content-['']"

const isActive = (href: string | undefined, path: string) => !!href && (href === '/' ? path === '/' : path.startsWith(href))

function NavLink({ item, collapsed, tab, current, onNavigate }: { item: NavItem, collapsed: boolean, tab: boolean, current: string, onNavigate: (href: string) => void }) {
  const { label, icon: Icon, href } = item
  const active = isActive(href, current)
  const className = cn('relative z-10 flex items-center gap-3 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors duration-300',
    collapsed && 'justify-center px-0',
    // In tab mode the mint background is the sliding indicator behind the link, not the link itself.
    active ? cn('text-forest', tab ? 'mr-0' : 'mr-4 rounded-full bg-mint')
      : href ? 'mr-4 rounded-full text-white/85 hover:bg-white/10 hover:text-white'
      : 'mr-4 cursor-not-allowed rounded-full text-white/45')
  const content = <>
    <Icon className={cn('size-[17px] shrink-0 transition-colors duration-300', active ? 'text-gold' : href ? 'text-gold/80' : 'text-white/35')} />
    {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
  </>
  return href
    ? <Link href={href} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined} onClick={() => onNavigate(href)} className={className}>{content}</Link>
    : <button type="button" disabled title={`${label} — coming soon`} aria-label={`${label} (coming soon)`} className={className}>{content}</button>
}

/**
 * Grouped navigation shared by the desktop sidebar and the mobile sheet.
 * In "tab" mode a single mint indicator slides to the active item and curves into the page background.
 */
export function NavGroups({ role, collapsed, tab, onNavigate }: { role: Role, collapsed: boolean, tab: boolean, onNavigate?: () => void }) {
  const pathname = usePathname()
  // Highlight the clicked item straight away instead of waiting for the route to finish loading.
  const [pending, setPending] = useState<string | null>(null)
  useEffect(() => setPending(null), [pathname])
  const current = pending ?? pathname

  const navRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<{ top: number, height: number } | null>(null)
  const [animate, setAnimate] = useState(false)
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!tab || !nav) return
    const measure = () => {
      const el = nav.querySelector<HTMLElement>('[aria-current="page"]')
      setIndicator(el ? { top: el.offsetTop, height: el.offsetHeight } : null)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [tab, current, collapsed])
  // Enable the slide only after the first position is set, so the tab doesn't fly in on page load.
  useEffect(() => { const id = requestAnimationFrame(() => setAnimate(true)); return () => cancelAnimationFrame(id) }, [])

  return <div ref={navRef} className="relative">
    {tab && indicator && <div aria-hidden="true" className={cn('pointer-events-none absolute right-0 left-4 bg-mint', navTab, animate && 'transition-[top,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none')} style={{ top: indicator.top, height: indicator.height }} />}
    {navGroupsFor(role).map((group, i) => <div key={group.label} className={cn('pl-4', i > 0 && 'mt-4')}>
      {collapsed
        ? (i > 0 && <div aria-hidden="true" className="mr-4 mb-3 border-t border-white/10" />)
        : <div className="mb-1.5 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{group.label}</div>}
      <ul className="flex flex-col gap-1" aria-label={collapsed ? group.label : undefined}>
        {group.items.map((item) => <li key={item.label}><NavLink item={item} collapsed={collapsed} tab={tab} current={current} onNavigate={(href) => { setPending(href); onNavigate?.() }} /></li>)}
      </ul>
    </div>)}
  </div>
}

export function WorkspaceNote({ scopeLabel }: { scopeLabel: string }) {
  return <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
    <Zap className="size-3.5 shrink-0 text-gold" />
    <div className="min-w-0"><div className="text-[10px] font-semibold uppercase tracking-wider text-gold">Workspace</div><p className="truncate text-xs text-white/70">{scopeLabel}</p></div>
  </div>
}

export function TeamStrip({ user }: { user: DemoUser }) {
  const team = salesReps.filter((rep) => rep.companyIds.some((id) => canAccessCompany(user, id)))
  if (!team.length) return null
  return <div className={cn('flex items-center justify-between gap-2 px-1', '[@media(max-height:820px)]:hidden')}>
    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Sales team</span>
    <div className="flex -space-x-1">
      {team.map((rep) => <Avatar key={rep.id} className="size-7 ring-2 ring-forest" title={rep.name}><AvatarFallback className="bg-forest-light text-[9px] font-semibold text-white">{rep.initials}</AvatarFallback></Avatar>)}
    </div>
  </div>
}
