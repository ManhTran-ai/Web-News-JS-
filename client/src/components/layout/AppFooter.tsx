import { Link } from 'react-router-dom';

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="app-footer__row">
          <div>
            <p className="app-footer__brand">Tin tức 24h</p>
            <p className="footer-note app-footer__note">
              Tin được tổng hợp từ RSS của các báo: VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí,
              VietnamNet. Nội dung và bản quyền thuộc về các báo gốc.
            </p>
            <p className="footer-note app-footer__note">
              Đồ án học tập, không dùng cho mục đích thương mại. Mỗi bài luôn ghi rõ nguồn và
              liên kết bài gốc.
            </p>
          </div>
          <nav className="app-footer__links" aria-label="Liên kết cuối trang">
            <Link to="/">Trang chủ</Link>
            <Link to="/chuyen-muc">Chuyên mục</Link>
            <Link to="/tim-kiem">Tìm kiếm</Link>
            <Link to="/da-luu">Đã lưu</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
