import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { CATEGORY_FALLBACK } from '@/lib/constants';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import type { Category } from '@/types/article';

export function AppNavbar() {
  const navigate = useNavigate();
  const categories = useAppSelector((state) => state.categories.items);
  const [keyword, setKeyword] = useState('');

  const menu: Category[] = categories.length > 0 ? categories : [...CATEGORY_FALLBACK];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    void navigate(`/tim-kiem?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="app-navbar">
      <div className="app-navbar__bar">
        <div className="container">
          <div className="app-navbar__row">
            <Link className="app-navbar__brand" to="/">
              Tin tức 24h
            </Link>

            <form className="app-navbar__search" role="search" onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="navbar-search">
                Tìm kiếm tin tức
              </label>
              <input
                id="navbar-search"
                className="form-control form-control-sm"
                type="search"
                placeholder="Tìm kiếm tin..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </form>

            <div className="app-navbar__actions">
              <Link className="app-navbar__saved" to="/da-luu">
                <i className="bi bi-bookmark" aria-hidden="true" />
                <span>Đã lưu</span>
              </Link>
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
    </header>
  );
}
