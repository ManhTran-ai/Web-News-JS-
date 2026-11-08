import { useEffect } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategoryLatest, listKeyCategoryLatest } from '@/store/slices/articlesSlice';
import { fetchCategories, selectCategories } from '@/store/slices/categoriesSlice';
import { useListArticles } from '@/hooks/useListArticles';
import { ArticleCard } from '@/components/article/ArticleCard';
import { ArticleSkeleton } from '@/components/article/ArticleSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import type { Category } from '@/types/article';

function CategoryCard({ category }: { category: Category }) {
  const dispatch = useAppDispatch();
  const key = listKeyCategoryLatest(category.slug);
  const { items, isLoading } = useListArticles(key);
  const representative = items[0];

  useEffect(() => {
    void dispatch(fetchCategoryLatest({ category: category.slug }));
  }, [dispatch, category.slug]);

  return (
    <Col xs={12} sm={6} lg={4} xl={3}>
      <article className="category-card">
        {isLoading && !representative ? (
          <ArticleSkeleton variant="standard" />
        ) : representative ? (
          <ArticleCard article={representative} variant="standard" showCategory />
        ) : (
          <div className="n24-surface">
            <p className="article-card__summary mb-0">Chưa có bài viết nào trong mục này.</p>
          </div>
        )}

        <h2 className="category-card__title">
          <Link to={`/chuyen-muc/${category.slug}`}>{category.name}</Link>
        </h2>
        <p className="category-card__count">{category.count} bài viết</p>
      </article>
    </Col>
  );
}

/**
 * Trang index của `chuyen-muc` — lưới 11 chuyên mục kèm bài mới nhất đại diện
 * và số bài viết của từng mục.
 */
export function CategoryIndexPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);

  useEffect(() => {
    if (categories.length === 0) {
      void dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  return (
    <Container className="py-4">
      <title>Tin tức 24h — Chuyên mục</title>
      <h1 className="h3 mb-1">Chuyên mục</h1>
      <p className="text-secondary mb-4">
        Chọn một chuyên mục để xem tin mới nhất của mục đó.
      </p>

      {categories.length === 0 ? (
        <EmptyState
          title="Đang tải danh sách chuyên mục"
          description="Dữ liệu chuyên mục đang được tải, vui lòng chờ giây lát."
        />
      ) : (
        <Row className="g-3">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </Row>
      )}
    </Container>
  );
}
