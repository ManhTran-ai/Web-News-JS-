// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../index';
import {
  interactionReducer,
  recordRead,
  clearReadingHistory,
  clearReadingHistoryByRange,
  removeReadingHistoryItem,
  addComment,
  removeComment,
  restoreComment,
  clearLastDeleted,
  setCommentError,
  setCommentLiked,
  selectReadingHistory,
  selectCommentsByArticle,
  selectCommentError,
  selectLastDeleted,
  selectTodayReadCount,
} from './interactionSlice';
import { MAX_READING_HISTORY, STORAGE_KEYS } from '@/lib/constants';
import type { Article, Comment } from '@/types/article';

const article: Article = {
  id: 'a1',
  title: 'Bài viết',
  summary: 'Tóm tắt',
  link: 'https://vnexpress.net/a1.html',
  sourceId: 'vnexpress',
  source: 'VnExpress',
  category: 'thoi-su',
  publishedAt: new Date().toISOString(),
};

const comment: Comment = {
  id: 'c1',
  articleId: 'a1',
  userId: 'u1',
  content: 'Bình luận hay',
  isAnonymous: false,
  createdAt: new Date().toISOString(),
  likes: 0,
};

/** Bình luận ẩn danh — vẫn phải gắn userId để chủ bình luận xoá được. */
const anonymousComment: Comment = {
  ...comment,
  id: 'c2',
  user: undefined,
  isAnonymous: true,
};

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

function readStorage<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key);
  return raw === null ? null : (JSON.parse(raw) as T);
}

