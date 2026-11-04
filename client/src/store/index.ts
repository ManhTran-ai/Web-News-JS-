import { configureStore } from '@reduxjs/toolkit';
import { categoriesReducer } from './slices/categoriesSlice';
import { articlesReducer } from './slices/articlesSlice';
import { articleContentReducer } from './slices/articleContentSlice';
import { bookmarksReducer } from './slices/bookmarksSlice';
import { uiReducer } from './slices/uiSlice';

export const rootReducer = {
  categories: categoriesReducer,
  articles: articlesReducer,
  articleContent: articleContentReducer,
  bookmarks: bookmarksReducer,
  ui: uiReducer,
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;