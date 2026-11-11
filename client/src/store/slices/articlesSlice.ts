import {
  createAction,
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  type EntityState,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  getArticleById,
  getArticles,
  getFeatured,
  getLatest,
  getRelated,
  getRSS,
  searchArticles as searchArticlesApi,
} from '@/api/endpoints';
import { toApiError } from '@/api/http';
import { parseRssItems, type RssItem } from '@/lib/rss';
import {
  HIGH_RELEVANCE_COUNT,
  LATEST_CACHE_TTL_MS,
  LIST_CACHE_TTL_MS,
  RELATED_ARTICLES_COUNT,
  RELATED_CACHE_TTL_MS,
  SEARCH_DEBOUNCE_MS,
} from '@/lib/constants';
import type { Article, ListMeta, RequestStatus } from '@/types/article';
import type { RootState } from '../index';

type ThunkConfig = { state: RootState };

interface ListEntry {
  ids: string[];
  status: RequestStatus;
  error: string | null;
  meta: ListMeta | null;
  lastFetched: number | null;
  /**
   * Id các bài được gắn badge "liên quan cao".
   * Server đã sort theo score khi có `q` nhưng không trả field `score` ra API,
   * nên client tự đánh dấu theo thứ tự kết quả trả về.
   */
  highRelevanceIds: string[];
  /** Request đang chạy — dùng để biết lỗi huỷ có thuộc request này không. */
  requestId?: string;
}

interface RssEntry {
  items: RssItem[];
  status: RequestStatus;
  error: string | null;
  lastFetched: number | null;
}

interface ArticlesState extends EntityState<Article, string> {
  lists: Record<string, ListEntry>;
  /** Cache RSS theo chuyên mục — key `rss:<category>` hoặc `rss:all`. */
  rssFeeds: Record<string, RssEntry>;
  /**
   * Từ khoá đang tìm kiếm — `null` nghĩa là chưa có từ khoá nào được chốt.
   * Chỉ cập nhật sau khi hết thời gian debounce nên URL không nhảy theo từng ký tự gõ.
   */
  activeQuery: string | null;
}

const articlesAdapter = createEntityAdapter<Article>();

const emptyEntry: ListEntry = {
  ids: [],
  status: 'idle',
  error: null,
  meta: null,
  lastFetched: null,
  highRelevanceIds: [],
};

const emptyRssEntry: RssEntry = {
  items: [],
  status: 'idle',
  error: null,
  lastFetched: null,
};

const initialState: ArticlesState = articlesAdapter.getInitialState({
  lists: {},
  rssFeeds: {},
  activeQuery: null,
});

export const LIST_LATEST = 'latest';
export const LIST_FEATURED = 'featured';

/** Key cache cho danh sách bài liên quan của một bài viết. */
export function listKeyRelated(articleId: string): string {
  return `related:${articleId}`;
}

/** Key cache cho feed RSS — `rss:all` khi không lọc chuyên mục. */
export function listKeyRss(category?: string): string {
  return `rss:${category ?? 'all'}`;
}

export interface ArticleQuery {
  category?: string;
  source?: string;
  q?: string;
  since?: string;
  until?: string;
  page?: number;
  limit?: number;
}

export function listKeyCategory(category: string, page = 1, source?: string): string {
  const parts = [`category:${category}`];
  if (source) parts.push(`src:${source}`);
  if (page > 1) parts.push(`p${page}`);
  return parts.join(':');
}

/** Bài mới nhất đại diện của một chuyên mục — tách key riêng để không đè cache danh sách đầy đủ. */
export function listKeyCategoryLatest(category: string): string {
  return `category:${category}:latest`;
}

export function listKeySearch(
  q: string,
  filters?: { category?: string; source?: string; page?: number },
): string {
  const parts = [`search:${q}`];
  if (filters?.category) parts.push(`cat:${filters.category}`);
  if (filters?.source) parts.push(`src:${filters.source}`);
  if (filters?.page && filters.page > 1) parts.push(`p:${filters.page}`);
  return parts.join('|');
}

/** Key cho danh sách tổng hợp theo bộ lọc (dùng cho `/api/articles`). */
export function listKeyQuery(query: ArticleQuery): string {
  const parts = ['query'];
  if (query.q) parts.push(`q:${query.q}`);
  if (query.category) parts.push(`cat:${query.category}`);
  if (query.source) parts.push(`src:${query.source}`);
  if (query.since) parts.push(`since:${query.since}`);
  if (query.until) parts.push(`until:${query.until}`);
  if (query.page && query.page > 1) parts.push(`p:${query.page}`);
  return parts.join('|');
}

