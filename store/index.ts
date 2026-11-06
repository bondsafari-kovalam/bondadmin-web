import { combineReducers, configureStore } from '@reduxjs/toolkit'
import authReducer from '@/store/slices/auth-slice'
import catalogReducer from '@/store/slices/catalog-slice'
import companiesReducer from '@/store/slices/companies-slice'

const rootReducer = combineReducers({
  auth: authReducer,
  companies: companiesReducer,
  catalog: catalogReducer,
})

/** One store per browser tab, created by <StoreProvider> (never shared between requests). */
export function makeStore() {
  return configureStore({ reducer: rootReducer })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = AppStore['dispatch']
