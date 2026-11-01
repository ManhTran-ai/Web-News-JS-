import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getArticleContent } from '@/api/endpoints';
import { toApiError } from '@/api/http';
import type { ArticleContent, RequestStatus } from '@/types/article';
import type { RootState } from '../index';

interface ContentEntry {
  status: RequestStatus;
  data: ArticleContent | null;
  error: string | null;
}

interface ArticleContentState {
  byId: Record<string, ContentEntry>;
}

const initialState: ArticleContentState = { byId: {} };

export const fetchArticleContent = createAsyncThunk(
  'articleContent/fetch',
  async (id: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const existing = state.articleContent.byId[id];
    if (existing?.data) return existing.data;

    try {
      return await getArticleContent(id);
    } catch (error) {
      return rejectWithValue(toApiError(error).message);
    }
  },
);

const articleContentSlice = createSlice({
  name: 'articleContent',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticleContent.pending, (state, action) => {
        const entry = (state.byId[action.meta.arg] ??= {
          status: 'loading',
          data: null,
          error: null,
        });
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(fetchArticleContent.fulfilled, (state, action) => {
        const entry = (state.byId[action.meta.arg] ??= {
          status: 'loading',
          data: null,
          error: null,
        });
        entry.status = 'succeeded';
        entry.data = action.payload;
      })
      .addCase(fetchArticleContent.rejected, (state, action) => {
        const entry = (state.byId[action.meta.arg] ??= {
          status: 'loading',
          data: null,
          error: null,
        });
        entry.status = 'failed';
        entry.error = (action.payload as string) ?? 'Không tải được nội dung bài viết';
      });
  },
});

export const articleContentReducer = articleContentSlice.reducer;

export const selectContentEntry = (state: RootState, id: string): ContentEntry | undefined =>
  state.articleContent.byId[id];