/**
 * Kiểm tra cache danh sách còn hiệu lực không.
 * - Chưa có → cần gọi API.
 * - Đang tải → có request trước đang chạy, không gọi lại.
 * - Vừa tải xong (trong TTL) → dùng cache, không gọi lại.
 */
function isCacheFresh(state: RootState, key: string, ttl: number): boolean {
  const entry = state.articles.lists[key];
  if (!entry) return false;
  if (entry.status === 'loading') return true;
  if (entry.lastFetched === null) return false;
  return Date.now() - entry.lastFetched < ttl;
}

/** Tương tự `isCacheFresh` nhưng cho cache feed RSS. */
function isRssCacheFresh(state: RootState, key: string, ttl: number): boolean {
  const entry = state.articles.rssFeeds[key];
  if (!entry) return false;
  if (entry.status === 'loading') return true;
  if (entry.lastFetched === null) return false;
  return Date.now() - entry.lastFetched < ttl;
}

/**
 * Bộ huỷ request đang chạy theo "phạm vi" (scope).
 *
 * Khi người dùng gõ từ khoá mới, request cũ của cùng scope bị huỷ để không tốn
 * băng thông và không ghi đè kết quả mới bằng kết quả cũ.
 */
const abortControllers = new Map<string, AbortController>();
/** Huỷ request đang chạy của scope và trả về controller mới để dùng cho request kế tiếp. */
function startRequest(scope: string): AbortController {
  abortControllers.get(scope)?.abort();
  const controller = new AbortController();
  abortControllers.set(scope, controller);
  return controller;
}

/** Bỏ controller khỏi registry nếu nó vẫn là controller đang chạy của scope. */
function endRequest(scope: string, controller: AbortController): void {
  if (abortControllers.get(scope) === controller) {
    abortControllers.delete(scope);
  }
}

/** Huỷ toàn bộ request đang chạy — dùng khi rời trang tìm kiếm. */
export function abortAllRequests(): void {
  for (const controller of abortControllers.values()) {
    controller.abort();
  }
  abortControllers.clear();
}

/** Lỗi huỷ request của axios — không phải lỗi thật nên không hiển thị cho người dùng. */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'CanceledError'
  );
}

/**
 * Chờ trong khoảng `ms`, nhưng dừng sớm nếu signal bị huỷ.
 * Dùng để debounce ở tầng thunk: request cũ bị huỷ trong lúc chờ nên không gọi API.
 */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject({ name: 'CanceledError' } as Error);
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort(): void {
      clearTimeout(timer);
      reject({ name: 'CanceledError' } as Error);
    }

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Số danh sách tìm kiếm được giữ lại trong RAM.
 * Mỗi lần gõ một từ khoá mới sinh ra một cache key — giới hạn số lượng để
 * không phình bộ nhớ (đáp ứng yêu cầu 4: Redux tối ưu bộ nhớ).
 */
const MAX_SEARCH_LISTS = 10;

/** Xoá các cache tìm kiếm cũ nhất khi vượt quá `MAX_SEARCH_LISTS`. */
function pruneSearchLists(state: ArticlesState): void {
  // Không xoá entry đang tải — kết quả sẽ không còn nơi để ghi vào.
  const candidates = Object.keys(state.lists).filter(
    (key) => key.startsWith('query') && state.lists[key]?.status !== 'loading',
  );
  if (candidates.length <= MAX_SEARCH_LISTS) return;

  const sorted = candidates
    .map((key) => ({ key, lastFetched: state.lists[key]?.lastFetched ?? 0 }))
    .sort((a, b) => a.lastFetched - b.lastFetched);

  for (const { key } of sorted.slice(0, candidates.length - MAX_SEARCH_LISTS)) {
    delete state.lists[key];
  }
}

/**
 * Chốt từ khoá tìm kiếm — dùng để đồng bộ URL (link chia sẻ được).
 * Chỉ được gọi sau khi hết debounce nên URL không nhảy theo từng ký tự gõ.
 */
export const commitSearchKeyword = createAction<string>('articles/commitSearchKeyword');

export const fetchLatest = createAsyncThunk<
  Awaited<ReturnType<typeof getLatest>>,
  number | undefined,
  ThunkConfig
>(
  'articles/fetchLatest',
  async (limit) => {
    return getLatest(limit ?? 20);
  },
  {
    condition: (_limit, { getState }) =>
      !isCacheFresh(getState(), LIST_LATEST, LATEST_CACHE_TTL_MS),
  },
);

export const fetchFeatured = createAsyncThunk<
  Awaited<ReturnType<typeof getFeatured>>,
  number | undefined,
  ThunkConfig
