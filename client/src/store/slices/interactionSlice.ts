import { createSlice } from '@reduxjs/toolkit';
import { MAX_READING_HISTORY, STORAGE_KEYS, type HistoryRange } from '@/lib/constants';
import { readStorage, writeStorage } from '@/lib/storage';
import { historyCutoff, isToday } from '@/lib/time';
import type { Article, Comment } from '@/types/article';

interface ReadingHistoryEntry {
  article: Article;
  readAt: string;
}

export interface DeletedComment {
  articleId: string;
  comment: Comment;
  deletedAt: string;
}

interface InteractionState {
  readingHistory: ReadingHistoryEntry[];
  comments: Record<string, Comment[]>;
  /** Thông báo lỗi hiển thị dạng toast ở vùng bình luận. */
  commentError: string | null;
  /** Bình luận vừa xoá — giữ lại để người dùng bấm "Hoàn tác". */
  lastDeleted: DeletedComment | null;
}

const initialState: InteractionState = {
  readingHistory: readStorage<ReadingHistoryEntry[]>(STORAGE_KEYS.readingHistory, []),
  comments: readStorage<Record<string, Comment[]>>(STORAGE_KEYS.comments, {}),
  commentError: null,
  lastDeleted: readStorage<DeletedComment | null>(STORAGE_KEYS.deletedComments, null),
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    recordRead(state, action: { payload: Article }) {
      const article = action.payload;
      state.readingHistory = state.readingHistory.filter((item) => item.article.id !== article.id);
      state.readingHistory.unshift({ article, readAt: new Date().toISOString() });
      if (state.readingHistory.length > MAX_READING_HISTORY) {
        state.readingHistory = state.readingHistory.slice(0, MAX_READING_HISTORY);
      }
      writeStorage(STORAGE_KEYS.readingHistory, state.readingHistory);
    },
    clearReadingHistory(state) {
      state.readingHistory = [];
      writeStorage(STORAGE_KEYS.readingHistory, state.readingHistory);
    },
    removeReadingHistoryItem(state, action: { payload: string }) {
      state.readingHistory = state.readingHistory.filter(
        (item) => item.article.id !== action.payload,
      );
      writeStorage(STORAGE_KEYS.readingHistory, state.readingHistory);
    },
    /** Xoá lịch sử đọc theo khoảng thời gian — "hôm nay", "7 ngày" hoặc "tất cả". */
    clearReadingHistoryByRange(state, action: { payload: HistoryRange }) {
      const cutoff = historyCutoff(action.payload);
      if (cutoff === null) {
        state.readingHistory = [];
      } else {
        state.readingHistory = state.readingHistory.filter((item) => {
          const readAt = Date.parse(item.readAt);
          if (Number.isNaN(readAt)) return false;
          return readAt < cutoff;
        });
      }
      writeStorage(STORAGE_KEYS.readingHistory, state.readingHistory);
    },
    addComment(state, action: { payload: Comment }) {
      const comment = action.payload;
      const list = (state.comments[comment.articleId] ??= []);
      list.push(comment);
      state.commentError = null;
      if (!writeStorage(STORAGE_KEYS.comments, state.comments)) {
        state.commentError = 'Không lưu được bình luận xuống trình duyệt.';
      }
    },
    removeComment(state, action: { payload: { articleId: string; commentId: string } }) {
      const { articleId, commentId } = action.payload;
      const list = state.comments[articleId];
      if (!list) return;

      const index = list.findIndex((comment) => comment.id === commentId);
      if (index < 0) return;

      // Giữ lại bình luận vừa xoá để có thể hoàn tác.
      state.lastDeleted = {
        articleId,
        comment: list[index],
        deletedAt: new Date().toISOString(),
      };

      state.comments[articleId] = list.filter((comment) => comment.id !== commentId);
      writeStorage(STORAGE_KEYS.comments, state.comments);
      // Giữ cả bình luận đã xoá trong localStorage để nút "Hoàn tác" còn hiệu lực sau khi reload.
      writeStorage(STORAGE_KEYS.deletedComments, state.lastDeleted);
    },
    /** Khôi phục bình luận đã xoá — dùng cho nút "Hoàn tác" trên toast. */
    restoreComment(state) {
      const deleted = state.lastDeleted;
      if (!deleted) return;

      const list = (state.comments[deleted.articleId] ??= []);
      if (!list.some((comment) => comment.id === deleted.comment.id)) {
        list.push(deleted.comment);
      }
      state.lastDeleted = null;
      state.commentError = null;
      writeStorage(STORAGE_KEYS.comments, state.comments);
      writeStorage(STORAGE_KEYS.deletedComments, null);
    },
    clearLastDeleted(state) {
      state.lastDeleted = null;
      writeStorage(STORAGE_KEYS.deletedComments, null);
    },
    setCommentError(state, action: { payload: string | null }) {
      state.commentError = action.payload;
    },
    setCommentLiked(
      state,
      action: { payload: { articleId: string; commentId: string; liked: boolean } },
    ) {
      const { articleId, commentId, liked } = action.payload;
      const comment = state.comments[articleId]?.find((item) => item.id === commentId);
      if (!comment) return;
      const next = liked ? 1 : 0;
      if (comment.likes === next) return;
      comment.likes = next;
      writeStorage(STORAGE_KEYS.comments, state.comments);
    },
  },
});

export const interactionReducer = interactionSlice.reducer;
export const {
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
} = interactionSlice.actions;

export const selectReadingHistory = (state: { interaction: InteractionState }) =>
  state.interaction.readingHistory;

export const selectCommentsByArticle = (
  state: { interaction: InteractionState },
  articleId: string,
): Comment[] => state.interaction.comments[articleId] ?? [];

export const selectCommentError = (state: { interaction: InteractionState }): string | null =>
  state.interaction.commentError;

export const selectLastDeleted = (state: { interaction: InteractionState }): DeletedComment | null =>
  state.interaction.lastDeleted;

/** Số bài đã đọc hôm nay — dùng cho thanh tiến độ trên trang "Đã lưu". */
export const selectTodayReadCount = (state: { interaction: InteractionState }): number =>
  state.interaction.readingHistory.filter((entry) => isToday(entry.readAt)).length;
