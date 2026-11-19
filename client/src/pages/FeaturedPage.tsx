import { useEffect } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { useAppDispatch } from '@/store/hooks';
import { fetchFeatured, LIST_FEATURED } from '@/store/slices/articlesSlice';
import { useListArticles } from '@/hooks/useListArticles';
import { ArticleCard } from '@/components/article/ArticleCard';
import { ArticleSkeleton } from '@/components/article/ArticleSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SectionHeader } from '@/components/common/SectionHeader';

const FEATURED_LIMIT = 12;

export function FeaturedPage() {
  const dispatch = useAppDispatch();
  const { items, meta, isLoading, status, error } = useListArticles(LIST_FEATURED);

  useEffect(() => {
    void dispatch(fetchFeatured(FEATURED_LIMIT));
  }, [dispatch]);

  const retry = (): void => {
    void dispatch(fetchFeatured(FEATURED_LIMIT));
  };

  return (
    <Container className="py-4">
      <title>Tin tức 24h — Tin nổi bật</title>

      <h1 className="h3 mb-1">Tin nổi bật</h1>
      <p className="text-secondary mb-4" role="status" aria-live="polite">
        {meta ? `${meta.total} bài được chọn nổi bật từ nhiều nguồn tin` : 'Đang tải...'}
      </p>

      {isLoading && items.length === 0 && (
        <Row className="g-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Col xs={12} sm={6} lg={4} key={index}>
              <ArticleSkeleton variant="standard" />
            </Col>
          ))}
        </Row>
      )}

      {status === 'failed' && <ErrorState message={error ?? undefined} onRetry={retry} />}

      {status === 'succeeded' && items.length === 0 && (
        <EmptyState
          title="Chưa có tin nổi bật"
          description="Dữ liệu đang được cập nhật, vui lòng thử lại sau ít phút."
        />
      )}

      {items.length > 0 && (
        <>
          <Row className="g-3 mb-4">
            <Col xs={12} lg={8}>
              <ArticleCard article={items[0]} variant="lead" eager />
            </Col>
            <Col xs={12} lg={4}>
              <div className="n24-surface p-3">
                <SectionHeader title="Bài nổi bật khác" />
                {items.slice(1, 6).map((article) => (
                  <div className="home-timeline__item" key={article.id}>
                    <ArticleCard article={article} variant="compact" showCategory />
                  </div>
                ))}
              </div>
            </Col>
          </Row>

          {items.length > 6 && (
            <Row className="g-3">
              {items.slice(6).map((article) => (
                <Col xs={12} sm={6} lg={4} key={article.id}>
                  <ArticleCard article={article} variant="standard" showCategory />
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
    </Container>
  );
}
