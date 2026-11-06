'use client'

import { useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { configureApiClient } from '@/lib/api/client'
import { makeStore } from '@/store'
import { sessionExpired, tokenRefreshed } from '@/store/slices/auth-slice'

/** Creates the Redux store once per tab and connects the API client to it. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => makeStore())
  // Keep this out of the initializer: Strict Mode runs it twice and keeps the first result,
  // which would leave the API client bound to the discarded store (and a null token).
  configureApiClient({
    getAccessToken: () => store.getState().auth.accessToken,
    onTokenRefreshed: (token) => store.dispatch(tokenRefreshed(token)),
    onSessionExpired: () => store.dispatch(sessionExpired()),
  })
  return <Provider store={store}>{children}</Provider>
}
