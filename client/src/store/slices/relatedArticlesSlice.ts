import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getRelated } from '@/api/endpoints';
import { toApiError } from '@/api/http';
import { RELATED_ARTICLES_COUNT, RELATED_CACHE_TTL_MS } from '@/lib/constants';
import type { Article, RequestStatus } from '@/types/article';
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
 * Cache theo id để mở lại bài đã đọc không phải gọi lại API.
 */
export const fetchRelatedArticles = createAsyncThunk<
  { articleId: string; items: Article[] },
  { articleId: string; limit?: number },
  { state: RootState }
>(
  'related/fetch',
  async ({ articleId, limit }) => {
    const response = await getRelated(articleId, limit ?? RELATED_ARTICLES_COUNT);
    return { articleId, items: response.data };
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