describe('interactionSlice', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('trạng thái ban đầu rỗng', () => {
    const state = interactionReducer(undefined, { type: 'unknown' });
    expect(state.readingHistory).toHaveLength(0);
    expect(state.comments).toEqual({});
  });

  it('ghi lịch sử đọc mới nhất lên đầu', () => {
    const store = makeStore();

    store.dispatch(recordRead(article));

    expect(selectReadingHistory(store.getState())).toHaveLength(1);
    expect(selectReadingHistory(store.getState())[0]?.article.id).toBe('a1');
  });

  it('không ghi trùng cùng một bài', () => {
    const store = makeStore();

    store.dispatch(recordRead(article));
    store.dispatch(recordRead(article));

    expect(selectReadingHistory(store.getState())).toHaveLength(1);
  });

  it('xoá lịch sử đọc', () => {
    const store = makeStore();

    store.dispatch(recordRead(article));
    store.dispatch(clearReadingHistory());

    expect(selectReadingHistory(store.getState())).toHaveLength(0);
  });

  it('thêm bình luận theo articleId', () => {
    const store = makeStore();

    store.dispatch(addComment(comment));

    expect(selectCommentsByArticle(store.getState(), 'a1')).toHaveLength(1);
    expect(selectCommentsByArticle(store.getState(), 'a1')[0]?.content).toBe('Bình luận hay');
  });

  it('xoá bình luận theo id', () => {
    const store = makeStore();

    store.dispatch(addComment(comment));
    store.dispatch(removeComment({ articleId: 'a1', commentId: 'c1' }));

    expect(selectCommentsByArticle(store.getState(), 'a1')).toHaveLength(0);
  });

  it('đánh dấu đã thích bình luận', () => {
    const store = makeStore();

    store.dispatch(addComment(comment));
    store.dispatch(setCommentLiked({ articleId: 'a1', commentId: 'c1', liked: true }));

    expect(selectCommentsByArticle(store.getState(), 'a1')[0]?.likes).toBe(1);
  });

  it('bỏ đánh dấu thích', () => {
    const store = makeStore();

    store.dispatch(addComment(comment));
    store.dispatch(setCommentLiked({ articleId: 'a1', commentId: 'c1', liked: true }));
    store.dispatch(setCommentLiked({ articleId: 'a1', commentId: 'c1', liked: false }));

    expect(selectCommentsByArticle(store.getState(), 'a1')[0]?.likes).toBe(0);
  });

  it('bình luận của bài khác không bị ảnh hưởng', () => {
    const store = makeStore();

    store.dispatch(addComment(comment));
    store.dispatch(removeComment({ articleId: 'a2', commentId: 'c1' }));

    expect(selectCommentsByArticle(store.getState(), 'a1')).toHaveLength(1);
  });

  it('giới hạn lịch sử đọc ở mức tối đa', () => {
    const store = makeStore();

    for (let index = 0; index < MAX_READING_HISTORY + 10; index += 1) {
      store.dispatch(recordRead({ ...article, id: `a${index}` }));
    }

    expect(selectReadingHistory(store.getState())).toHaveLength(MAX_READING_HISTORY);
  });

  it('xoá một mục khỏi lịch sử đọc', () => {
    const store = makeStore();

    store.dispatch(recordRead(article));
    store.dispatch(recordRead({ ...article, id: 'a2' }));
    store.dispatch(removeReadingHistoryItem('a1'));

    const history = selectReadingHistory(store.getState());
    expect(history).toHaveLength(1);
    expect(history[0]?.article.id).toBe('a2');
  });

  it('bình luận ẩn danh vẫn gắn userId để chủ xoá được', () => {
    const store = makeStore();

    store.dispatch(addComment(anonymousComment));

    const stored = selectCommentsByArticle(store.getState(), 'a1')[0];
    expect(stored?.isAnonymous).toBe(true);
    expect(stored?.user).toBeUndefined();
    expect(stored?.userId).toBe('u1');
  });

  it('giữ bình luận cũ khi tải lại trang', () => {
    const store = makeStore();
    store.dispatch(addComment(comment));

    // Trang được nạp lại: state khởi tạo lại từ localStorage.
    const persisted = readStorage<Record<string, Comment[]>>(STORAGE_KEYS.comments) ?? {};

    expect(persisted.a1).toHaveLength(1);
    expect(persisted.a1?.[0]?.content).toBe('Bình luận hay');
  });

  it('giữ bình luận đã xoá để hoàn tác được sau khi tải lại trang', () => {
    const store = makeStore();
    store.dispatch(addComment(comment));
    store.dispatch(removeComment({ articleId: 'a1', commentId: 'c1' }));

    const persisted = readStorage<{ comment: Comment }>(STORAGE_KEYS.deletedComments);

    expect(persisted?.comment.id).toBe('c1');
  });

  it('khôi phục bình luận đã xoá', () => {
    const store = makeStore();
    store.dispatch(addComment(comment));
    store.dispatch(removeComment({ articleId: 'a1', commentId: 'c1' }));

    store.dispatch(restoreComment());

    const comments = selectCommentsByArticle(store.getState(), 'a1');
    expect(comments).toHaveLength(1);
    expect(comments[0]?.id).toBe('c1');
    expect(selectLastDeleted(store.getState())).toBeNull();
  });

  it('khôi phục bình luận không nhân bản khi bình luận đã tồn tại', () => {
    const store = makeStore();
    store.dispatch(addComment(comment));
    store.dispatch(removeComment({ articleId: 'a1', commentId: 'c1' }));
    store.dispatch(addComment(comment));

    store.dispatch(restoreComment());

    expect(selectCommentsByArticle(store.getState(), 'a1')).toHaveLength(1);
  });

  it('bỏ qua thao tác hoàn tác khi không có bình luận nào bị xoá', () => {
    const store = makeStore();

    store.dispatch(restoreComment());

    expect(selectLastDeleted(store.getState())).toBeNull();
  });

  it('xoá thông tin bình luận đã xoá khi đóng toast', () => {
    const store = makeStore();
    store.dispatch(addComment(comment));
    store.dispatch(removeComment({ articleId: 'a1', commentId: 'c1' }));

    store.dispatch(clearLastDeleted());

    expect(selectLastDeleted(store.getState())).toBeNull();
  });

  it('hiển thị và xoá thông báo lỗi bình luận', () => {
    const store = makeStore();

    store.dispatch(setCommentError('Không lưu được bình luận.'));
    expect(selectCommentError(store.getState())).toBe('Không lưu được bình luận.');

    store.dispatch(setCommentError(null));
    expect(selectCommentError(store.getState())).toBeNull();
  });

  it('xoá lịch sử đọc theo khoảng "hôm nay" — giữ lại các mục cũ hơn', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 86_400_000).toISOString();

    const state = interactionReducer(undefined, { type: 'unknown' });
    const seeded = {
      ...state,
      readingHistory: [
        { article: { ...article, id: 'a1' }, readAt: now.toISOString() },
        { article: { ...article, id: 'a2' }, readAt: twoDaysAgo },
      ],
    };

    const next = interactionReducer(seeded, clearReadingHistoryByRange('today'));

    expect(next.readingHistory).toHaveLength(1);
    expect(next.readingHistory[0]?.article.id).toBe('a2');
  });

  it('xoá toàn bộ lịch sử đọc khi chọn khoảng "tất cả"', () => {
    const state = interactionReducer(undefined, { type: 'unknown' });
    const seeded = {
      ...state,
      readingHistory: [{ article, readAt: new Date().toISOString() }],
    };

    const next = interactionReducer(seeded, clearReadingHistoryByRange('all'));

    expect(next.readingHistory).toHaveLength(0);
  });

  it('xoá lịch sử đọc trong vòng 7 ngày khi chọn khoảng "7 ngày"', () => {
    const now = new Date();
    const state = interactionReducer(undefined, { type: 'unknown' });
    const seeded = {
      ...state,
      readingHistory: [
        { article: { ...article, id: 'a1' }, readAt: now.toISOString() },
        {
          article: { ...article, id: 'a2' },
          readAt: new Date(now.getTime() - 3 * 86_400_000).toISOString(),
        },
        {
          article: { ...article, id: 'a3' },
          readAt: new Date(now.getTime() - 30 * 86_400_000).toISOString(),
        },
      ],
    };

    const next = interactionReducer(seeded, clearReadingHistoryByRange('week'));

    expect(next.readingHistory.map((entry) => entry.article.id)).toEqual(['a3']);
  });

  it('đếm số bài đã đọc hôm nay', () => {
    const store = makeStore();

    store.dispatch(recordRead(article));
    store.dispatch(recordRead({ ...article, id: 'a2' }));

    expect(selectTodayReadCount(store.getState())).toBe(2);
  });
});
