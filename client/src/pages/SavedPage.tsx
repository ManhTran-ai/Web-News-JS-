import { Col, Container, Row } from 'react-bootstrap';
import { ArticleCard } from '@/components/article/ArticleCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppSelector } from '@/store/hooks';

export function SavedPage() {
  const bookmarks = useAppSelector((state) => state.bookmarks.items);

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">Bài đã lưu</h1>

      {bookmarks.length === 0 ? (
        <EmptyState
          title="Chưa lưu bài nào"
          description="Tính năng nút lưu bài sẽ do Frontend Feature bổ sung ở giai đoạn tiếp theo."
        />
      ) : (
        <Row className="row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {bookmarks.map((article) => (
            <Col key={article.id}>
              <ArticleCard article={article} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