>(
  'articles/fetchFeatured',
  async (limit) => {
    return getFeatured(limit ?? 10);
  },
  {
    condition: (_limit, { getState }) =>
      !isCacheFresh(getState(), LIST_FEATURED, LIST_CACHE_TTL_MS),
  },
);

export const fetchByCategory = createAsyncThunk<
  Awaited<ReturnType<typeof getArticles>>,
  { category: string; source?: string; limit?: number; page?: number },
  ThunkConfig
>(
  'articles/fetchByCategory',
  async (params) => {
    return getArticles({
      category: params.category,
      source: params.source,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    });
  },
  {
    condition: (params, { getState }) =>
      !isCacheFresh(
        getState(),
        listKeyCategory(params.category, params.page ?? 1, params.source),
        LIST_CACHE_TTL_MS,
      ),
  },
);

/** Bài mới nhất của một chuyên mục — dùng cho ô đại diện ở trang index chuyên mục. */
export const fetchCategoryLatest = createAsyncThunk<
  Awaited<ReturnType<typeof getArticles>>,
  { category: string },
  ThunkConfig
>(
  'articles/fetchCategoryLatest',
  async (params) => {
    return getArticles({ category: params.category, page: 1, limit: 1 });
  },
  {
    condition: (params, { getState }) =>
      !isCacheFresh(getState(), listKeyCategoryLatest(params.category), LIST_CACHE_TTL_MS),
  },
);

export const searchArticles = createAsyncThunk<
  Awaited<ReturnType<typeof searchArticlesApi>>,
  { q: string; limit?: number; page?: number },
  ThunkConfig
>(
  'articles/search',
  async (params) => {
    const controller = startRequest('search');
    try {
      // Debounce ở tầng thunk: request cũ bị huỷ trong lúc chờ nên không gọi API.
      if ((params.page ?? 1) === 1) {
        await delay(SEARCH_DEBOUNCE_MS, controller.signal);
      }
      return await searchArticlesApi(
        params.q,
        params.limit ?? 20,
        params.page ?? 1,
        controller.signal,
      );
    } catch (error) {
      throw isAbortError(error) ? { name: 'CanceledError' } : error;
    } finally {
      endRequest('search', controller);
    }
  },
  {
    condition: (params, { getState }) =>
      !isCacheFresh(
        getState(),
        listKeySearch(params.q, { page: params.page }),
        LIST_CACHE_TTL_MS,
      ),
  },
);

/**
 * Tìm kiếm có lọc kết hợp (chuyên mục + nguồn + từ khoá).
 * `/api/search` chỉ nhận `q` nên phải dùng `/api/articles`.
 *
 * - Debounce 400ms ở tầng thunk: gõ tiếp sẽ huỷ request cũ trước khi nó kịp gọi API.
 * - Từ khoá chỉ được "chốt" (`activeQuery`) sau khi hết debounce — URL không nhảy theo từng ký tự.
 */
export const queryArticles = createAsyncThunk<
  Awaited<ReturnType<typeof getArticles>>,
  ArticleQuery,
  ThunkConfig
>(
  'articles/query',
  async (query, { dispatch }) => {
    const controller = startRequest('query');
    try {
      // Debounce ở tầng thunk: request cũ bị huỷ trong lúc chờ nên không gọi API.
      if ((query.page ?? 1) === 1) {
        await delay(SEARCH_DEBOUNCE_MS, controller.signal);
        // Từ khoá chính thức được chấp nhận sau debounce.
        dispatch(commitSearchKeyword(query.q ?? ''));
      }
      return await getArticles({ page: 1, limit: 20, ...query }, controller.signal);
    } catch (error) {
      throw isAbortError(error) ? { name: 'CanceledError' } : error;
    } finally {
      endRequest('query', controller);
    }
  },
  {
    condition: (query, { getState }) =>
      !isCacheFresh(getState(), listKeyQuery(query), LIST_CACHE_TTL_MS),
  },
);

export const fetchArticleById = createAsyncThunk('articles/fetchById', async (id: string) => {
  return getArticleById(id);
});

/**
 * Bài liên quan của một bài viết — server trả sẵn các bài cùng chuyên mục.
 * Cache theo `related:<id>` để mở lại bài đã đọc không phải gọi lại API.
 */
export const fetchRelated = createAsyncThunk<
  Awaited<ReturnType<typeof getRelated>>,
  { id: string; limit?: number },
  ThunkConfig
>(
  'articles/fetchRelated',
  async (params) => {
    return getRelated(params.id, params.limit ?? RELATED_ARTICLES_COUNT);
  },
  {
    condition: (params, { getState }) =>
      !isCacheFresh(
        getState(),
        listKeyRelated(params.id),
        RELATED_CACHE_TTL_MS,
      ),
  },
);

