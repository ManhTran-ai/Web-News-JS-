import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../index';
import {
  interactionReducer,
  recordRead,
  clearReadingHistory,
  removeReadingHistoryItem,
  addComment,
  removeComment,
  setCommentLiked,
  selectReadingHistory,
  selectCommentsByArticle,
} from './interactionSlice';
import { MAX_READING_HISTORY } from '@/lib/constants';
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

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

describe('interactionSlice', () => {
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
});
