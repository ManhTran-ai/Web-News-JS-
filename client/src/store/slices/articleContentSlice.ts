import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getArticleContent } from '@/api/endpoints';
import { ApiError, toApiError } from '@/api/http';
import { MAX_CACHED_CONTENTS } from '@/lib/constants';
import type { ArticleContent, RequestStatus } from '@/types/article';
import type { RootState } from '../index';

interface ContentEntry {
  status: RequestStatus;
  data: ArticleContent | null;
  error: string | null;
  code: string | null;
  fetchedAt: string | null;
}

interface ArticleContentState {
  contentsById: Record<string, ContentEntry>;
}

const initialState: ArticleContentState = { contentsById: {} };

function createEntry(): ContentEntry {
  return { status: 'loading', data: null, error: null, code: null, fetchedAt: null };
}

/**
 * Giữ cache ở mức tối đa MAX_CACHED_CONTENTS mục gần nhất để không phình bộ nhớ
 * khi người dùng đọc nhiều bài trong một phiên. Mục chưa tải được (không có
 * `fetchedAt`) bị loại trước vì không tái sử dụng được.
 */
function trimCache(state: ArticleContentState): void {
  const ids = Object.keys(state.contentsById);
  if (ids.length <= MAX_CACHED_CONTENTS) return;

  const oldest = ids
    .sort((a, b) => {
      const timeA = state.contentsById[a].fetchedAt;
      const timeB = state.contentsById[b].fetchedAt;
      if (timeA === timeB) return 0;
      if (timeA === null) return -1;
      if (timeB === null) return 1;
      return timeA.localeCompare(timeB);
    })
    .slice(0, ids.length - MAX_CACHED_CONTENTS);

  for (const id of oldest) {
    delete state.contentsById[id];
  }
}

/**
 * Thunk kiểm tra cache trước khi gọi API: endpoint `/content` chỉ cho phép
 * 30 request/phút nên bài đã đọc một lần sẽ không bị gọi lại.
 */
export const fetchArticleContent = createAsyncThunk(
  'articleContent/fetch',
  async (id: string, { getState, rejectWithValue }) => {
    const state = getState() as { articleContent: ArticleContentState };
    const existing = state.articleContent.contentsById[id];
    if (existing?.data) return existing.data;

    try {
      return await getArticleContent(id);
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

const articleContentSlice = createSlice({
  name: 'articleContent',
  initialState,
  reducers: {
    clearContent(state, action: PayloadAction<string>) {
      delete state.contentsById[action.payload];
    },
    clearAllContents(state) {
      state.contentsById = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticleContent.pending, (state, action) => {
        const entry = (state.contentsById[action.meta.arg] ??= createEntry());
        entry.status = 'loading';
        entry.error = null;
        entry.code = null;
      })
      .addCase(fetchArticleContent.fulfilled, (state, action) => {
        const entry = (state.contentsById[action.meta.arg] ??= createEntry());
        entry.status = 'succeeded';
        entry.data = action.payload;
        entry.error = null;
        entry.code = null;
        entry.fetchedAt = new Date().toISOString();
        trimCache(state);
      })
      .addCase(fetchArticleContent.rejected, (state, action) => {
        const entry = (state.contentsById[action.meta.arg] ??= createEntry());
        const apiError =
          action.payload instanceof ApiError ? action.payload : toApiError(action.error);
        entry.status = 'failed';
        entry.error = apiError.message;
        entry.code = apiError.code;
      });
  },
});

export const articleContentReducer = articleContentSlice.reducer;
export const { clearContent, clearAllContents } = articleContentSlice.actions;

export const selectContentEntry = (state: RootState, id: string): ContentEntry | undefined =>
  state.articleContent.contentsById[id];

export const selectContentsById = (state: RootState): Record<string, ContentEntry> =>
  state.articleContent.contentsById;

export const selectCachedContentCount = (state: RootState): number =>
  Object.keys(state.articleContent.contentsById).length;

/** Bài đã có nội dung trong cache hay chưa — dùng để biết có cần gọi API. */
export const selectHasCachedContent = (state: RootState, id: string): boolean =>
  Boolean(state.articleContent.contentsById[id]?.data);

export const selectContentUnavailable = (state: RootState, id: string): boolean =>
  state.articleContent.contentsById[id]?.code === 'CONTENT_UNAVAILABLE';
