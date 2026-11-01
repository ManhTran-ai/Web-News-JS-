import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { CategoryLayout } from '@/layouts/CategoryLayout';
import { HomePage } from '@/pages/HomePage';
import { CategoryIndexPage } from '@/pages/CategoryIndexPage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ArticleDetailPage } from '@/pages/ArticleDetailPage';
import { SearchPage } from '@/pages/SearchPage';
import { SavedPage } from '@/pages/SavedPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'chuyen-muc',
        element: <CategoryLayout />,
        children: [
          { index: true, element: <CategoryIndexPage /> },
          { path: ':slug', element: <CategoryPage /> },
        ],
      },
      { path: 'bai-viet/:id', element: <ArticleDetailPage /> },
      { path: 'tim-kiem', element: <SearchPage /> },
      { path: 'da-luu', element: <SavedPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