/**
 * Feed RSS của server (`/api/articles/rss.xml`) — parse sẵn ra danh sách mục
 * để trang chuyên mục hiển thị được nguồn RSS mà giảng viên yêu cầu.
 */
export const fetchRSS = createAsyncThunk<
  RssItem[],
  { category?: string; limit?: number },
  ThunkConfig
>(
  'articles/fetchRSS',
  async (params) => {
    const xml = await getRSS(params.category, params.limit ?? 20);
    return parseRssItems(xml);
  },
  {
    condition: (params, { getState }) =>
      !isRssCacheFresh(getState(), listKeyRss(params.category), LIST_CACHE_TTL_MS),
  },
);

function setLoading(state: ArticlesState, key: string, requestId?: string): void {
  const entry = (state.lists[key] ??= { ...emptyEntry });
  entry.status = 'loading';
  entry.error = null;
  entry.requestId = requestId;
}

function setSucceeded(
  state: ArticlesState,
  key: string,
  payload: { data: Article[]; meta: ListMeta },
  options: { markHighRelevance?: boolean } = {},
): void {
  const entry = (state.lists[key] ??= { ...emptyEntry });
  entry.status = 'succeeded';
  articlesAdapter.upsertMany(state, payload.data);
  entry.ids = payload.data.map((a) => a.id);
  entry.meta = payload.meta;
  entry.lastFetched = Date.now();
  entry.requestId = undefined;
  entry.highRelevanceIds = options.markHighRelevance
    ? payload.data.slice(0, HIGH_RELEVANCE_COUNT).map((a) => a.id)
    : [];
}

function setFailed(state: ArticlesState, key: string, error: unknown): void {
  const entry = (state.lists[key] ??= { ...emptyEntry });
  entry.status = 'failed';
  entry.error = toApiError(error).message;
  entry.requestId = undefined;
}

/**
 * Xử lý lỗi huỷ request: request bị huỷ thì entry vẫn phải ở trạng thái chờ
 * (để request mới ghi đè), nhưng entry của request đã bị huỷ thì về `idle`.
 */
