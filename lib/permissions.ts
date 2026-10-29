// Mock role configuration for the prototype. This only shapes what the UI shows;
// it is NOT security. Real permissions must be enforced by the backend.
import type { Company, CompanyId } from '@/types/company'
import type { DemoUser, Role } from '@/types/dashboard'

export interface RolePermissions {
  /** See booked revenue, payments and other money figures. */
  viewRevenue: boolean
  createCompany: boolean
  /** Edit profile details of companies the user can access. */
  editCompany: boolean
  /** Activate / deactivate a company or change its code. */
  manageCompanyStatus: boolean
  /** Create, edit, delete and publish activities & courses of accessible companies. */
  manageCatalog: boolean
}

export const rolePermissions: Record<Role, RolePermissions> = {
  owner: { viewRevenue: true, createCompany: true, editCompany: true, manageCompanyStatus: true, manageCatalog: true },
  companyAdmin: { viewRevenue: true, createCompany: false, editCompany: true, manageCompanyStatus: false, manageCatalog: true },
  sales: { viewRevenue: false, createCompany: false, editCompany: false, manageCompanyStatus: false, manageCatalog: false },
}

export function canAccessCompany(user: DemoUser, id: CompanyId) {
  return user.companyIds === 'all' || user.companyIds.includes(id)
}

export function visibleCompanies<T extends Pick<Company, 'id'>>(user: DemoUser, companies: T[]) {
  return companies.filter((c) => canAccessCompany(user, c.id))
}
