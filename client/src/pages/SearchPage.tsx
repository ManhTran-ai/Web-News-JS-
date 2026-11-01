import { Container } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';

/**
 * TODO(Frontend Feature): hoàn thiện ô tìm kiếm có debounce 400ms đồng bộ với
 * `?q=` trên URL, bộ lọc theo nguồn báo, phân trang "Xem thêm", highlight từ khoá
 * trong tiêu đề, trạng thái rỗng thân thiện.
 */
export function SearchPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') ?? '';

  return (
    <Container className="py-4">
      <title>Tin tức 24h — Tìm kiếm</title>
      <h1 className="h3 mb-4">Kết quả tìm kiếm</h1>
      {keyword && <p className="text-secondary mb-4">Từ khoá: {keyword}</p>}
      <p className="text-secondary">
        TODO(Frontend Feature): giao diện tìm kiếm sẽ được xây dựng ở tuần 3.
      </p>
    </Container>
  );
}
