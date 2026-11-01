import { useCallback, useEffect } from 'react';
import { Alert, Col, Container, Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { ArticleBody } from '@/components/article/ArticleBody';
import { ArticleMeta } from '@/components/article/ArticleMeta';
import { SafeImage } from '@/components/article/SafeImage';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchArticleById, selectArticleById } from '@/store/slices/articlesSlice';
import { fetchArticleContent, selectContentEntry } from '@/store/slices/articleContentSlice';
import { formatFullDate } from '@/lib/time';

export function ArticleDetailPage() {
  const { id = '' } = useParams();
  const dispatch = useAppDispatch();
  const article = useAppSelector((state) => selectArticleById(state, id));
  const contentEntry = useAppSelector((state) => selectContentEntry(state, id));

  const load = useCallback(() => {
    void dispatch(fetchArticleById(id));
    void dispatch(fetchArticleContent(id));
  }, [dispatch, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!article) {
    return (
      <Container className="py-5">
        {contentEntry?.status === 'failed' ? (
          <ErrorState
            message={contentEntry.error ?? 'Không tìm thấy bài viết.'}
            onRetry={load}
          />
        ) : (
          <Loading label="Đang tải bài viết..." />
        )}
      </Container>
    );
  }

  const content = contentEntry?.data;

  return (
    <Container className="py-4">
      <article>
        <Row className="justify-content-center">
          <Col lg={8}>
            <h1 className="h2 fw-bold mb-3">{article.title}</h1>

            <div className="mb-3">
              <ArticleMeta source={article.source} publishedAt={article.publishedAt} />
            </div>

            <SafeImage
              src={content?.leadImage ?? article.thumbnail}
              alt={article.title}
              ratioClass="ratio ratio-16x9 mb-4"
            />

            {contentEntry?.status === 'loading' && !content && (
              <Loading label="Đang tải nội dung bài viết..." />
            )}

            {contentEntry?.status === 'failed' && (
              <Alert variant="warning">
                <p className="mb-2">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {contentEntry.error ?? 'Không tải được toàn bộ nội dung bài viết.'}
                </p>
                <p className="mb-0 small">
                  Dưới đây là tóm tắt từ RSS. Bạn có thể đọc đầy đủ tại báo gốc.
                </p>
              </Alert>
            )}

            {content ? (
              <ArticleBody contentHtml={content.contentHtml} />
            ) : (
              article.summary && <p className="lead">{article.summary}</p>
            )}

            <hr className="my-4" />

            <p className="text-secondary small mb-0">
              Nguồn: <strong>{article.source}</strong> · {formatFullDate(article.publishedAt)} ·{' '}
              <a href={article.link} target="_blank" rel="noopener noreferrer">
                Đọc bài gốc tại {article.source}
                <i className="bi bi-box-arrow-up-right ms-1" />
              </a>
            </p>

            <p className="mt-3">
              <Link to="/" className="text-decoration-none">
                <i className="bi bi-arrow-left me-1" />
                Về trang chủ
              </Link>
            </p>
          </Col>
        </Row>
      </article>
    </Container>
  );
}
