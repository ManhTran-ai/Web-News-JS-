import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { AppNavbar } from '@/components/layout/AppNavbar';
import { AppFooter } from '@/components/layout/AppFooter';
import { BreakingTicker } from '@/components/common/BreakingTicker';
import { useAppDispatch } from '@/store/hooks';
import { useListArticles } from '@/hooks/useListArticles';
import { usePolling } from '@/hooks/usePolling';
import { fetchLatest, LIST_LATEST } from '@/store/slices/articlesSlice';
import { POLLING_INTERVAL_MS } from '@/lib/constants';

const LATEST_LIMIT = 20;
const TICKER_COUNT = 6;

export function RootLayout() {
  const dispatch = useAppDispatch();
  const latest = useListArticles(LIST_LATEST);

  useEffect(() => {
    void dispatch(fetchLatest(LATEST_LIMIT));
  }, [dispatch]);

  usePolling(() => {
    void dispatch(fetchLatest(LATEST_LIMIT));
  }, POLLING_INTERVAL_MS);

  const tickerArticles = latest.slice(0, TICKER_COUNT);

  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />

      {tickerArticles.length > 0 && (
        <div className="container breaking-ticker-wrap">
          <BreakingTicker articles={tickerArticles} />
        </div>
      )}

      <main className="flex-grow-1">
        <Outlet />
      </main>

      <AppFooter />
      <ScrollRestoration />
    </div>
  );
}