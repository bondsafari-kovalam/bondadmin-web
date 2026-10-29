import { BarChart3, BookOpen, BriefcaseBusiness, CalendarDays, CreditCard, LayoutDashboard, MessageSquareText, Settings, ShieldCheck, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import type { Role } from '@/types/dashboard'

/** Items without an href aren't built yet and render disabled. */
export interface NavItem { label: string, icon: LucideIcon, href?: string, roles?: Role[] }
export interface NavGroup { label: string, items: NavItem[] }

export const navGroups: NavGroup[] = [
  { label: 'Main', items: [
    { label: 'Overview', icon: LayoutDashboard, href: '/' },
    { label: 'Companies', icon: BriefcaseBusiness, href: '/companies' },
  ] },
  { label: 'Coming soon', items: [
    { label: 'Activities & Courses', icon: BookOpen, roles: ['owner', 'companyAdmin'] },
    { label: 'Bookings', icon: CalendarDays },
    { label: 'Customers & CRM', icon: Users },
    { label: 'Sales Team', icon: TrendingUp, roles: ['owner', 'companyAdmin'] },
    { label: 'Social Inbox', icon: MessageSquareText },
    { label: 'Payments & Discounts', icon: CreditCard, roles: ['owner', 'companyAdmin'] },
    { label: 'Reports & Analytics', icon: BarChart3, roles: ['owner', 'companyAdmin'] },
  ] },
  { label: 'System', items: [
    { label: 'Audit Logs', icon: ShieldCheck, roles: ['owner'] },
    { label: 'Settings', icon: Settings },
  ] },
]

/** Groups with only the items this role may see; empty groups are dropped. */
export function navGroupsFor(role: Role) {
  return navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.roles || item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0)
}
