import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { refreshAccessToken } from '@/lib/api/client'
import { toApiError, type ApiError } from '@/lib/api/errors'
import { authService, type CurrentUser, type LoginCredentials } from '@/services/auth.service'

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  /** Short-lived JWT, kept in memory only. */
  accessToken: string | null
  user: CurrentUser | null
  error: ApiError | null
}

const initialState: AuthState = { status: 'idle', accessToken: null, user: null, error: null }

interface Session { accessToken: string, user: CurrentUser }

export const login = createAsyncThunk<Session, LoginCredentials, { rejectValue: ApiError }>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { accessToken } = await authService.login(credentials)
    return { accessToken, user: await authService.me(accessToken) }
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

/** Restores a session after a page reload from the httpOnly refresh cookie. */
export const restoreSession = createAsyncThunk<Session, void, { rejectValue: ApiError }>('auth/restoreSession', async (_, { rejectWithValue }) => {
  try {
    const accessToken = await refreshAccessToken()
    return { accessToken, user: await authService.me(accessToken) }
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  // Logout always succeeds locally, even if the server call fails.
  await authService.logout().catch(() => undefined)
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    tokenRefreshed(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
    },
    sessionExpired(state) {
      Object.assign(state, initialState, { status: 'unauthenticated' })
    },
  },
  extraReducers: (builder) => {
    const signedIn = (state: AuthState, action: PayloadAction<Session>) => {
      state.status = 'authenticated'
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      state.error = null
    }
    builder
      .addCase(login.pending, (state) => { state.error = null })
      .addCase(login.fulfilled, signedIn)
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated'
        state.error = action.payload ?? toApiError(action.error)
      })
      .addCase(restoreSession.pending, (state) => { state.status = 'checking' })
      .addCase(restoreSession.fulfilled, signedIn)
      // No valid refresh cookie just means "not signed in", not an error to show.
      .addCase(restoreSession.rejected, (state) => { Object.assign(state, initialState, { status: 'unauthenticated' }) })
      .addCase(logout.fulfilled, (state) => { Object.assign(state, initialState, { status: 'unauthenticated' }) })
  },
})

export const { tokenRefreshed, sessionExpired } = authSlice.actions
export default authSlice.reducer
