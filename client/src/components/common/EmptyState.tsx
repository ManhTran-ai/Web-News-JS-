interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'Chưa có tin nào',
  description = 'Hiện chưa có bài viết nào để hiển thị trong mục này.',
}: EmptyStateProps) {
  return (
    <div className="n24-surface">
      <h3 className="article-card__title mb-2">{title}</h3>
      <p className="article-card__summary mb-0">{description}</p>
    </div>
  );
}
