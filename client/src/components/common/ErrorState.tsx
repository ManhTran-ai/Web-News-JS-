import { Alert, Button } from 'react-bootstrap';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Đã có lỗi xảy ra khi tải dữ liệu.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Alert variant="danger" className="d-flex flex-column align-items-start gap-2">
      <div>
        <i className="bi bi-exclamation-triangle me-2" />
        {message}
      </div>
      {onRetry && (
        <Button variant="outline-danger" size="sm" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1" />
          Thử lại
        </Button>
      )}
    </Alert>
  );
}
