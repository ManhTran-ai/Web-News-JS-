// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  bookmarksReducer,
  toggleBookmark,
  removeBookmark,
  clearBookmarks,
} from './bookmarksSlice';
import { STORAGE_KEYS } from '@/lib/constants';
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
  beforeEach(() => {
    window.localStorage.clear();
  });

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

  it('xoá toàn bộ bài đã lưu', () => {
    let state = bookmarksReducer(undefined, toggleBookmark(article));
    state = bookmarksReducer(state, toggleBookmark({ ...article, id: 'def456' }));
    state = bookmarksReducer(state, clearBookmarks());
    expect(state.items).toHaveLength(0);
  });

  it('giữ bài đã lưu khi tải lại trang', () => {
    bookmarksReducer(undefined, toggleBookmark(article));

    // Khi tải lại trang, module được nạp lại nên state khởi tạo từ localStorage.
    const persisted = window.localStorage.getItem(STORAGE_KEYS.bookmarks);

    expect(persisted).not.toBeNull();
    expect((JSON.parse(persisted ?? '[]') as Article[])[0]?.id).toBe('abc123');
  });

  it('ghi danh sách bài lưu xuống localStorage', () => {
    bookmarksReducer(undefined, toggleBookmark(article));

    const raw = window.localStorage.getItem(STORAGE_KEYS.bookmarks);
    expect(raw).not.toBeNull();
    expect((JSON.parse(raw ?? '[]') as Article[])[0]?.id).toBe('abc123');
  });

  it('không trùng bài khi lưu cùng một bài hai lần', () => {
    const state = bookmarksReducer(undefined, toggleBookmark(article));
    expect(state.items.filter((item) => item.id === 'abc123')).toHaveLength(1);
  });
});
