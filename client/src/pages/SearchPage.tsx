import { useCallback, useEffect } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { ArticleCard } from '@/components/article/ArticleCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchArticles, selectListEntry } from '@/store/slices/articlesSlice';
import { useListArticles } from '@/hooks/useListArticles';
import { PAGE_SIZE } from '@/lib/constants';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') ?? '';
  const dispatch = useAppDispatch();
  const key = `search:${keyword}`;
  const entry = useAppSelector((state) => selectListEntry(state, key));
  const articles = useListArticles(key);

  const load = useCallback(() => {
    if (!keyword) return;
    void dispatch(searchArticles({ q: keyword, limit: PAGE_SIZE }));
  }, [dispatch, keyword]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Container className="py-4">
      <h1 className="h3 mb-1">Kết quả tìm kiếm</h1>
      {keyword && (
        <p className="text-secondary mb-4">
          Từ khoá: <strong>{keyword}</strong>
          {entry.meta ? ` — ${entry.meta.total} kết quả` : ''}
        </p>
      )}

      {!keyword && (
        <EmptyState
          title="Chưa nhập từ khoá"
          description="Dùng ô tìm kiếm trên thanh điều hướng để tìm tin."
        />
      )}

      {keyword && entry.status === 'loading' && articles.length === 0 && <Loading />}

      {keyword && entry.status === 'failed' && (
        <ErrorState message={entry.error ?? undefined} onRetry={load} />
      )}

      {keyword && entry.status === 'succeeded' && articles.length === 0 && (
        <EmptyState
          title="Không tìm thấy kết quả"
          description="Thử lại với từ khoá khác hoặc bỏ dấu tiếng Việt."
        />
      )}

      {articles.length > 0 && (
        <Row className="row-cols-1 row-cols-md-2 g-3">
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
