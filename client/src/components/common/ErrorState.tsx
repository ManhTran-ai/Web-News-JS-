interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Không tải được dữ liệu. Vui lòng thử lại sau.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="n24-surface" role="alert">
      <p className="article-card__summary mb-3">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline-dark btn-sm" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
