import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '@/lib/constants';
import { readStorage, writeStorage } from '@/lib/storage';
import type { Article } from '@/types/article';
import type { RootState } from '../index';

interface BookmarksState {
  items: Article[];
}

const initialState: BookmarksState = {
  items: readStorage<Article[]>(STORAGE_KEYS.bookmarks, []),
};

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    toggleBookmark(state, action: { payload: Article }) {
      const article = action.payload;
      const index = state.items.findIndex((item) => item.id === article.id);
      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        state.items.unshift(article);
      }
      writeStorage(STORAGE_KEYS.bookmarks, state.items);
    },
    removeBookmark(state, action: { payload: string }) {
      state.items = state.items.filter((item) => item.id !== action.payload);
      writeStorage(STORAGE_KEYS.bookmarks, state.items);
    },
    clearBookmarks(state) {
      state.items = [];
      writeStorage(STORAGE_KEYS.bookmarks, state.items);
    },
  },
});

export const bookmarksReducer = bookmarksSlice.reducer;
export const { toggleBookmark, removeBookmark, clearBookmarks } = bookmarksSlice.actions;

export const selectBookmarks = (state: RootState): Article[] => state.bookmarks.items;

export const selectIsBookmarked = (state: RootState, id: string): boolean =>
  state.bookmarks.items.some((item) => item.id === id);
