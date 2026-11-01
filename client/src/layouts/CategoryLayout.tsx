import { Col, Container, Nav, Row } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { CATEGORY_FALLBACK } from '@/lib/constants';
import type { Category } from '@/types/article';

export function CategoryLayout() {
  const categories = useAppSelector((state) => state.categories.items);
  const menu: Category[] = categories.length > 0 ? categories : [...CATEGORY_FALLBACK];

  return (
    <Container className="py-4">
      <Row>
        <Col lg={3} className="mb-4">
          <nav className="category-nav" aria-label="Danh sách chuyên mục">
            <h2 className="h6 text-uppercase text-secondary mb-3">Chuyên mục</h2>
            <Nav className="flex-column">
              {menu.map((category) => (
                <Nav.Link
                  key={category.slug}
                  as={NavLink}
                  to={`/chuyen-muc/${category.slug}`}
                  className="px-0 py-1 border-bottom"
                >
                  {category.name}
                </Nav.Link>
              ))}
            </Nav>
          </nav>
        </Col>
        <Col lg={9}>
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
}
