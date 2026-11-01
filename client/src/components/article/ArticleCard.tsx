import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { SafeImage } from './SafeImage';
import { ArticleMeta } from './ArticleMeta';
import type { Article } from '@/types/article';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="article-card h-100 border-0 shadow-sm">
      <SafeImage src={article.thumbnail} alt={article.title} />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="article-card__title lh-base mb-2">
          <Link
            to={`/bai-viet/${article.id}`}
            className="text-decoration-none text-body stretched-link"
          >
            {article.title}
          </Link>
        </Card.Title>
        {article.summary && (
          <Card.Text className="text-secondary small line-clamp-2 flex-grow-1">
            {article.summary}
          </Card.Text>
        )}
        <ArticleMeta source={article.source} publishedAt={article.publishedAt} />
      </Card.Body>
    </Card>
  );
}
