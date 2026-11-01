interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'Chưa có tin nào',
  description = 'Hiện chưa có bài viết nào để hiển thị trong mục này.',
}: EmptyStateProps) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary">
      <i className="bi bi-inbox fs-1 mb-3" />
      <h2 className="h5">{title}</h2>
      <p className="mb-0">{description}</p>
    </div>
  );
}
