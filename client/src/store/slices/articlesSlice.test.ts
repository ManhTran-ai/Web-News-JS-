// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../index';
import {
  articlesReducer,
  clearList,
  fetchByCategory,
  fetchCategoryLatest,
  fetchLatest,
  fetchRelated,
  fetchRSS,
  listKeyCategory,
  listKeyCategoryLatest,
  listKeyQuery,
  listKeyRelated,
  listKeyRss,
  listKeySearch,
  queryArticles,
  selectActiveQuery,
  selectHighRelevanceIds,
  selectListEntry,
  selectListIds,
  selectRssEntry,
} from './articlesSlice';
import type { Article, ListMeta } from '@/types/article';

const META: ListMeta = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
  updatedAt: '2026-11-08T00:00:00.000Z',
};

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    title: 'Bài viết',
    summary: 'Tóm tắt',
    link: 'https://vnexpress.net/a1.html',
    sourceId: 'vnexpress',
    source: 'VnExpress',
    category: 'thoi-su',
    publishedAt: '2026-11-08T00:00:00.000Z',
    ...overrides,
  };
}

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

vi.mock('@/api/endpoints', () => ({
  getLatest: vi.fn(),
  getFeatured: vi.fn(),
  getByCategory: vi.fn(),
  getArticles: vi.fn(),
  getArticleById: vi.fn(),
  getRelated: vi.fn(),
  getRSS: vi.fn(),
  searchArticles: vi.fn(),
}));

const endpoints = await import('@/api/endpoints');
describe('articlesSlice - key cache', () => {
  it('trạng thái ban đầu rỗng', () => {
    const state = articlesReducer(undefined, { type: 'unknown' });
    expect(state.lists).toEqual({});
    expect(state.entities).toEqual({});
  });

  it('key chuyên mục phân biệt trang', () => {
    expect(listKeyCategory('thoi-su')).toBe('category:thoi-su');
    expect(listKeyCategory('thoi-su', 3)).toBe('category:thoi-su:p3');
  });

  it('key bài mới nhất tách riêng khỏi danh sách đầy đủ', () => {
    expect(listKeyCategoryLatest('thoi-su')).toBe('category:thoi-su:latest');
    expect(listKeyCategoryLatest('thoi-su')).not.toBe(listKeyCategory('thoi-su'));
  });

  it('key tìm kiếm thuần chỉ phụ thuộc từ khoá', () => {
    expect(listKeySearch('bong da')).toBe('search:bong da');
    expect(listKeySearch('bong da', { page: 2 })).toBe('search:bong da|p:2');
  });

  it('key truy vấn tổng hợp phản ánh đủ bộ lọc', () => {
    const base = listKeyQuery({ q: 'bong da' });
    expect(listKeyQuery({ q: 'bong da', category: 'the-thao' })).not.toBe(base);
    expect(listKeyQuery({ q: 'bong da', source: 'vnexpress' })).not.toBe(base);
    expect(listKeyQuery({ q: 'bong da', category: 'the-thao', source: 'vnexpress' })).not.toBe(
      listKeyQuery({ q: 'bong da', category: 'the-thao' }),
    );
  });

  it('hai bộ lọc khác nhau không dùng chung một cache', () => {
    const a = listKeyQuery({ q: 'bong da', category: 'the-thao' });
    const b = listKeyQuery({ q: 'bong da', category: 'kinh-doanh' });
    expect(a).not.toBe(b);
  });
});

