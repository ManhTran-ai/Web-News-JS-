import { describe, expect, it, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../index';
import {
  articlesReducer,
  clearList,
  fetchByCategory,
  fetchCategoryLatest,
  fetchLatest,
  listKeyCategory,
  listKeyCategoryLatest,
  listKeyQuery,
  listKeySearch,
  selectListEntry,
  selectListIds,
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
