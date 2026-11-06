'use client'

import { useCallback, useMemo } from 'react'
import { useAppSelector } from '@/store/hooks'
import { selectCurrentUser } from '@/store/selectors'
import type { CompanyId } from '@/types/company'

// Permission keys from the backend (src/modules/auth/rbac/permissions.ts).
const COMPANIES_CREATE = 'companies.create'
const COMPANIES_MANAGE = 'companies.manage'
const COMPANY_UPDATE = 'company.update'
const CATALOG_MANAGE = 'catalog.manage'
const INBOX_READ = 'inbox.read'
const INBOX_REPLY = 'inbox.reply'
const SOCIAL_CHANNELS_MANAGE = 'social.channels.manage'

/**
 * What the signed-in user may do with companies, from GET /auth/me. Only shapes the UI;
 * the backend enforces the same rules on every request.
 */
export function useCompanyPermissions() {
  const user = useAppSelector(selectCurrentUser)

  const platform = useMemo(() => new Set(user?.platformPermissions ?? []), [user])

  /** Mirrors backend getCompanyPermissions(): membership permissions, plus platform ones with access-all. */
  const hasCompanyPermission = useCallback((id: CompanyId, permission: string) => {
    if (!user) return false
    if (user.canAccessAllCompanies && platform.has(permission)) return true
    return user.companies.some((c) => c.id === id && c.permissions.includes(permission))
  }, [user, platform])

  const canEditCompany = useCallback((id: CompanyId) => hasCompanyPermission(id, COMPANY_UPDATE), [hasCompanyPermission])
  const canManageCatalog = useCallback((id: CompanyId) => hasCompanyPermission(id, CATALOG_MANAGE), [hasCompanyPermission])
  const canReadInbox = useCallback((id: CompanyId) => hasCompanyPermission(id, INBOX_READ), [hasCompanyPermission])
  const canReplyInbox = useCallback((id: CompanyId) => hasCompanyPermission(id, INBOX_REPLY), [hasCompanyPermission])
  const canManageSocialChannels = useCallback((id: CompanyId) => hasCompanyPermission(id, SOCIAL_CHANNELS_MANAGE), [hasCompanyPermission])

  return {
    canCreateCompany: platform.has(COMPANIES_CREATE),
    /** Change status or code, and delete companies. */
    canManageCompanies: platform.has(COMPANIES_MANAGE),
    canEditCompany,
    /** Create, edit, publish and delete the company's activities and courses. */
    canManageCatalog,
    /** Read the Facebook, Instagram and WhatsApp messages of the company. */
    canReadInbox,
    canReplyInbox,
    /** Connect and disconnect the company's Page, Instagram account and WhatsApp number. */
    canManageSocialChannels,
  }
}
