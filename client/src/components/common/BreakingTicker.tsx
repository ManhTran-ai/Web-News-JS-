import { Link } from 'react-router-dom';
import type { Article } from '@/types/article';

interface BreakingTickerProps {
  articles: Article[];
}

export function BreakingTicker({ articles }: BreakingTickerProps) {
  if (articles.length === 0) return null;

  const items = [...articles, ...articles];

  return (
    <div className="breaking-ticker" role="region" aria-label="Tin nóng">
      <span className="breaking-ticker__label">
        <i className="bi bi-broadcast" aria-hidden="true" />
        Tin nóng
      </span>
      <div className="breaking-ticker__viewport">
        <div className="breaking-ticker__track">
          {items.map((article, index) => (
            <Link
              key={`${article.id}-${index}`}
              className="breaking-ticker__item"
              to={`/bai-viet/${article.id}`}
              tabIndex={index >= articles.length ? -1 : 0}
              aria-hidden={index >= articles.length ? 'true' : undefined}
            >
              {article.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
