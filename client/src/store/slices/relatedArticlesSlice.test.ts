import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { getRelated } from '@/api/endpoints';
import { rootReducer } from '../index';
import {
  relatedArticlesReducer,
  fetchRelatedArticles,
  selectRelatedArticles,
  selectRelatedEntry,
} from './relatedArticlesSlice';
import { RELATED_CACHE_TTL_MS } from '@/lib/constants';
import type { Article } from '@/types/article';

vi.mock('@/api/endpoints', () => ({
  getRelated: vi.fn(),
}));

const mockedGetRelated = vi.mocked(getRelated);

function makeArticle(id: string): Article {
  return {
    id,
    title: `Bài ${id}`,
    summary: 'Tóm tắt',
    link: `https://vnexpress.net/${id}.html`,
    sourceId: 'vnexpress',
    source: 'VnExpress',
    category: 'thoi-su',
    publishedAt: new Date().toISOString(),
  };
}

function mockResponse(ids: string[]): void {
  mockedGetRelated.mockResolvedValue({
    data: ids.map(makeArticle),
    meta: { page: 1, limit: 6, total: ids.length, totalPages: 1, updatedAt: '' },
  });
}

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

describe('relatedArticlesSlice', () => {
  afterEach(() => {
    vi.useRealTimers();
    mockedGetRelated.mockReset();
  });

  it('trạng thái ban đầu rỗng', () => {
    const state = relatedArticlesReducer(undefined, { type: 'unknown' });
    expect(state.byId).toEqual({});
  });

  it('tải bài liên quan và lưu vào cache theo id', async () => {
    mockResponse(['r1', 'r2']);

    const store = makeStore();
    await store.dispatch(fetchRelatedArticles({ articleId: 'a1' }));

    expect(selectRelatedArticles(store.getState(), 'a1')).toHaveLength(2);
    expect(selectRelatedEntry(store.getState(), 'a1')?.status).toBe('succeeded');
  });

  it('không gọi lại API khi cache còn hiệu lực', async () => {
    mockResponse(['r1']);

    const store = makeStore();
    await store.dispatch(fetchRelatedArticles({ articleId: 'a1' }));
    await store.dispatch(fetchRelatedArticles({ articleId: 'a1' }));

    expect(mockedGetRelated).toHaveBeenCalledTimes(1);
  });

  it('gọi lại API khi cache đã hết hạn', async () => {
    mockResponse(['r1']);

    const store = makeStore();
    await store.dispatch(fetchRelatedArticles({ articleId: 'a1' }));

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + RELATED_CACHE_TTL_MS + 1000);

    await store.dispatch(fetchRelatedArticles({ articleId: 'a1' }));

    expect(mockedGetRelated).toHaveBeenCalledTimes(2);
  });

  it('bài khác không dùng chung cache', async () => {
    mockResponse(['r1']);

    const store = makeStore();
    await store.dispatch(fetchRelatedArticles({ articleId: 'a1' }));
    await store.dispatch(fetchRelatedArticles({ articleId: 'a2' }));

    expect(mockedGetRelated).toHaveBeenCalledTimes(2);
  });

  it('ghi lỗi khi API thất bại', async () => {
    mockedGetRelated.mockRejectedValue(
      Object.assign(new Error('Lỗi mạng'), { response: { status: 500, data: {} } }),
    );

    const store = makeStore();
    await store.dispatch(fetchRelatedArticles({ articleId: 'a1' }));

    expect(selectRelatedEntry(store.getState(), 'a1')?.status).toBe('failed');
    expect(selectRelatedArticles(store.getState(), 'a1')).toHaveLength(0);
  });
});