describe('articlesSlice - fetch và cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gọi API và lưu danh sách vào cache theo key', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle()],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchByCategory({ category: 'thoi-su' }));

    const key = listKeyCategory('thoi-su');
    expect(endpoints.getArticles).toHaveBeenCalledTimes(1);
    expect(selectListIds(store.getState(), key)).toEqual(['a1']);
    expect(selectListEntry(store.getState(), key).status).toBe('succeeded');
    expect(selectListEntry(store.getState(), key).meta?.total).toBe(1);
  });

  it('không gọi lại API khi cache còn hiệu lực', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle()],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchByCategory({ category: 'thoi-su' }));
    await store.dispatch(fetchByCategory({ category: 'thoi-su' }));

    expect(endpoints.getArticles).toHaveBeenCalledTimes(1);
  });

  it('gọi lại API khi cache đã hết hạn', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle()],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchByCategory({ category: 'thoi-su' }));

    const key = listKeyCategory('thoi-su');
    expect(selectListEntry(store.getState(), key).lastFetched).not.toBeNull();

    // Xoá cache để mô phỏng TTL đã hết hạn.
    store.dispatch(clearList(key));

    await store.dispatch(fetchByCategory({ category: 'thoi-su' }));

    expect(endpoints.getArticles).toHaveBeenCalledTimes(2);
  });

  it('bắt lỗi và lưu thông báo vào cache', async () => {
    vi.mocked(endpoints.getArticles).mockRejectedValue(
      Object.assign(new Error('fail'), { isAxiosError: true, response: undefined }),
    );

    const store = makeStore();
    await store.dispatch(fetchByCategory({ category: 'thoi-su' }));

    const entry = selectListEntry(store.getState(), listKeyCategory('thoi-su'));
    expect(entry.status).toBe('failed');
    expect(entry.error).toBeTruthy();
  });

  it('bài mới nhất của chuyên mục dùng key riêng', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle()],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchCategoryLatest({ category: 'thoi-su' }));

    expect(endpoints.getArticles).toHaveBeenCalledWith({ category: 'thoi-su', page: 1, limit: 1 });
    expect(selectListIds(store.getState(), listKeyCategoryLatest('thoi-su'))).toEqual(['a1']);
    expect(selectListIds(store.getState(), listKeyCategory('thoi-su'))).toEqual([]);
  });

  it('lọc theo nguồn dùng key riêng và truyền source xuống API', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ sourceId: 'vnexpress', source: 'VnExpress' })],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchByCategory({ category: 'thoi-su', source: 'vnexpress' }));

    expect(endpoints.getArticles).toHaveBeenCalledWith({
      category: 'thoi-su',
      source: 'vnexpress',
      page: 1,
      limit: 20,
    });
    expect(listKeyCategory('thoi-su', 1, 'vnexpress')).not.toBe(listKeyCategory('thoi-su'));
    expect(selectListIds(store.getState(), listKeyCategory('thoi-su', 1, 'vnexpress'))).toEqual([
      'a1',
    ]);
  });

  it('danh sách mới nhất dùng key riêng', async () => {
    vi.mocked(endpoints.getLatest).mockResolvedValue({
      data: [makeArticle()],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchLatest(20));

    expect(endpoints.getLatest).toHaveBeenCalledWith(20);
    expect(selectListEntry(store.getState(), 'latest').status).toBe('succeeded');
  });
});

describe('articlesSlice - bài liên quan (tuần 3 #1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('key cache bài liên quan tách theo id', () => {
    expect(listKeyRelated('a1')).toBe('related:a1');
    expect(listKeyRelated('a1')).not.toBe(listKeyRelated('a2'));
  });

  it('gọi getRelated và lưu vào cache related:<id>', async () => {
    vi.mocked(endpoints.getRelated).mockResolvedValue({
      data: [makeArticle({ id: 'r1' })],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchRelated({ id: 'a1' }));

    expect(endpoints.getRelated).toHaveBeenCalledWith('a1', 6);
    expect(selectListIds(store.getState(), listKeyRelated('a1'))).toEqual(['r1']);
    expect(selectListEntry(store.getState(), listKeyRelated('a1')).status).toBe('succeeded');
  });

  it('không gọi lại API bài liên quan khi cache còn hiệu lực', async () => {
    vi.mocked(endpoints.getRelated).mockResolvedValue({
      data: [makeArticle({ id: 'r1' })],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchRelated({ id: 'a1' }));
    await store.dispatch(fetchRelated({ id: 'a1' }));

    expect(endpoints.getRelated).toHaveBeenCalledTimes(1);
  });

  it('bài liên quan của hai bài khác nhau không dùng chung cache', async () => {
    vi.mocked(endpoints.getRelated).mockResolvedValue({
      data: [makeArticle({ id: 'r1' })],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchRelated({ id: 'a1' }));
    await store.dispatch(fetchRelated({ id: 'a2' }));

    expect(endpoints.getRelated).toHaveBeenCalledTimes(2);
    expect(selectListIds(store.getState(), listKeyRelated('a2'))).toEqual(['r1']);
  });

  it('ghi lỗi khi tải bài liên quan thất bại', async () => {
    vi.mocked(endpoints.getRelated).mockRejectedValue(new Error('Lỗi mạng'));

    const store = makeStore();
    await store.dispatch(fetchRelated({ id: 'a1' }));

    expect(selectListEntry(store.getState(), listKeyRelated('a1')).status).toBe('failed');
  });
});

describe('articlesSlice - feed RSS (tuần 3 #1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('key cache RSS theo chuyên mục', () => {
    expect(listKeyRss()).toBe('rss:all');
    expect(listKeyRss('thoi-su')).toBe('rss:thoi-su');
  });

  it('gọi getRSS và lưu danh sách mục theo chuyên mục', async () => {
    vi.mocked(endpoints.getRSS).mockResolvedValue(
      '<?xml version="1.0"?><rss><channel><item><title>Bài một</title>' +
        '<link>http://localhost/b1</link><pubDate>Mon, 10 Nov 2026 08:00:00 GMT</pubDate>' +
        '<source url="https://vnexpress.net/b1.html">VnExpress</source></item></channel></rss>',
    );

    const store = makeStore();
    await store.dispatch(fetchRSS({ category: 'thoi-su' }));

    expect(endpoints.getRSS).toHaveBeenCalledWith('thoi-su', 20);
    const entry = selectRssEntry(store.getState(), 'thoi-su');
    expect(entry.status).toBe('succeeded');
    expect(entry.items).toHaveLength(1);
    expect(entry.items[0]?.title).toBe('Bài một');
  });

  it('không gọi lại getRSS khi cache còn hiệu lực', async () => {
    vi.mocked(endpoints.getRSS).mockResolvedValue('<rss><channel></channel></rss>');

    const store = makeStore();
    await store.dispatch(fetchRSS({ category: 'thoi-su' }));
    await store.dispatch(fetchRSS({ category: 'thoi-su' }));

    expect(endpoints.getRSS).toHaveBeenCalledTimes(1);
  });

  it('RSS của hai chuyên mục khác nhau không dùng chung cache', async () => {
    vi.mocked(endpoints.getRSS).mockResolvedValue('<rss><channel></channel></rss>');

    const store = makeStore();
    await store.dispatch(fetchRSS({ category: 'thoi-su' }));
    await store.dispatch(fetchRSS({ category: 'the-thao' }));

    expect(endpoints.getRSS).toHaveBeenCalledTimes(2);
  });

  it('ghi lỗi khi tải RSS thất bại', async () => {
    vi.mocked(endpoints.getRSS).mockRejectedValue(new Error('Lỗi mạng'));

    const store = makeStore();
    await store.dispatch(fetchRSS({ category: 'thoi-su' }));

    const entry = selectRssEntry(store.getState(), 'thoi-su');
    expect(entry.status).toBe('failed');
    expect(entry.error).toBeTruthy();
  });
});

