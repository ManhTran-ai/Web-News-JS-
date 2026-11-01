import { Navbar as BootstrapNavbar, Container, Nav, Form } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { CATEGORY_FALLBACK } from '@/lib/constants';
import type { Category } from '@/types/article';

export function AppNavbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const categories = useAppSelector((state) => state.categories.items);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (categories.length === 0) {
      void dispatch(fetchCategories());
    }
  }, [categories.length, dispatch]);

  const menu: Category[] = categories.length > 0 ? categories : [...CATEGORY_FALLBACK];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    void navigate(`/tim-kiem?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold">
          <i className="bi bi-newspaper me-2" />
          Tin tức 24h
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="main-navbar" />
        <BootstrapNavbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            {menu.slice(0, 8).map((category) => (
              <Nav.Link
                key={category.slug}
                as={NavLink}
                to={`/chuyen-muc/${category.slug}`}
                className="px-2"
              >
                {category.name}
              </Nav.Link>
            ))}
          </Nav>
          <Form onSubmit={handleSubmit} className="d-flex" role="search">
            <Form.Control
              type="search"
              placeholder="Tìm kiếm tin..."
              aria-label="Tìm kiếm tin tức"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="me-2"
            />
            <button type="submit" className="btn btn-outline-light">
              <i className="bi bi-search" />
            </button>
          </Form>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
