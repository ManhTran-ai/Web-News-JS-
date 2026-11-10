import { useEffect, useMemo } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchByCategory,
  fetchFeatured,
  LIST_FEATURED,
  LIST_LATEST,
  listKeyCategory,
} from '@/store/slices/articlesSlice';
import { selectCategories } from '@/store/slices/categoriesSlice';
import { useListArticles } from '@/hooks/useListArticles';
import { ArticleCard } from '@/components/article/ArticleCard';
import { ArticleSkeleton } from '@/components/article/ArticleSkeleton';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import type { Category } from '@/types/article';

const FEATURED_LIMIT = 8;
const TIMELINE_COUNT = 12;
const TOP_CATEGORY_COUNT = 4;
const PER_CATEGORY_COUNT = 4;
const TIMELINE_WINDOW_HOURS = 24;

function withinHours(iso: string, hours: number): boolean {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= hours * 3_600_000;
}

function CategoryBlock({ category }: { category: Category }) {
  const dispatch = useAppDispatch();
  const key = listKeyCategory(category.slug);
  const { items: articles, isLoading, status, error } = useListArticles(key);

  const retry = (): void => {
    void dispatch(fetchByCategory({ category: category.slug, limit: PER_CATEGORY_COUNT }));
  };

  return (
    <section className="n24-section">
      <SectionHeader title={category.name} to={`/chuyen-muc/${category.slug}`} />

      {isLoading && articles.length === 0 && (
        <Row className="g-3">
          {Array.from({ length: PER_CATEGORY_COUNT }, (_, index) => (
            <Col xs={12} sm={6} lg={3} key={index}>
              <ArticleSkeleton variant="standard" />
            </Col>
          ))}
        </Row>
      )}

      {status === 'failed' && (
        <ErrorState message={error ?? undefined} onRetry={retry} />
      )}

      {status === 'succeeded' && articles.length === 0 && (
        <EmptyState
          title={`Chưa có tin trong ${category.name.toLowerCase()}`}
          description="Mục này hiện chưa có bài viết nào. Hãy quay lại sau ít phút."
        />
      )}

      {articles.length > 0 && (
        <Row className="g-3">
          {articles.map((article) => (
            <Col xs={12} sm={6} lg={3} key={article.id}>
              <ArticleCard article={article} variant="standard" showCategory />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}

export function HomePage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const { items: featured, status: featuredStatus, error: featuredError } =
    useListArticles(LIST_FEATURED);
  const { items: latest } = useListArticles(LIST_LATEST);

  useEffect(() => {
    void dispatch(fetchFeatured(FEATURED_LIMIT));
  }, [dispatch]);

  const topCategories = useMemo(
    () => [...categories].sort((a, b) => b.count - a.count).slice(0, TOP_CATEGORY_COUNT),
    [categories],
  );

  useEffect(() => {
    for (const category of topCategories) {
      void dispatch(fetchByCategory({ category: category.slug, limit: PER_CATEGORY_COUNT }));
    }
  }, [dispatch, topCategories]);

  const retryFeatured = (): void => {
    void dispatch(fetchFeatured(FEATURED_LIMIT));
  };

  const timeline = useMemo(() => {
    const recent = latest.filter((article) => withinHours(article.publishedAt, TIMELINE_WINDOW_HOURS));
    return (recent.length > 0 ? recent : latest).slice(0, TIMELINE_COUNT);
  }, [latest]);

  return (
    <Container className="py-4">
      <title>Tin tức 24h — Trang chủ</title>

      <Row className="g-4">
        <Col lg={8}>
          <section className="n24-section">
            <SectionHeader title="Tin nổi bật" to="/chuyen-muc" linkLabel="Tất cả chuyên mục" />

            {featuredStatus === 'loading' && featured.length === 0 && (
              <ArticleSkeleton variant="lead" />
            )}

            {featuredStatus === 'failed' && (
              <ErrorState message={featuredError ?? undefined} onRetry={retryFeatured} />
            )}

            {featuredStatus === 'succeeded' && featured.length === 0 && (
              <EmptyState                title="Chưa có tin nổi bật"
                description="Dữ liệu đang được cập nhật, vui lòng thử lại sau ít phút."
              />
            )}

            {featured.length > 0 && (
              <>
                <ArticleCard article={featured[0]} variant="lead" eager />

                {featured.length > 1 && (
                  <Row className="g-3 mt-1">
                    {featured.slice(1, 4).map((article) => (
                      <Col xs={12} md={4} key={article.id}>
                        <ArticleCard article={article} variant="standard" />
                      </Col>
                    ))}
                  </Row>
                )}
              </>
            )}
          </section>
        </Col>

        <Col lg={4}>
          <section className="n24-section">
            <div className="n24-surface">
              <SectionHeader title="Tin mới nhất" to="/chuyen-muc" />

              {timeline.length === 0 ? (
                <p className="article-card__summary mb-0">Chưa có tin mới.</p>
              ) : (
                <div className="home-timeline">
                  {timeline.map((article) => (
                    <div className="home-timeline__item" key={article.id}>
                      <ArticleCard article={article} variant="compact" showCategory />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </Col>
      </Row>

      {topCategories.map((category) => (
        <CategoryBlock key={category.slug} category={category} />
      ))}
    </Container>
  );
}
