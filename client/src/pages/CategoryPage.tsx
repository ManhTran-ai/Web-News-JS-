import { useCallback, useEffect } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { ArticleCard } from '@/components/article/ArticleCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchByCategory, selectListArticles, selectListEntry } from '@/store/slices/articlesSlice';
import { PAGE_SIZE } from '@/lib/constants';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const dispatch = useAppDispatch();
  const key = `category:${slug}`;
  const entry = useAppSelector((state) => selectListEntry(state, key));
  const articles = useAppSelector((state) => selectListArticles(state, key));

  const load = useCallback(() => {
    void dispatch(fetchByCategory({ category: slug, limit: PAGE_SIZE }));
  }, [dispatch, slug]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="py-4">
      <h1 className="h3 mb-4 text-capitalize">{slug.replace(/-/g, ' ')}</h1>

      {entry.status === 'loading' && articles.length === 0 && <Loading />}

      {entry.status === 'failed' && (
        <ErrorState message={entry.error ?? undefined} onRetry={load} />
      )}

      {entry.status === 'succeeded' && articles.length === 0 && <EmptyState />}

      {articles.length > 0 && (
        <Row className="row-cols-1 row-cols-md-2 g-3">
          {articles.map((article) => (
            <Col key={article.id}>
              <ArticleCard article={article} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
