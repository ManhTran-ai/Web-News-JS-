import { configureStore } from '@reduxjs/toolkit';
import { categoriesReducer } from './slices/categoriesSlice';
import { articlesReducer } from './slices/articlesSlice';
import { articleContentReducer } from './slices/articleContentSlice';
import { bookmarksReducer } from './slices/bookmarksSlice';

export const store = configureStore({
  reducer: {
    categories: categoriesReducer,
    articles: articlesReducer,
    articleContent: articleContentReducer,
    bookmarks: bookmarksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
