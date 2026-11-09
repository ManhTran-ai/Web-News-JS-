import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectSources } from '@/store/slices/sourcesSlice';
import { CATEGORY_FALLBACK } from '@/lib/constants';

export function AppFooter() {
  const categories = useAppSelector((state) => state.categories.items);
  const sources = useAppSelector(selectSources);

  const menu = categories.length > 0 ? categories : [...CATEGORY_FALLBACK];

  return (
    <footer className="app-footer">
      <div className="container">
        <div className="app-footer__row">
          <div className="app-footer__col app-footer__col--brand">
            <p className="app-footer__brand">Tin tức 24h</p>
            <p className="footer-note app-footer__note">
              Tin được tổng hợp từ RSS của các báo: VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí,
              VietnamNet. Nội dung và bản quyền thuộc về các báo gốc.
            </p>
            <p className="footer-note app-footer__note">
              Đồ án học tập, không dùng cho mục đích thương mại. Mỗi bài luôn ghi rõ nguồn và
              liên kết bài gốc.
            </p>
            <p className="app-footer__copyright">© 2026 Tin tức 24h — Đồ án học tập.</p>
          </div>

          <nav className="app-footer__col" aria-label="Chuyên mục">
            <h2 className="app-footer__title">Chuyên mục</h2>
            <ul className="app-footer__list">
              {menu.map((category) => (
                <li key={category.slug}>
                  <Link to={`/chuyen-muc/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="app-footer__col" aria-label="Báo nguồn">
            <h2 className="app-footer__title">Báo nguồn</h2>
            <ul className="app-footer__list">
              {sources.map((source) => (
                <li key={source.id}>
                  <a href={source.homepage} target="_blank" rel="noopener noreferrer">
                    {source.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="app-footer__col">
            <h2 className="app-footer__title">Tin tức 24h</h2>
            <ul className="app-footer__list">
              <li>
                <Link to="/">Trang chủ</Link>
              </li>
              <li>
                <Link to="/chuyen-muc">Tất cả chuyên mục</Link>
              </li>
              <li>
                <Link to="/tim-kiem">Tìm kiếm</Link>
              </li>
              <li>
                <Link to="/da-luu">Bài đã lưu</Link>
              </li>
            </ul>
            <button
              type="button"
              className="app-footer__top btn btn-sm btn-outline-dark"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <i className="bi bi-arrow-up" aria-hidden="true" />
              <span className="ms-1">Lên đầu trang</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}