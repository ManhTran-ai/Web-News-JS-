import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Container className="py-5 text-center">
      <title>Tin tức 24h — Không tìm thấy trang</title>

      <p className="article-meta justify-content-center mb-2">Lỗi 404</p>
      <h1 className="display-5 mb-3">Không tìm thấy trang bạn yêu cầu</h1>
      <p className="article-card__summary mb-4">
        Bài viết có thể đã hết hạn lưu giữ hoặc đường dẫn bị sai. Hãy thử tìm kiếm hoặc quay lại
        trang chủ.
      </p>

      <div className="d-flex flex-wrap justify-content-center gap-2">
        <Link className="btn btn-primary" to="/">
          Về trang chủ
        </Link>
        <Link className="btn btn-outline-dark" to="/chuyen-muc">
          Xem chuyên mục
        </Link>
        <Link className="btn btn-outline-dark" to="/tim-kiem">
          Tìm kiếm tin
        </Link>
      </div>
    </Container>
  );
}
