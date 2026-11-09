import { Suspense, lazy, type ReactNode } from 'react';
import {
  createBrowserRouter,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { CategoryLayout } from '@/layouts/CategoryLayout';
import { Loading } from '@/components/common/Loading';
import { ArticleSkeleton } from '@/components/article/ArticleSkeleton';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const CategoryIndexPage = lazy(() =>
  import('@/pages/CategoryIndexPage').then((m) => ({ default: m.CategoryIndexPage })),
);
const CategoryPage = lazy(() =>
  import('@/pages/CategoryPage').then((m) => ({ default: m.CategoryPage })),
);
const ArticleDetailPage = lazy(() =>
  import('@/pages/ArticleDetailPage').then((m) => ({ default: m.ArticleDetailPage })),
);
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const SavedPage = lazy(() => import('@/pages/SavedPage').then((m) => ({ default: m.SavedPage })));
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

const listFallback = <ArticleSkeleton variant="standard" count={3} />;
const detailFallback = <Loading label="Đang tải bài viết..." />;

function withSuspense(element: ReactNode, fallback: ReactNode = listFallback) {
  return <Suspense fallback={fallback}>{element}</Suspense>;
}

function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="container py-5 text-center">
        <p className="article-meta mb-2">{error.status}</p>
        <h1 className="h4 mb-3">{error.statusText || 'Không tìm thấy trang'}</h1>
        <a className="btn btn-dark" href="/">
          Về trang chủ
        </a>
      </div>
    );
  }

  return (
    <div className="container py-5 text-center">
      <h1 className="h4 mb-3">Đã có lỗi xảy ra</h1>
      <p className="article-meta mb-3">Vui lòng tải lại trang.</p>
      <a className="btn btn-dark" href="/">
        Về trang chủ
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      {
        path: 'chuyen-muc',
        element: <CategoryLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: withSuspense(<CategoryIndexPage />) },
          { path: ':slug', element: withSuspense(<CategoryPage />) },
        ],
      },
      {
        path: 'bai-viet/:id',
        element: withSuspense(<ArticleDetailPage />, detailFallback),
        errorElement: <RouteErrorPage />,
      },
      { path: 'tim-kiem', element: withSuspense(<SearchPage />) },
      { path: 'da-luu', element: withSuspense(<SavedPage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
]);