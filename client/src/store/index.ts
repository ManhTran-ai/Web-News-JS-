import { configureStore } from '@reduxjs/toolkit';
import { categoriesReducer } from './slices/categoriesSlice';
import { sourcesReducer } from './slices/sourcesSlice';
import { articlesReducer } from './slices/articlesSlice';
import { articleContentReducer } from './slices/articleContentSlice';
import { bookmarksReducer } from './slices/bookmarksSlice';
import { authReducer } from './slices/authSlice';
import { interactionReducer } from './slices/interactionSlice';
import { uiReducer } from './slices/uiSlice';

export const rootReducer = {
  categories: categoriesReducer,
  sources: sourcesReducer,
  articles: articlesReducer,
  articleContent: articleContentReducer,
  bookmarks: bookmarksReducer,
  auth: authReducer,
  interaction: interactionReducer,
  ui: uiReducer,
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
