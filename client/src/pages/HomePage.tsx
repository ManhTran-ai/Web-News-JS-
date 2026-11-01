import { useCallback, useEffect } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { ArticleCard } from '@/components/article/ArticleCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchLatest } from '@/store/slices/articlesSlice';
import { selectListArticles, selectListEntry } from '@/store/slices/articlesSlice';
import { usePolling } from '@/hooks/usePolling';
import { PAGE_SIZE, POLLING_INTERVAL_MS } from '@/lib/constants';

export function HomePage() {
  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => selectListEntry(state, 'latest'));
  const articles = useAppSelector((state) => selectListArticles(state, 'latest'));

  const load = useCallback(() => {
    void dispatch(fetchLatest(PAGE_SIZE));
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  usePolling(load, POLLING_INTERVAL_MS);

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">Tin mới nhất</h1>

      {entry.status === 'loading' && articles.length === 0 && <Loading />}

      {entry.status === 'failed' && (
        <ErrorState message={entry.error ?? undefined} onRetry={load} />
      )}

      {entry.status === 'succeeded' && articles.length === 0 && <EmptyState />}

      {articles.length > 0 && (
        <Row className="row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {articles.map((article) => (
            <Col key={article.id}>
              <ArticleCard article={article} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
