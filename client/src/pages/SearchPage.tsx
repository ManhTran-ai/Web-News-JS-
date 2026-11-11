import { useEffect, useMemo, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  abortAllRequests,
  listKeyQuery,
  queryArticles,
  selectActiveQuery,
  selectHighRelevanceIds,
} from '@/store/slices/articlesSlice';
import { selectCategories } from '@/store/slices/categoriesSlice';
import { selectSources } from '@/store/slices/sourcesSlice';
import { useListArticles } from '@/hooks/useListArticles';
import { ArticleCard } from '@/components/article/ArticleCard';
import { ArticleSkeleton } from '@/components/article/ArticleSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { PAGE_SIZE } from '@/lib/constants';

export function SearchPage() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const categories = useAppSelector(selectCategories);
  const sources = useAppSelector(selectSources);

  const urlQuery = searchParams.get('q') ?? '';
  const [keyword, setKeyword] = useState(urlQuery);

  const category = searchParams.get('category') ?? '';
  const source = searchParams.get('source') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  // Từ khoá đã "chốt" — slice chỉ cập nhật sau khi hết debounce nên
  // danh sách đang xem không nhảy loạn mỗi ký tự gõ.
  // Lúc mới vào trang, từ khoá lấy từ URL (deep-link) cho tới khi slice chốt.
  const activeQuery = useAppSelector(selectActiveQuery) ?? urlQuery;

  const query = useMemo(
    () => ({
      q: keyword.trim(),
      category: category || undefined,
      source: source || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [keyword, category, source, page],
  );

  // Key của danh sách đang hiển thị — dùng từ khoá đã chốt để không nhảy layout.
  const key = listKeyQuery({ ...query, q: activeQuery });
  const { items, meta, isLoading, status, error } = useListArticles(key);
  const highRelevanceIds = useAppSelector((state) => selectHighRelevanceIds(state, key));

  // Gõ từ khoá → dispatch ngay. Slice tự debounce và huỷ request cũ.
  useEffect(() => {
    if (!query.q) return;
    void dispatch(queryArticles(query));
  }, [dispatch, query]);

  // Đồng bộ từ khoá đã chốt vào URL để link có thể chia sẻ lại kết quả tìm kiếm.
  useEffect(() => {
    if (!activeQuery) return;
    if (activeQuery === urlQuery) return;

    const params = new URLSearchParams(searchParams);
    params.set('q', activeQuery);
    params.delete('page');
    setSearchParams(params, { replace: true });
  }, [activeQuery, urlQuery, searchParams, setSearchParams]);

  // Rời trang thì huỷ request tìm kiếm đang chạy — không cần thiết khi đã điều hướng.
  useEffect(() => () => abortAllRequests(), []);

  const retry = (): void => {
    void dispatch(queryArticles(query));
  };

  const updateFilter = (name: 'category' | 'source', value: string): void => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.delete('page');
    setSearchParams(params);
  };

  const goToPage = (next: number): void => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(next));
    setSearchParams(params);
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <Container className="py-4">
      <title>Tin tức 24h — Tìm kiếm</title>

      <h1 className="h3 mb-1">Tìm kiếm</h1>
      <p className="text-secondary mb-4">
        {meta ? `Tìm thấy ${meta.total} bài viết` : 'Nhập từ khoá để tìm kiếm'}
      </p>

      <div className="row g-2 mb-4">
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="search-keyword">
            Từ khoá
          </label>
          <input
            id="search-keyword"
            className="form-control"
            type="search"
            placeholder="Ví dụ: bóng đá, chứng khoán..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label" htmlFor="search-category">
            Chuyên mục
          </label>
          <select
            id="search-category"
            className="form-select"
            value={category}
            onChange={(event) => updateFilter('category', event.target.value)}
          >
            <option value="">Tất cả chuyên mục</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label" htmlFor="search-source">
            Nguồn
          </label>
          <select
            id="search-source"
            className="form-select"
            value={source}
            onChange={(event) => updateFilter('source', event.target.value)}
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

      {!query.q && (
        <EmptyState
          title="Chưa nhập từ khoá"
          description="Nhập từ khoá ở ô trên để tìm kiếm tin tức trong toàn bộ kho dữ liệu."
        />
      )}

      {query.q && isLoading && items.length === 0 && (
        <Row className="g-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Col xs={12} sm={6} lg={4} key={index}>
              <ArticleSkeleton variant="standard" />
            </Col>
          ))}
        </Row>
      )}

      {query.q && status === 'failed' && (
        <ErrorState message={error ?? undefined} onRetry={retry} />
      )}

      {query.q && status === 'succeeded' && items.length === 0 && (
        <EmptyState
          title="Không tìm thấy kết quả"
          description="Thử đổi từ khoá hoặc bỏ bớt bộ lọc chuyên mục / nguồn tin."
        />
      )}

      {items.length > 0 && (
        <Row className="g-3">
          {items.map((article) => (
            <Col xs={12} sm={6} lg={4} key={article.id}>
              <div className="position-relative">
                {highRelevanceIds.includes(article.id) && (
                  <span className="badge text-bg-warning position-absolute top-0 start-0 m-2">
                    Liên quan cao
                  </span>
                )}
                <ArticleCard article={article} variant="standard" />
              </div>
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
