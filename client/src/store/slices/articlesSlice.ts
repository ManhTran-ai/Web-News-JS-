import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  type EntityState,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  getArticleById,
  getByCategory,
  getFeatured,
  getLatest,
  searchArticles as searchArticlesApi,
} from '@/api/endpoints';
import { toApiError } from '@/api/http';
import type { Article, ListMeta, RequestStatus } from '@/types/article';
import type { RootState } from '../index';

interface ListEntry {
  ids: string[];
  status: RequestStatus;
  error: string | null;
  meta: ListMeta | null;
}

interface ArticlesState extends EntityState<Article, string> {
  lists: Record<string, ListEntry>;
}

const articlesAdapter = createEntityAdapter<Article>();

const emptyEntry: ListEntry = { ids: [], status: 'idle', error: null, meta: null };

const initialState: ArticlesState = articlesAdapter.getInitialState({
  lists: {},
});

export const LIST_LATEST = 'latest';
export const LIST_FEATURED = 'featured';

export function listKeyCategory(category: string): string {
  return `category:${category}`;
}

export function listKeySearch(q: string): string {
  return `search:${q}`;
}

export const fetchLatest = createAsyncThunk('articles/fetchLatest', async (arg: number | undefined) => {
  return getLatest(arg ?? 20);
});

export const fetchFeatured = createAsyncThunk(
  'articles/fetchFeatured',
  async (arg: number | undefined) => {
    return getFeatured(arg ?? 10);
  },
);

export const fetchByCategory = createAsyncThunk(
  'articles/fetchByCategory',
  async (params: { category: string; limit?: number }) => {
    return getByCategory(params.category, params.limit ?? 20);
  },
);

export const searchArticles = createAsyncThunk(
  'articles/search',
  async (params: { q: string; limit?: number }) => {
    return searchArticlesApi(params.q, params.limit ?? 20);
  },
);

export const fetchArticleById = createAsyncThunk('articles/fetchById', async (id: string) => {
  return getArticleById(id);
});

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    clearList(state, action: PayloadAction<string>) {
      state.lists[action.payload] = { ...emptyEntry };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLatest.pending, (state) => {
        const entry = (state.lists[LIST_LATEST] ??= { ...emptyEntry });
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(fetchLatest.fulfilled, (state, action) => {
        const entry = (state.lists[LIST_LATEST] ??= { ...emptyEntry });
        entry.status = 'succeeded';
        articlesAdapter.upsertMany(state, action.payload.data);
        entry.ids = action.payload.data.map((a) => a.id);
        entry.meta = action.payload.meta;
      })
      .addCase(fetchLatest.rejected, (state, action) => {
        const entry = (state.lists[LIST_LATEST] ??= { ...emptyEntry });
        entry.status = 'failed';
        entry.error = toApiError(action.error).message;
      })

      .addCase(fetchFeatured.pending, (state) => {
        const entry = (state.lists[LIST_FEATURED] ??= { ...emptyEntry });
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(fetchFeatured.fulfilled, (state, action) => {
        const entry = (state.lists[LIST_FEATURED] ??= { ...emptyEntry });
        entry.status = 'succeeded';
        articlesAdapter.upsertMany(state, action.payload.data);
        entry.ids = action.payload.data.map((a) => a.id);
        entry.meta = action.payload.meta;
      })
      .addCase(fetchFeatured.rejected, (state, action) => {
        const entry = (state.lists[LIST_FEATURED] ??= { ...emptyEntry });
        entry.status = 'failed';
        entry.error = toApiError(action.error).message;
      })

      .addCase(fetchByCategory.pending, (state, action) => {
        const key = listKeyCategory(action.meta.arg.category);
        const entry = (state.lists[key] ??= { ...emptyEntry });
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(fetchByCategory.fulfilled, (state, action) => {
        const key = listKeyCategory(action.meta.arg.category);
        const entry = (state.lists[key] ??= { ...emptyEntry });
        entry.status = 'succeeded';
        articlesAdapter.upsertMany(state, action.payload.data);
        entry.ids = action.payload.data.map((a) => a.id);
        entry.meta = action.payload.meta;
      })
      .addCase(fetchByCategory.rejected, (state, action) => {
        const key = listKeyCategory(action.meta.arg.category);
        const entry = (state.lists[key] ??= { ...emptyEntry });
        entry.status = 'failed';
        entry.error = toApiError(action.error).message;
      })

      .addCase(searchArticles.pending, (state, action) => {
        const key = listKeySearch(action.meta.arg.q);
        const entry = (state.lists[key] ??= { ...emptyEntry });
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(searchArticles.fulfilled, (state, action) => {
        const key = listKeySearch(action.meta.arg.q);
        const entry = (state.lists[key] ??= { ...emptyEntry });
        entry.status = 'succeeded';
        articlesAdapter.upsertMany(state, action.payload.data);
        entry.ids = action.payload.data.map((a) => a.id);
        entry.meta = action.payload.meta;
      })
      .addCase(searchArticles.rejected, (state, action) => {
        const key = listKeySearch(action.meta.arg.q);
        const entry = (state.lists[key] ??= { ...emptyEntry });
        entry.status = 'failed';
        entry.error = toApiError(action.error).message;
      })

      .addCase(fetchArticleById.fulfilled, (state, action) => {
        articlesAdapter.upsertOne(state, action.payload);
      });
  },
});

export const articlesReducer = articlesSlice.reducer;
export const { clearList } = articlesSlice.actions;

const selectArticlesEntities = (state: RootState) => state.articles.entities;

export const selectListEntry = (state: RootState, key: string): ListEntry =>
  state.articles.lists[key] ?? emptyEntry;

export const EMPTY_IDS: string[] = [];

export const selectListIds = (state: RootState, key: string): string[] =>
  state.articles.lists[key]?.ids ?? EMPTY_IDS;

export const selectArticleById = (state: RootState, id: string): Article | undefined =>
  state.articles.entities[id];

export { selectArticlesEntities };
