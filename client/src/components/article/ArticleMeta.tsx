import { Badge } from 'react-bootstrap';
import { formatDateTime, isNew, timeAgo } from '@/lib/time';

interface ArticleMetaProps {
  source: string;
  publishedAt: string;
  showNew?: boolean;
}

export function ArticleMeta({ source, publishedAt, showNew = true }: ArticleMetaProps) {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 small text-secondary">
      <span className="fw-semibold text-body">{source}</span>
      <span aria-hidden="true">•</span>
      <time dateTime={publishedAt} title={formatDateTime(publishedAt)}>
        {timeAgo(publishedAt)}
      </time>
      {showNew && isNew(publishedAt) && (
        <Badge bg="danger" className="text-uppercase">
          Mới
        </Badge>
      )}
    </div>
  );
}
