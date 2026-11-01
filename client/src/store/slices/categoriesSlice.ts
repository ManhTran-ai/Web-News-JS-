import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getCategories } from '@/api/endpoints';
import { toApiError } from '@/api/http';
import type { Category, RequestStatus } from '@/types/article';
import type { RootState } from '../index';

interface CategoriesState {
  items: Category[];
  status: RequestStatus;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchCategories = createAsyncThunk('categories/fetch', async () => {
  return getCategories();
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = toApiError(action.error).message;
      });
  },
});

export const categoriesReducer = categoriesSlice.reducer;

export const selectCategories = (state: RootState): Category[] => state.categories.items;
export const selectCategoriesStatus = (state: RootState): RequestStatus => state.categories.status;
export const selectCategoriesError = (state: RootState): string | null => state.categories.error;
