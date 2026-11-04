interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

export function LoadMoreButton({
  onClick,
  loading = false,
  label = 'Xem thêm',
}: LoadMoreButtonProps) {
  return (
    <div className="d-flex justify-content-center py-4">
      <button
        type="button"
        className="btn btn-outline-dark"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? 'Đang tải...' : label}
      </button>
    </div>
  );
}
