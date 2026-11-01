import { Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { CATEGORY_FALLBACK } from '@/lib/constants';
import type { Category } from '@/types/article';

export function CategoryIndexPage() {
  const categories = useAppSelector((state) => state.categories.items);
  const menu: Category[] = categories.length > 0 ? categories : [...CATEGORY_FALLBACK];

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">Tất cả chuyên mục</h1>
      <Row className="row-cols-2 row-cols-md-3 g-3">
        {menu.map((category) => (
          <Col key={category.slug}>
            <Card className="text-decoration-none h-100 border-0 shadow-sm">
              <Card.Body>
                <Card.Title className="h6 mb-1">
                  <Link
                    to={`/chuyen-muc/${category.slug}`}
                    className="text-decoration-none stretched-link text-body"
                  >
                    {category.name}
                  </Link>
                </Card.Title>
                <Card.Text className="small text-secondary mb-0">
                  {category.count} bài viết
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
