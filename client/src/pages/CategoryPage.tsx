import { useEffect } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchByCategory, listKeyCategory } from '@/store/slices/articlesSlice';
import { selectCategories } from '@/store/slices/categoriesSlice';
import { selectSources } from '@/store/slices/sourcesSlice';
import { useListArticles } from '@/hooks/useListArticles';
import { ArticleCard } from '@/components/article/ArticleCard';
import { ArticleSkeleton } from '@/components/article/ArticleSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { PAGE_SIZE } from '@/lib/constants';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const categories = useAppSelector(selectCategories);
  const sources = useAppSelector(selectSources);

  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const source = searchParams.get('source') ?? '';

  const key = listKeyCategory(slug, page, source || undefined);
  const { items, meta, isLoading, status, error } = useListArticles(key);

  const category = categories.find((c) => c.slug === slug);

  useEffect(() => {
    void dispatch(
      fetchByCategory({ category: slug, source: source || undefined, page, limit: PAGE_SIZE }),
    );
  }, [dispatch, slug, source, page]);

  const retry = (): void => {
    void dispatch(
      fetchByCategory({ category: slug, source: source || undefined, page, limit: PAGE_SIZE }),
    );
  };

  const goToPage = (next: number): void => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(next));
    setSearchParams(params);
  };

  const changeSource = (next: string): void => {
    const params = new URLSearchParams(searchParams);
    if (next) {
      params.set('source', next);
    } else {
      params.delete('source');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <Container className="py-4">
      <title>{`Tin tức 24h — ${category?.name ?? 'Chuyên mục'}`}</title>

      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{category?.name ?? slug}</h1>
          <p className="text-secondary mb-0">
            {meta ? `${meta.total} bài viết` : 'Đang tải...'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 text-secondary" htmlFor="category-source">
            Nguồn
          </label>
          <select
            id="category-source"
            className="form-select form-select-sm w-auto"
            value={source}
            onChange={(event) => changeSource(event.target.value)}
          >
            <option value="">Tất cả nguồn</option>
            {sources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
          title="Chưa có bài viết"
          description="Chuyên mục này hiện chưa có bài viết nào. Hãy thử lại sau ít phút."
        />
      )}

      {items.length > 0 && (
        <Row className="g-3">
          {items.map((article) => (
            <Col xs={12} sm={6} lg={4} key={article.id}>
              <ArticleCard article={article} variant="standard" />
            </Col>
          ))}
        </Row>
      )}

      {totalPages > 1 && (
        <LoadMoreButton
          onClick={() => goToPage(page + 1)}
          loading={isLoading}
          label={`Xem trang ${page + 1} / ${totalPages}`}
        />
      )}
    </Container>
  );
}