describe('articlesSlice - đánh dấu "liên quan cao" (tuần 3 #2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gắn badge cho 3 kết quả đầu khi có từ khoá', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [
        makeArticle({ id: 'a1' }),
        makeArticle({ id: 'a2' }),
        makeArticle({ id: 'a3' }),
        makeArticle({ id: 'a4' }),
      ],
      meta: META,
    });

    const store = makeStore();
    const query = { q: 'bong da', limit: 20, page: 1 };
    await store.dispatch(queryArticles(query));

    expect(selectHighRelevanceIds(store.getState(), listKeyQuery(query))).toEqual([
      'a1',
      'a2',
      'a3',
    ]);
  });

  it('không gắn badge khi không có từ khoá', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    const query = { category: 'thoi-su', limit: 20, page: 1 };
    await store.dispatch(queryArticles(query));

    expect(selectHighRelevanceIds(store.getState(), listKeyQuery(query))).toEqual([]);
  });

  it('không gắn badge ở các trang sau', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    const query = { q: 'bong da', limit: 20, page: 2 };
    await store.dispatch(queryArticles(query));

    expect(selectHighRelevanceIds(store.getState(), listKeyQuery(query))).toEqual([]);
  });

  it('danh sách không có từ khoá không bị ảnh hưởng bởi danh sách có từ khoá', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    const searchQuery = { q: 'bong da', limit: 20, page: 1 };
    await store.dispatch(queryArticles(searchQuery));

    const plainQuery = { category: 'thoi-su', limit: 20, page: 1 };
    await store.dispatch(queryArticles(plainQuery));

    expect(selectHighRelevanceIds(store.getState(), listKeyQuery(plainQuery))).toEqual([]);
    expect(selectHighRelevanceIds(store.getState(), listKeyQuery(searchQuery))).toEqual(['a1']);
  });
});

