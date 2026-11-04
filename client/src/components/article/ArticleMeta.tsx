import { formatDateTime, isNew, timeAgo } from '@/lib/time';

interface ArticleMetaProps {
  source: string;
  publishedAt: string;
  category?: string;
  showNew?: boolean;
}

export function ArticleMeta({
  source,
  publishedAt,
  category,
  showNew = true,
}: ArticleMetaProps) {
  return (
    <p className="article-meta">
      <span className="article-meta__source">{source}</span>
      {category && (
        <>
          <span className="article-meta__sep" aria-hidden="true">
            ·
          </span>
          <span>{category}</span>
        </>
      )}
      <span className="article-meta__sep" aria-hidden="true">
        ·
      </span>
      <time dateTime={publishedAt} title={formatDateTime(publishedAt)}>
        {timeAgo(publishedAt)}
      </time>
      {showNew && isNew(publishedAt) && (
        <span className="article-meta__fresh">Mới</span>
      )}
    </p>
  );
}
