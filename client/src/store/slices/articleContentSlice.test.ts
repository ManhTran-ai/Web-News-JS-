import { describe, expect, it, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../index';
import {
  articleContentReducer,
  fetchArticleContent,
  selectCachedContentCount,
  selectContentEntry,
  selectContentsById,
} from './articleContentSlice';
import type { ArticleContent } from '@/types/article';

vi.mock('@/api/endpoints', () => ({
  getArticleContent: vi.fn(),
}));

const { getArticleContent } = await import('@/api/endpoints');

const content: ArticleContent = {
  id: 'x1',
  contentHtml: '<p>Nội dung</p>',
  fetchedAt: new Date().toISOString(),
};

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

describe('articleContentSlice', () => {
  beforeEach(() => {
    vi.mocked(getArticleContent).mockReset();
  });

  it('trạng thái ban đầu rỗng', () => {
    const state = articleContentReducer(undefined, { type: 'unknown' });
    expect(Object.keys(state.contentsById)).toHaveLength(0);
  });

  it('lưu nội dung theo id khi tải thành công', async () => {
    vi.mocked(getArticleContent).mockResolvedValue(content);
    const store = makeStore();

    await store.dispatch(fetchArticleContent('x1'));

    expect(selectContentEntry(store.getState(), 'x1')?.status).toBe('succeeded');
    expect(selectContentEntry(store.getState(), 'x1')?.data?.id).toBe('x1');
  });

  it('ghi lỗi khi tải thất bại', async () => {
    vi.mocked(getArticleContent).mockRejectedValue(new Error('Lỗi mạng'));
    const store = makeStore();

    await store.dispatch(fetchArticleContent('x2'));

    expect(selectContentEntry(store.getState(), 'x2')?.status).toBe('failed');
    expect(selectContentEntry(store.getState(), 'x2')?.error).toBeTruthy();
  });

  it('đếm số nội dung đang cache', async () => {
    vi.mocked(getArticleContent).mockResolvedValue(content);
    const store = makeStore();

    await store.dispatch(fetchArticleContent('x1'));
    await store.dispatch(fetchArticleContent('x2'));

    expect(selectCachedContentCount(store.getState())).toBe(2);
    expect(Object.keys(selectContentsById(store.getState()))).toHaveLength(2);
  });

  it('trả về nội dung đã cache mà không gọi lại API', async () => {
    vi.mocked(getArticleContent).mockImplementation(async (id: string) => ({ ...content, id }));
    const store = makeStore();

    await store.dispatch(fetchArticleContent('x3'));
    await store.dispatch(fetchArticleContent('x3'));

    expect(selectContentEntry(store.getState(), 'x3')?.data?.id).toBe('x3');
    expect(getArticleContent).toHaveBeenCalledTimes(1);
  });
});
