'use client'

import { useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { configureApiClient } from '@/lib/api/client'
import { makeStore } from '@/store'
import { sessionExpired, tokenRefreshed } from '@/store/slices/auth-slice'

/** Creates the Redux store once per tab and connects the API client to it. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => {
    const created = makeStore()
    configureApiClient({
      getAccessToken: () => created.getState().auth.accessToken,
      onTokenRefreshed: (token) => created.dispatch(tokenRefreshed(token)),
      onSessionExpired: () => created.dispatch(sessionExpired()),
    })
    return created
  })
  return <Provider store={store}>{children}</Provider>
}
