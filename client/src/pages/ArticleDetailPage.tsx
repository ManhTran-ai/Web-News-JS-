import { useEffect, useMemo } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchArticleById, selectArticleById } from '@/store/slices/articlesSlice';
import { fetchArticleContent, selectContentEntry } from '@/store/slices/articleContentSlice';
import { fetchRelatedArticles, selectRelatedEntry } from '@/store/slices/relatedArticlesSlice';
import { recordRead } from '@/store/slices/interactionSlice';
import { ArticleBody } from '@/components/article/ArticleBody';
import { ArticleMeta } from '@/components/article/ArticleMeta';
import { ArticleCard } from '@/components/article/ArticleCard';
import { CommentSection } from '@/components/article/CommentSection';
import { ReaderToolbar } from '@/components/article/ReaderToolbar';
import { SafeImage } from '@/components/article/SafeImage';
import { ArticleSkeleton } from '@/components/article/ArticleSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { extractTextFromHtml } from '@/lib/html';
import { formatDateTime } from '@/lib/time';
import { RELATED_ARTICLES_COUNT } from '@/lib/constants';

export function ArticleDetailPage() {
  const { id = '' } = useParams();
  const dispatch = useAppDispatch();

  const article = useAppSelector((state) => selectArticleById(state, id));
  const contentEntry = useAppSelector((state) => selectContentEntry(state, id));
  const relatedEntry = useAppSelector((state) => selectRelatedEntry(state, id));

  useEffect(() => {
    if (!id) return;
    void dispatch(fetchArticleById(id));
    void dispatch(fetchArticleContent(id));
    void dispatch(fetchRelatedArticles({ articleId: id, limit: RELATED_ARTICLES_COUNT }));
  }, [dispatch, id]);

  // Ghi vào lịch sử đọc ngay khi mở bài.
  useEffect(() => {
    if (article) {
      dispatch(recordRead(article));
    }
  }, [dispatch, article]);

  const contentUnavailable = contentEntry?.code === 'CONTENT_UNAVAILABLE';

  const retry = (): void => {
    void dispatch(fetchArticleContent(id));
  };

  const contentText = useMemo(
    () => (contentEntry?.data ? extractTextFromHtml(contentEntry.data.contentHtml) : ''),
    [contentEntry],
  );

  const meta = article ? (
    <div className="article-detail__meta">
      <ArticleMeta
        source={article.source}
        publishedAt={article.publishedAt}
        category={article.category}
      />
      {contentEntry?.data?.author && (
        <p className="article-card__summary mb-0">Tác giả: {contentEntry.data.author}</p>
      )}
    </div>
  ) : null;

  if (!article && contentEntry?.status !== 'failed') {
    return (
      <Container className="py-4">
        <title>Tin tức 24h — Chi tiết bài</title>
        <ArticleSkeleton variant="lead" />
      </Container>
    );
  }

  return (
    <Container className="py-4 article-detail">
      <title>{article ? `${article.title} — Tin tức 24h` : 'Tin tức 24h — Chi tiết bài'}</title>

      {article ? (
        <>
          <h1 className="article-detail__title">{article.title}</h1>
          {meta}

          {article.thumbnail && (
            <SafeImage
              src={article.thumbnail}
              alt={article.title}
              className="article-detail__image"
              eager
            />
          )}

          <ReaderToolbar article={article} contentText={contentText} />

          {contentUnavailable && (
            <div className="n24-tint article-detail__notice" role="alert">
              <p className="mb-2">
                <strong>Chưa tải được toàn bộ nội dung bài viết.</strong> Nguồn báo hiện không
                cho phép truy cập nội dung đầy đủ, bạn có thể đọc tóm tắt bên dưới hoặc mở bài
                gốc.
              </p>
              {article.summary && <p className="article-card__summary mb-0">{article.summary}</p>}
            </div>
          )}

          {contentEntry?.status === 'loading' && !contentUnavailable && (
            <ArticleSkeleton variant="standard" />
          )}

          {contentEntry?.status === 'failed' && !contentUnavailable && (
            <ErrorState
              message={contentEntry.error ?? undefined}
              onRetry={retry}
            />
          )}

          {contentEntry?.data && !contentUnavailable && (
            <ArticleBody contentHtml={contentEntry.data.contentHtml} />
          )}

          <footer className="article-detail__footer">
            <p className="article-card__summary mb-2">
              Nguồn: {article.source} · {formatDateTime(article.publishedAt)}
            </p>
            <a
              className="btn btn-outline-dark btn-sm"
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở bài gốc
            </a>
          </footer>

          {relatedEntry && relatedEntry.items.length > 0 && (
            <section className="article-detail__related n24-section">
              <SectionHeader title="Bài liên quan" />
              <Row className="g-3">
                {relatedEntry.items.map((item) => (
                  <Col xs={12} sm={6} lg={4} key={item.id}>
                    <ArticleCard article={item} variant="standard" />
                  </Col>
                ))}
              </Row>
            </section>
          )}

          <CommentSection articleId={id} />
        </>
      ) : (
        <ErrorState
          message={contentEntry?.error ?? 'Không tìm thấy bài viết.'}
          onRetry={retry}
        />
      )}
    </Container>
  );
}
