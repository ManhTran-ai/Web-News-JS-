import { Container } from 'react-bootstrap';

/**
 * TODO(Frontend Core): dựng trang chủ theo bố cục báo điện tử — carousel tin nổi bật
 * (dispatch `fetchFeatured`), cột "Tin mới nhất" (dispatch `fetchLatest`), các khối
 * theo chuyên mục lấy từ store Redux. Cần skeleton, trạng thái lỗi và rỗng,
 * responsive ở 375 / 768 / 1200.
 */
export function HomePage() {
  return (
    <Container className="py-4">
      <title>Tin tức 24h — Trang chủ</title>
      <h1 className="h3 mb-4">Trang chủ</h1>
      <p className="text-secondary">
        TODO(Frontend Core): nội dung trang chủ sẽ được xây dựng ở tuần 2.
      </p>
    </Container>
  );
}
