import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getArticleContent } from '@/api/endpoints';
import type { ArticleContent, RequestStatus } from '@/types/article';
import type { RootState } from '../index';

interface ContentEntry {
  status: RequestStatus;
  data: ArticleContent | null;
  error: string | null;
}

interface ArticleContentState {
  contentsById: Record<string, ContentEntry>;
}

const initialState: ArticleContentState = { contentsById: {} };

export const fetchArticleContent = createAsyncThunk(
  'articleContent/fetch',
  async (id: string, { getState }) => {
    const state = getState() as { articleContent: ArticleContentState };
    const existing = state.articleContent.contentsById[id];
    if (existing?.data) return existing.data;

    return getArticleContent(id);
  },
);

const articleContentSlice = createSlice({
  name: 'articleContent',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticleContent.pending, (state, action) => {
        const entry = (state.contentsById[action.meta.arg] ??= {
          status: 'loading',
          data: null,
          error: null,
        });
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(fetchArticleContent.fulfilled, (state, action) => {
        const entry = (state.contentsById[action.meta.arg] ??= {
          status: 'loading',
          data: null,
          error: null,
        });
        entry.status = 'succeeded';
        entry.data = action.payload;
      })
      .addCase(fetchArticleContent.rejected, (state, action) => {
        const entry = (state.contentsById[action.meta.arg] ??= {
          status: 'loading',
          data: null,
          error: null,
        });
        entry.status = 'failed';
        entry.error = action.error.message ?? 'Không tải được nội dung bài viết';
      });
  },
});

export const articleContentReducer = articleContentSlice.reducer;

export const selectContentEntry = (state: RootState, id: string): ContentEntry | undefined =>
  state.articleContent.contentsById[id];

export const selectContentsById = (state: RootState): Record<string, ContentEntry> =>
  state.articleContent.contentsById;

export const selectCachedContentCount = (state: RootState): number =>
  Object.keys(state.articleContent.contentsById).length;
