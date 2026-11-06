import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import { toApiError, type ApiError } from '@/lib/api/errors'
import { companiesService, type CompanyDto, type CompanyPayload } from '@/services/companies.service'
import { logout, sessionExpired } from '@/store/slices/auth-slice'

export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export const companiesAdapter = createEntityAdapter<CompanyDto>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

const initialState = companiesAdapter.getInitialState({
  status: 'idle' as LoadStatus,
  error: null as ApiError | null,
})

type ThunkConfig = { rejectValue: ApiError }

export const fetchCompanies = createAsyncThunk<CompanyDto[], void, ThunkConfig>('companies/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await companiesService.list()
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const createCompany = createAsyncThunk<CompanyDto, CompanyPayload, ThunkConfig>('companies/create', async (payload, { rejectWithValue }) => {
  try {
    return await companiesService.create(payload)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const updateCompany = createAsyncThunk<CompanyDto, { id: string, payload: CompanyPayload }, ThunkConfig>('companies/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await companiesService.update(id, payload)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const deleteCompany = createAsyncThunk<string, string, ThunkConfig>('companies/delete', async (id, { rejectWithValue }) => {
  try {
    await companiesService.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const uploadCompanyLogo = createAsyncThunk<CompanyDto, { id: string, file: File }, ThunkConfig>('companies/uploadLogo', async ({ id, file }, { rejectWithValue }) => {
  try {
    return await companiesService.uploadLogo(id, file)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const removeCompanyLogo = createAsyncThunk<CompanyDto, string, ThunkConfig>('companies/removeLogo', async (id, { rejectWithValue }) => {
  try {
    return await companiesService.removeLogo(id)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.status = 'succeeded'
        companiesAdapter.setAll(state, action.payload)
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? toApiError(action.error)
      })
      .addCase(createCompany.fulfilled, (state, action) => { companiesAdapter.addOne(state, action.payload) })
      .addCase(updateCompany.fulfilled, (state, action) => { companiesAdapter.setOne(state, action.payload) })
      .addCase(uploadCompanyLogo.fulfilled, (state, action) => { companiesAdapter.setOne(state, action.payload) })
      .addCase(removeCompanyLogo.fulfilled, (state, action) => { companiesAdapter.setOne(state, action.payload) })
      .addCase(deleteCompany.fulfilled, (state, action) => { companiesAdapter.removeOne(state, action.payload) })
      // Never show one user's companies to the next user.
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default companiesSlice.reducer
