import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toApiError } from '@/api/http';
import { RELATED_CACHE_TTL_MS } from '@/lib/constants';
import type { Article, RequestStatus } from '@/types/article';
import { fetchRelated, selectCachedRelatedArticles } from './articlesSlice';
import type { RootState } from '../index';

interface RelatedEntry {
  items: Article[];
  status: RequestStatus;
  error: string | null;
  fetchedAt: number | null;
}

interface RelatedState {
  byId: Record<string, RelatedEntry>;
}

const initialState: RelatedState = { byId: {} };

function isFresh(entry: RelatedEntry | undefined): boolean {
  if (!entry) return false;
  if (entry.status === 'loading') return true;
  if (entry.fetchedAt === null) return false;
  return Date.now() - entry.fetchedAt < RELATED_CACHE_TTL_MS;
}

/**
 * Bài liên quan tới một bài viết — server đã trả sẵn danh sách cùng chuyên mục.
 *
 * Phần gọi API và cache `related:<id>` do `articlesSlice` đảm nhiệm (tuần 3 #1),
 * slice này chỉ giữ trạng thái hiển thị nên không gọi trùng endpoint.
 */
export const fetchRelatedArticles = createAsyncThunk<
  { articleId: string; items: Article[] },
  { articleId: string; limit?: number },
  { state: RootState }
>(
  'related/fetch',
  async ({ articleId, limit }, { dispatch, getState }) => {
    const action = await dispatch(fetchRelated({ id: articleId, limit }));

    if (fetchRelated.fulfilled.match(action)) {
      return { articleId, items: action.payload.data };
    }

    // Bị skip vì cache `related:<id>` còn hiệu lực → đọc lại từ cache.
    if (fetchRelated.rejected.match(action) && action.meta.condition) {
      const items = selectCachedRelatedArticles(getState(), articleId);
      if (items.length > 0) return { articleId, items };
    }

    throw action.error ?? new Error('Không tải được bài liên quan');
  },
  {
    condition: ({ articleId }, { getState }) => !isFresh(getState().related.byId[articleId]),
  },
);

const relatedArticlesSlice = createSlice({
  name: 'related',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRelatedArticles.pending, (state, action) => {
        const entry = (state.byId[action.meta.arg.articleId] ??= {
          items: [],
          status: 'loading',
          error: null,
          fetchedAt: null,
        });
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(fetchRelatedArticles.fulfilled, (state, action) => {
        const entry = (state.byId[action.payload.articleId] ??= {
          items: [],
          status: 'idle',
          error: null,
          fetchedAt: null,
        });
        entry.status = 'succeeded';
        entry.items = action.payload.items;
        entry.error = null;
        entry.fetchedAt = Date.now();
      })
      .addCase(fetchRelatedArticles.rejected, (state, action) => {
        const entry = (state.byId[action.meta.arg.articleId] ??= {
          items: [],
          status: 'idle',
          error: null,
          fetchedAt: null,
        });
        entry.status = 'failed';
        entry.error = toApiError(action.error).message;
      });
  },
});

export const relatedArticlesReducer = relatedArticlesSlice.reducer;

export const selectRelatedEntry = (
  state: RootState,
  articleId: string,
): RelatedEntry | undefined => state.related.byId[articleId];

export const selectRelatedArticles = (state: RootState, articleId: string): Article[] =>
  state.related.byId[articleId]?.items ?? [];
