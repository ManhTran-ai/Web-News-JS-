import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface ArticleBodyProps {
  contentHtml: string;
}

export function ArticleBody({ contentHtml }: ArticleBodyProps) {
  const safeHtml = useMemo(() => DOMPurify.sanitize(contentHtml), [contentHtml]);

  return (
    <div
      className="article-body"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
