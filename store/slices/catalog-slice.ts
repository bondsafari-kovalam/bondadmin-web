import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import { toApiError, type ApiError } from '@/lib/api/errors'
import { catalogService, type ActivityFile, type CatalogItemDto, type CatalogPayload } from '@/services/catalog.service'
import { logout, sessionExpired } from '@/store/slices/auth-slice'
import { deleteCompany } from '@/store/slices/companies-slice'
import type { LoadStatus } from '@/store/slices/companies-slice'
import type { CatalogKind } from '@/types/catalog'

export const catalogAdapter = createEntityAdapter<CatalogItemDto>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

interface CompanyLoad { status: LoadStatus, error: ApiError | null }

const initialState = catalogAdapter.getInitialState({
  /** Load state per company; a company's activities and courses are fetched together. */
  byCompany: {} as Record<string, CompanyLoad>,
})

type ThunkConfig = { rejectValue: ApiError }

export const fetchCatalog = createAsyncThunk<CatalogItemDto[], string, ThunkConfig>('catalog/fetchForCompany', async (companyId, { rejectWithValue }) => {
  try {
    const [activities, courses] = await Promise.all([catalogService.list(companyId, 'activity'), catalogService.list(companyId, 'course')])
    return [...activities, ...courses]
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

interface WriteArgs { companyId: string, kind: CatalogKind, payload: CatalogPayload }

export const createCatalogItem = createAsyncThunk<CatalogItemDto, WriteArgs, ThunkConfig>('catalog/create', async ({ companyId, kind, payload }, { rejectWithValue }) => {
  try {
    return await catalogService.create(companyId, kind, payload)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

/** Edits a record; also used to publish / unpublish with `{ publication }`. */
export const updateCatalogItem = createAsyncThunk<CatalogItemDto, WriteArgs & { id: string }, ThunkConfig>('catalog/update', async ({ companyId, kind, id, payload }, { rejectWithValue }) => {
  try {
    return await catalogService.update(companyId, kind, id, payload)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const deleteCatalogItem = createAsyncThunk<string, { companyId: string, kind: CatalogKind, id: string }, ThunkConfig>('catalog/delete', async ({ companyId, kind, id }, { rejectWithValue }) => {
  try {
    await catalogService.remove(companyId, kind, id)
    return id
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

interface FileArgs { companyId: string, id: string, file: ActivityFile }

/** Uploads the activity image or itinerary PDF (after the activity itself is saved). */
export const uploadActivityFile = createAsyncThunk<CatalogItemDto, FileArgs & { data: File }, ThunkConfig>('catalog/uploadActivityFile', async ({ companyId, id, file, data }, { rejectWithValue }) => {
  try {
    return await catalogService.uploadActivityFile(companyId, id, file, data)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const removeActivityFile = createAsyncThunk<CatalogItemDto, FileArgs, ThunkConfig>('catalog/removeActivityFile', async ({ companyId, id, file }, { rejectWithValue }) => {
  try {
    return await catalogService.removeActivityFile(companyId, id, file)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const addGalleryImage = createAsyncThunk<CatalogItemDto, { companyId: string, id: string, data: File }, ThunkConfig>('catalog/addGalleryImage', async ({ companyId, id, data }, { rejectWithValue }) => {
  try {
    return await catalogService.addGalleryImage(companyId, id, data)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const removeGalleryImage = createAsyncThunk<CatalogItemDto, { companyId: string, id: string, imageId: string }, ThunkConfig>('catalog/removeGalleryImage', async ({ companyId, id, imageId }, { rejectWithValue }) => {
  try {
    return await catalogService.removeGalleryImage(companyId, id, imageId)
  } catch (err) {
    return rejectWithValue(toApiError(err))
  }
})

export const uploadCourseImage = createAsyncThunk<CatalogItemDto, { companyId: string, id: string, data: File }, ThunkConfig>('catalog/uploadCourseImage', async ({ companyId, id, data }, { rejectWithValue }) => {
  try { return await catalogService.uploadCourseImage(companyId, id, data) } catch (err) { return rejectWithValue(toApiError(err)) }
})

export const removeCourseImage = createAsyncThunk<CatalogItemDto, { companyId: string, id: string }, ThunkConfig>('catalog/removeCourseImage', async ({ companyId, id }, { rejectWithValue }) => {
  try { return await catalogService.removeCourseImage(companyId, id) } catch (err) { return rejectWithValue(toApiError(err)) }
})

export const addCourseGalleryImage = createAsyncThunk<CatalogItemDto, { companyId: string, id: string, data: File }, ThunkConfig>('catalog/addCourseGalleryImage', async ({ companyId, id, data }, { rejectWithValue }) => {
  try { return await catalogService.addCourseGalleryImage(companyId, id, data) } catch (err) { return rejectWithValue(toApiError(err)) }
})

export const removeCourseGalleryImage = createAsyncThunk<CatalogItemDto, { companyId: string, id: string, imageId: string }, ThunkConfig>('catalog/removeCourseGalleryImage', async ({ companyId, id, imageId }, { rejectWithValue }) => {
  try { return await catalogService.removeCourseGalleryImage(companyId, id, imageId) } catch (err) { return rejectWithValue(toApiError(err)) }
})

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalog.pending, (state, action) => {
        state.byCompany[action.meta.arg] = { status: 'loading', error: null }
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        const companyId = action.meta.arg
        // Replace this company's records only; other companies stay cached.
        catalogAdapter.removeMany(state, Object.values(state.entities).filter((i) => i?.companyId === companyId).map((i) => i!.id))
        catalogAdapter.upsertMany(state, action.payload)
        state.byCompany[companyId] = { status: 'succeeded', error: null }
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.byCompany[action.meta.arg] = { status: 'failed', error: action.payload ?? toApiError(action.error) }
      })
      .addCase(createCatalogItem.fulfilled, (state, action) => { catalogAdapter.addOne(state, action.payload) })
      .addCase(updateCatalogItem.fulfilled, (state, action) => { catalogAdapter.setOne(state, action.payload) })
      .addCase(uploadActivityFile.fulfilled, (state, action) => { catalogAdapter.setOne(state, action.payload) })
      .addCase(removeActivityFile.fulfilled, (state, action) => { catalogAdapter.setOne(state, action.payload) })
      .addCase(addGalleryImage.fulfilled, (state, action) => { catalogAdapter.setOne(state, action.payload) })
      .addCase(removeGalleryImage.fulfilled, (state, action) => { catalogAdapter.setOne(state, action.payload) })
      .addCase(uploadCourseImage.fulfilled, (state, action) => { catalogAdapter.setOne(state, action.payload) })
      .addCase(removeCourseImage.fulfilled, (state, action) => { catalogAdapter.setOne(state, action.payload) })
      .addCase(addCourseGalleryImage.fulfilled, (state, action) => { catalogAdapter.setOne(state, action.payload) })
      .addCase(removeCourseGalleryImage.fulfilled, (state, action) => { catalogAdapter.setOne(state, action.payload) })
      .addCase(deleteCatalogItem.fulfilled, (state, action) => { catalogAdapter.removeOne(state, action.payload) })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        catalogAdapter.removeMany(state, Object.values(state.entities).filter((i) => i?.companyId === action.payload).map((i) => i!.id))
        delete state.byCompany[action.payload]
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default catalogSlice.reducer