describe('articlesSlice - debounce + huỷ request cũ + giữ từ khoá (tuần 3 #4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chỉ gọi API một lần khi gõ nhiều từ khoá liên tiếp', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    // Mô phỏng người dùng gõ "b" → "bo" → "bong da".
    const first = store.dispatch(queryArticles({ q: 'b', limit: 20, page: 1 }));
    const second = store.dispatch(queryArticles({ q: 'bo', limit: 20, page: 1 }));
    const third = store.dispatch(queryArticles({ q: 'bong da', limit: 20, page: 1 }));

    await Promise.all([first, second, third]);

    expect(endpoints.getArticles).toHaveBeenCalledTimes(1);
    expect(vi.mocked(endpoints.getArticles).mock.calls[0]?.[0]).toMatchObject({ q: 'bong da' });
  });

  it('huỷ tín hiệu của request cũ khi có từ khoá mới', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    store.dispatch(queryArticles({ q: 'bong', limit: 20, page: 1 }));
    store.dispatch(queryArticles({ q: 'bong da', limit: 20, page: 1 }));

    await vi.waitFor(() => {
      expect(endpoints.getArticles).toHaveBeenCalledTimes(1);
    });

    const signal = vi.mocked(endpoints.getArticles).mock.calls[0]?.[1];
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it('không báo lỗi cho người dùng khi request bị huỷ', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    store.dispatch(queryArticles({ q: 'bong', limit: 20, page: 1 }));
    store.dispatch(queryArticles({ q: 'bong da', limit: 20, page: 1 }));

    await vi.waitFor(() => {
      expect(endpoints.getArticles).toHaveBeenCalledTimes(1);
    });

    const key = listKeyQuery({ q: 'bong da', limit: 20, page: 1 });
    const entry = selectListEntry(store.getState(), key);
    expect(entry.status).toBe('succeeded');
    expect(entry.error).toBeNull();
  });

  it('giữ từ khoá sau khi hết debounce để đồng bộ URL', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    expect(selectActiveQuery(store.getState())).toBeNull();

    await store.dispatch(queryArticles({ q: 'bong da', limit: 20, page: 1 }));

    expect(selectActiveQuery(store.getState())).toBe('bong da');
  });

  it('từ khoá chỉ được chốt sau khi hết debounce, không chốt ngay khi gõ', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    const promise = store.dispatch(queryArticles({ q: 'bong da', limit: 20, page: 1 }));

    // Ngay sau khi dispatch (còn trong thời gian debounce) từ khoá chưa được chốt.
    expect(selectActiveQuery(store.getState())).toBeNull();

    await promise;
    expect(selectActiveQuery(store.getState())).toBe('bong da');
  });

  it('không debounce ở các trang sau (phân trang phải phản hồi ngay)', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(queryArticles({ q: 'bong da', limit: 20, page: 2 }));

    expect(endpoints.getArticles).toHaveBeenCalledTimes(1);
    expect(selectActiveQuery(store.getState())).toBeNull();
  });

  it('giới hạn số cache tìm kiếm để bộ nhớ không phình', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle()],
      meta: META,
    });

    const store = makeStore();
    // Dùng trang 2 để không phải chờ debounce — mục tiêu test là số lượng cache key.
    for (let i = 0; i < 15; i += 1) {
      await store.dispatch(queryArticles({ q: `tu khoa ${i}`, limit: 20, page: 2 }));
    }

    const queryKeys = Object.keys(store.getState().articles.lists).filter((key) =>
      key.startsWith('query'),
    );
    expect(queryKeys.length).toBeLessThanOrEqual(11);
  });

  it('truyền tín hiệu huỷ xuống tầng API', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(queryArticles({ q: 'bong da', limit: 20, page: 1 }));

    const signal = vi.mocked(endpoints.getArticles).mock.calls[0]?.[1];
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);
  });
});

describe('articlesSlice - phân trang', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('key phân trang khác nhau theo số trang', () => {
    expect(listKeyCategory('thoi-su', 1)).not.toBe(listKeyCategory('thoi-su', 2));
    expect(listKeyQuery({ q: 'a', page: 2 })).not.toBe(listKeyQuery({ q: 'a', page: 3 }));
  });

  it('mỗi trang có cache riêng và giữ được meta phân trang', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: { ...META, page: 2, total: 45, totalPages: 3 },
    });

    const store = makeStore();
    await store.dispatch(fetchByCategory({ category: 'thoi-su', page: 2 }));

    const key = listKeyCategory('thoi-su', 2);
    expect(selectListIds(store.getState(), key)).toEqual(['a1']);
    expect(selectListEntry(store.getState(), key).meta).toMatchObject({
      page: 2,
      total: 45,
      totalPages: 3,
    });
  });

  it('tải trang 2 không ghi đè danh sách trang 1', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1' })],
      meta: META,
    });

    const store = makeStore();
    await store.dispatch(fetchByCategory({ category: 'thoi-su', page: 1 }));

    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a2' })],
      meta: META,
    });
    await store.dispatch(fetchByCategory({ category: 'thoi-su', page: 2 }));

    expect(selectListIds(store.getState(), listKeyCategory('thoi-su', 1))).toEqual(['a1']);
    expect(selectListIds(store.getState(), listKeyCategory('thoi-su', 2))).toEqual(['a2']);
  });
});
