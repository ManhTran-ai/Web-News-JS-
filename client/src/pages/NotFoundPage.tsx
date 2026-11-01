import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Container className="py-5 text-center">
      <p className="display-4 fw-bold text-danger mb-2">404</p>
      <h1 className="h4 mb-3">Không tìm thấy trang bạn yêu cầu</h1>
      <p className="text-secondary mb-4">
        Đường dẫn có thể đã thay đổi hoặc bài viết đã hết thời hạn lưu giữ.
      </p>
      <Link to="/" className="btn btn-danger">
        <i className="bi bi-house me-1" />
        Về trang chủ
      </Link>
    </Container>
  );
}
