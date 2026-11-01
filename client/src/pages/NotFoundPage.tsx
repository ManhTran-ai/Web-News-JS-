import { Container } from 'react-bootstrap';

/**
 * TODO(Frontend Core): trang 404 — gợi ý người dùng quay lại trang chủ.
 */
export function NotFoundPage() {
  return (
    <Container className="py-5 text-center">
      <title>Tin tức 24h — Không tìm thấy trang</title>
      <h1 className="display-5 mb-3">404</h1>
      <p className="text-secondary mb-4">Không tìm thấy trang bạn yêu cầu.</p>
      <a href="/" className="btn btn-primary">
        Về trang chủ
      </a>
    </Container>
  );
}
