interface LoadingProps {
  label?: string;
}

export function Loading({ label = 'Đang tải dữ liệu...' }: LoadingProps) {
  return (
    <div className="d-flex align-items-center gap-2 py-4" role="status" aria-live="polite">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span className="article-meta">{label}</span>
    </div>
  );
}