function handleRejected(
  state: ArticlesState,
  key: string,
  action: { error: { name?: string; message?: string }; meta: { requestId: string } },
): void {
  const entry = state.lists[key];

  if (action.error.name === 'CanceledError') {
    // Chỉ huỷ entry nếu request bị huỷ là request mới nhất của key này.
    if (entry && entry.requestId === action.meta.requestId) {
      entry.status = 'idle';
      entry.requestId = undefined;
    }
    return;
  }

  setFailed(state, key, action.error);
}

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
      .addCase(commitSearchKeyword, (state, action) => {
        state.activeQuery = action.payload || null;
      })

      .addCase(fetchLatest.pending, (state) => {
        setLoading(state, LIST_LATEST);
      })
      .addCase(fetchLatest.fulfilled, (state, action) => {
        setSucceeded(state, LIST_LATEST, action.payload);
      })
      .addCase(fetchLatest.rejected, (state, action) => {
        setFailed(state, LIST_LATEST, action.error);
      })

      .addCase(fetchFeatured.pending, (state) => {
        setLoading(state, LIST_FEATURED);
      })
      .addCase(fetchFeatured.fulfilled, (state, action) => {
        setSucceeded(state, LIST_FEATURED, action.payload);
      })
      .addCase(fetchFeatured.rejected, (state, action) => {
        setFailed(state, LIST_FEATURED, action.error);
      })

      .addCase(fetchByCategory.pending, (state, action) => {
        setLoading(
          state,
          listKeyCategory(action.meta.arg.category, action.meta.arg.page ?? 1, action.meta.arg.source),
        );
      })
      .addCase(fetchByCategory.fulfilled, (state, action) => {
        setSucceeded(
          state,
          listKeyCategory(action.meta.arg.category, action.meta.arg.page ?? 1, action.meta.arg.source),
          action.payload,
        );
      })
      .addCase(fetchByCategory.rejected, (state, action) => {
        setFailed(
          state,
          listKeyCategory(action.meta.arg.category, action.meta.arg.page ?? 1, action.meta.arg.source),
          action.error,
        );
      })

      .addCase(fetchCategoryLatest.pending, (state, action) => {
        setLoading(state, listKeyCategoryLatest(action.meta.arg.category));
      })
      .addCase(fetchCategoryLatest.fulfilled, (state, action) => {
        setSucceeded(state, listKeyCategoryLatest(action.meta.arg.category), action.payload);
      })
      .addCase(fetchCategoryLatest.rejected, (state, action) => {
        setFailed(state, listKeyCategoryLatest(action.meta.arg.category), action.error);
      })

      .addCase(searchArticles.pending, (state, action) => {
        setLoading(
          state,
          listKeySearch(action.meta.arg.q, { page: action.meta.arg.page }),
          action.meta.requestId,
        );
      })
      .addCase(searchArticles.fulfilled, (state, action) => {
        setSucceeded(
          state,
          listKeySearch(action.meta.arg.q, { page: action.meta.arg.page }),
          action.payload,
          // Chỉ trang đầu mới chứa 3 kết quả liên quan cao nhất.
          { markHighRelevance: (action.meta.arg.page ?? 1) === 1 },
        );
      })
      .addCase(searchArticles.rejected, (state, action) => {
        handleRejected(
          state,
          listKeySearch(action.meta.arg.q, { page: action.meta.arg.page }),
          action,
        );
      })

      .addCase(queryArticles.pending, (state, action) => {
        setLoading(state, listKeyQuery(action.meta.arg), action.meta.requestId);
        // Mỗi ký tự gõ tạo ra một cache key mới — dọn các key cũ để bộ nhớ không phình.
        pruneSearchLists(state);
      })
      .addCase(queryArticles.fulfilled, (state, action) => {
        setSucceeded(state, listKeyQuery(action.meta.arg), action.payload, {
          // Chỉ khi có từ khoá và ở trang đầu mới đánh dấu "liên quan cao".
          markHighRelevance: Boolean(action.meta.arg.q) && (action.meta.arg.page ?? 1) === 1,
        });
      })
      .addCase(queryArticles.rejected, (state, action) => {
        handleRejected(state, listKeyQuery(action.meta.arg), action);
      })

      .addCase(fetchArticleById.fulfilled, (state, action) => {
        articlesAdapter.upsertOne(state, action.payload);
      })

      .addCase(fetchRelated.pending, (state, action) => {
        setLoading(state, listKeyRelated(action.meta.arg.id));
      })
      .addCase(fetchRelated.fulfilled, (state, action) => {
        setSucceeded(state, listKeyRelated(action.meta.arg.id), action.payload);
      })
      .addCase(fetchRelated.rejected, (state, action) => {
        setFailed(state, listKeyRelated(action.meta.arg.id), action.error);
      })

      .addCase(fetchRSS.pending, (state, action) => {
        const key = listKeyRss(action.meta.arg.category);
        const entry = (state.rssFeeds[key] ??= { ...emptyRssEntry });
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(fetchRSS.fulfilled, (state, action) => {
        const key = listKeyRss(action.meta.arg.category);
        const entry = (state.rssFeeds[key] ??= { ...emptyRssEntry });
        entry.status = 'succeeded';
        entry.items = action.payload;
        entry.error = null;
        entry.lastFetched = Date.now();
      })
      .addCase(fetchRSS.rejected, (state, action) => {
        const key = listKeyRss(action.meta.arg.category);
        const entry = (state.rssFeeds[key] ??= { ...emptyRssEntry });
        entry.status = 'failed';
        entry.error = toApiError(action.error).message;
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

export const selectListMeta = (state: RootState, key: string): ListMeta | null =>
  state.articles.lists[key]?.meta ?? null;

/** Id các bài được gắn badge "liên quan cao" trong danh sách `key`. */
export const selectHighRelevanceIds = (state: RootState, key: string): string[] =>
  state.articles.lists[key]?.highRelevanceIds ?? EMPTY_IDS;

/** Từ khoá tìm kiếm hiện tại — giữ lại để URL có thể chia sẻ. */
export const selectActiveQuery = (state: RootState): string | null => state.articles.activeQuery;

/** Id các bài liên quan đã cache theo `related:<id>`. */
export const selectRelatedIds = (state: RootState, articleId: string): string[] =>
  state.articles.lists[listKeyRelated(articleId)]?.ids ?? EMPTY_IDS;

/** Bài liên quan đã cache — dựng lại từ entity adapter của `articlesSlice`. */
export const selectCachedRelatedArticles = (state: RootState, articleId: string): Article[] => {
  const ids = selectRelatedIds(state, articleId);
  const entities = state.articles.entities;
  return ids
    .map((id) => entities[id])
    .filter((article): article is Article => article !== undefined);
};

export const selectRssEntry = (state: RootState, category?: string): RssEntry =>
  state.articles.rssFeeds[listKeyRss(category)] ?? emptyRssEntry;

export const selectRssItems = (state: RootState, category?: string): RssItem[] =>
  selectRssEntry(state, category).items;

export { selectArticlesEntities };
