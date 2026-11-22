import { lazy } from 'react';

export const LazyCommentSection = lazy(() =>
  import('@/components/article/CommentSection').then((m) => ({ default: m.CommentSection })),
);

export const LazyReaderToolbar = lazy(() =>
  import('@/components/article/ReaderToolbar').then((m) => ({ default: m.ReaderToolbar })),
);
