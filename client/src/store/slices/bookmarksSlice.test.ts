import { describe, expect, it } from 'vitest';
import { bookmarksReducer, toggleBookmark, removeBookmark } from './bookmarksSlice';
import type { Article } from '@/types/article';

const article: Article = {
  id: 'abc123',
  title: 'Bài test',
  summary: 'Tóm tắt',
  link: 'https://vnexpress.net/bai-test.html',
  sourceId: 'vnexpress',
  source: 'VnExpress',
  category: 'thoi-su',
  publishedAt: '2026-11-01T00:00:00.000Z',
};

describe('bookmarksSlice', () => {
  it('thêm bài vào danh sách lưu', () => {
    const state = bookmarksReducer(undefined, toggleBookmark(article));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.id).toBe('abc123');
  });

  it('gỡ bài khi bấm lần hai', () => {
    let state = bookmarksReducer(undefined, toggleBookmark(article));
    state = bookmarksReducer(state, toggleBookmark(article));
    expect(state.items).toHaveLength(0);
  });

  it('xoá bài theo id', () => {
    let state = bookmarksReducer(undefined, toggleBookmark(article));
    state = bookmarksReducer(state, removeBookmark('abc123'));
    expect(state.items).toHaveLength(0);
  });
});
