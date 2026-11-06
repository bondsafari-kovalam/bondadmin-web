import { createSelector } from '@reduxjs/toolkit'
import { toCatalogItem } from '@/services/catalog.service'
import { toCompany } from '@/services/companies.service'
import type { RootState } from '@/store'
import { catalogAdapter } from '@/store/slices/catalog-slice'
import { companiesAdapter } from '@/store/slices/companies-slice'

const companySelectors = companiesAdapter.getSelectors((state: RootState) => state.companies)

/** UI-shaped companies (Dates, display status). Memoised so components re-render only on change. */
export const selectCompanies = createSelector([companySelectors.selectAll], (dtos) => dtos.map(toCompany))
export const selectCompaniesStatus = (state: RootState) => state.companies.status
export const selectCompaniesError = (state: RootState) => state.companies.error

export const selectAuthStatus = (state: RootState) => state.auth.status
export const selectCurrentUser = (state: RootState) => state.auth.user

const catalogSelectors = catalogAdapter.getSelectors((state: RootState) => state.catalog)

/** All loaded activities and courses (UI-shaped). Filter by company with `itemsFor()`. */
export const selectCatalogItems = createSelector([catalogSelectors.selectAll], (dtos) => dtos.map(toCatalogItem))
export const selectCatalogLoad = (state: RootState, companyId: string) => state.catalog.byCompany[companyId]
