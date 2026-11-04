import { Link } from 'react-router-dom';
import { SafeImage } from './SafeImage';
import { ArticleMeta } from './ArticleMeta';
import type { Article } from '@/types/article';

export type ArticleCardVariant = 'lead' | 'standard' | 'compact' | 'row';

interface ArticleCardProps {
  article: Article;
  variant?: ArticleCardVariant;
  eager?: boolean;
  showCategory?: boolean;
}

export function ArticleCard({
  article,
  variant = 'standard',
  eager = false,
  showCategory = false,
}: ArticleCardProps) {
  const to = `/bai-viet/${article.id}`;

  if (variant === 'row') {
    return (
      <article className="article-card article-card--row">
        <Link to={to} tabIndex={-1} aria-hidden="true">
          <SafeImage
            src={article.thumbnail}
            alt=""
            placeholderLabel={article.source}
            eager={eager}
          />
        </Link>
        <div className="article-card__body">
          <h3 className="article-card__title line-clamp-2">
            <Link to={to}>{article.title}</Link>
          </h3>
          <ArticleMeta
            source={article.source}
            publishedAt={article.publishedAt}
            category={showCategory ? article.category : undefined}
          />
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="article-card article-card--compact">
        <div className="article-card__body">
          <h3 className="article-card__title line-clamp-2">
            <Link to={to}>{article.title}</Link>
          </h3>
          {article.summary && (
            <p className="article-card__summary line-clamp-2">{article.summary}</p>
          )}
          <ArticleMeta
            source={article.source}
            publishedAt={article.publishedAt}
            category={showCategory ? article.category : undefined}
          />
        </div>
      </article>
    );
  }

  const isLead = variant === 'lead';

  return (
    <article className={`article-card${isLead ? ' article-card--lead' : ''}`}>
      <Link to={to} tabIndex={-1} aria-hidden="true">
        <SafeImage
          src={article.thumbnail}
          alt=""
          placeholderLabel={article.source}
          eager={eager}
        />
      </Link>
      <div className="article-card__body">
        <h3 className={`article-card__title ${isLead ? 'line-clamp-3' : 'line-clamp-2'}`}>
          <Link to={to}>{article.title}</Link>
        </h3>
        {article.summary && (
          <p className={`article-card__summary ${isLead ? 'line-clamp-3' : 'line-clamp-2'}`}>
            {article.summary}
          </p>
        )}
        <ArticleMeta
          source={article.source}
          publishedAt={article.publishedAt}
          category={showCategory ? article.category : undefined}
        />
      </div>
    </article>
  );
}
