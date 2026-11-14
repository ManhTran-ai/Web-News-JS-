import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '@/lib/constants';
import { readStorage, writeStorage } from '@/lib/storage';
import type { Article, Comment } from '@/types/article';

interface ReadingHistoryEntry {
  article: Article;
  readAt: string;
}

interface InteractionState {
  readingHistory: ReadingHistoryEntry[];
  comments: Record<string, Comment[]>;
}

const initialState: InteractionState = {
  readingHistory: readStorage<ReadingHistoryEntry[]>(STORAGE_KEYS.readingHistory, []),
  comments: readStorage<Record<string, Comment[]>>(STORAGE_KEYS.comments, {}),
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    recordRead(state, action: { payload: Article }) {
      const article = action.payload;
      state.readingHistory = state.readingHistory.filter((item) => item.article.id !== article.id);
      state.readingHistory.unshift({ article, readAt: new Date().toISOString() });
      writeStorage(STORAGE_KEYS.readingHistory, state.readingHistory);
    },
    clearReadingHistory(state) {
      state.readingHistory = [];
      writeStorage(STORAGE_KEYS.readingHistory, state.readingHistory);
    },
    addComment(state, action: { payload: Comment }) {
      const comment = action.payload;
      const list = (state.comments[comment.articleId] ??= []);
      list.push(comment);
      writeStorage(STORAGE_KEYS.comments, state.comments);
    },
    removeComment(state, action: { payload: { articleId: string; commentId: string } }) {
      const { articleId, commentId } = action.payload;
      const list = state.comments[articleId];
      if (!list) return;
      state.comments[articleId] = list.filter((comment) => comment.id !== commentId);
      writeStorage(STORAGE_KEYS.comments, state.comments);
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
  addComment,
  removeComment,
  setCommentLiked,
} = interactionSlice.actions;

export const selectReadingHistory = (state: { interaction: InteractionState }) =>
  state.interaction.readingHistory;

export const selectCommentsByArticle = (
  state: { interaction: InteractionState },
  articleId: string,
): Comment[] => state.interaction.comments[articleId] ?? [];
