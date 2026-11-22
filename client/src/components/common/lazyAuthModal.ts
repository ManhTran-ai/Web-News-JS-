import { lazy } from 'react';

export const LazyAuthModal = lazy(() =>
  import('@/components/common/AuthModal').then((m) => ({ default: m.AuthModal })),
);
