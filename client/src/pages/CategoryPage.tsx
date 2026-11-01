import { Container } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

/**
 * TODO(Frontend Core): trang danh sách bài theo chuyên mục — đọc `slug` từ
 * `useParams`, dispatch `fetchByCategory`, hiển thị lưới bài. Phân trang sẽ làm ở
 * tuần 3.
 */
export function CategoryPage() {
  const { slug = '' } = useParams();

  return (
    <Container className="py-4">
      <title>Tin tức 24h — {slug}</title>
      <h1 className="h3 mb-4 text-capitalize">{slug.replace(/-/g, ' ')}</h1>
      <p className="text-secondary">
        TODO(Frontend Core): danh sách bài của chuyên mục sẽ được xây dựng ở tuần 2.
      </p>
    </Container>
  );
}
