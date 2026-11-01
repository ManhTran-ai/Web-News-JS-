import { Container } from 'react-bootstrap';

export function AppFooter() {
  return (
    <footer className="bg-dark text-white py-4 mt-5">
      <Container>
        <p className="mb-2 fw-bold">
          <i className="bi bi-newspaper me-2" />
          Tin tức 24h
        </p>
        <p className="footer-note mb-2 text-white-50">
          Tin được tổng hợp từ RSS của các báo: VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí,
          VietnamNet. Nội dung và bản quyền thuộc về các báo gốc.
        </p>
        <p className="footer-note mb-0 text-white-50">
          Đồ án học tập — không sử dụng cho mục đích thương mại. Mỗi bài luôn ghi rõ nguồn và
          liên kết bài gốc.
        </p>
      </Container>
    </footer>
  );
}
