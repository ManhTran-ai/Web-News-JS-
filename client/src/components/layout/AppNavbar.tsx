import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { CATEGORY_FALLBACK } from '@/lib/constants';
import { useArticleSuggestions } from '@/hooks/useArticleSuggestions';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LazyAuthModal } from '@/components/common/lazyAuthModal';
import { ChangePasswordModal } from '@/components/common/ChangePasswordModal';
import { logout, selectCurrentUser, selectIsAuthenticated } from '@/store/slices/authSlice';
import type { Category } from '@/types/article';

export function AppNavbar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.categories.items);
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [keyword, setKeyword] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const suggestions = useArticleSuggestions(keyword);

  const menu: Category[] = categories.length > 0 ? categories : [...CATEGORY_FALLBACK];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    void navigate(`/tim-kiem?q=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    if (!showSuggestions) return undefined;

    const handleClickOutside = (event: MouseEvent): void => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  return (
    <header className="app-navbar">
      <div className="app-navbar__bar">
        <div className="container">
          <div className="app-navbar__row">
            <Link className="app-navbar__brand" to="/">
              Tin tức 24h
            </Link>

            <div className="app-navbar__search" ref={searchRef}>
              <form role="search" onSubmit={handleSubmit}>
                <label className="visually-hidden" htmlFor="navbar-search">
                  Tìm kiếm tin tức
                </label>
                <input
                  id="navbar-search"
                  className="form-control form-control-sm"
                  type="search"
                  placeholder="Tìm kiếm tin..."
                  value={keyword}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-controls="navbar-suggestions"
                  aria-autocomplete="list"
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <ul
                  id="navbar-suggestions"
                  className="app-navbar__suggestions"
                  role="listbox"
                  aria-label="Gợi ý tìm kiếm"
                >
                  {suggestions.map((article) => (
                    <li key={article.id} role="option" aria-selected="false">
                      <Link
                        to={`/bai-viet/${article.id}`}
                        onClick={() => {
                          setShowSuggestions(false);
                          setKeyword('');
                        }}
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <span className="visually-hidden" role="status" aria-live="polite">
                {showSuggestions && suggestions.length > 0
                  ? `Có ${suggestions.length} gợi ý tìm kiếm.`
                  : ''}
              </span>
            </div>

            <div className="app-navbar__actions">
              <Link className="app-navbar__saved" to="/da-luu">
                <i className="bi bi-bookmark" aria-hidden="true" />
                <span>Đã lưu</span>
              </Link>

              {isAuthenticated && user ? (
                <div className="app-navbar__user">
                  <span className="app-navbar__user-name">{user.fullName}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Đổi mật khẩu
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => dispatch(logout())}
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-dark"
                  onClick={() => setShowAuthModal(true)}
                >
                  Đăng nhập
                </button>
              )}

              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <nav className="app-navbar__cats" aria-label="Chuyên mục">
        <div className="container">
          <ul className="app-navbar__cat-list">
            <li>
              <NavLink to="/" end className="app-navbar__cat">
                Mới nhất
              </NavLink>
            </li>
            <li>
              <NavLink to="/noi-bat" className="app-navbar__cat">
                Nổi bật
              </NavLink>
            </li>
            {menu.map((category) => (
              <li key={category.slug}>
                <NavLink to={`/chuyen-muc/${category.slug}`} className="app-navbar__cat">
                  {category.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <Suspense fallback={null}>
        <LazyAuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </Suspense>
      <ChangePasswordModal
        show={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </header>
  );
}
