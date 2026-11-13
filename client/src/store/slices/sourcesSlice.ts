import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getSources } from '@/api/endpoints';
import { toApiError } from '@/api/http';
import type { RequestStatus, Source } from '@/types/article';
import type { RootState } from '../index';

interface SourcesState {
  items: Source[];
  status: RequestStatus;
  error: string | null;
}

const initialState: SourcesState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchSources = createAsyncThunk('sources/fetch', async () => {
  return getSources();
});

const sourcesSlice = createSlice({
  name: 'sources',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSources.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSources.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSources.rejected, (state, action) => {
        state.status = 'failed';
        state.error = toApiError(action.error).message;
      });
  },
});

export const sourcesReducer = sourcesSlice.reducer;

export const selectSources = (state: RootState): Source[] => state.sources.items;
export const selectSourcesStatus = (state: RootState): RequestStatus => state.sources.status;
export const selectSourcesError = (state: RootState): string | null => state.sources.error;
