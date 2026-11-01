import { Spinner } from 'react-bootstrap';

interface LoadingProps {
  label?: string;
}

export function Loading({ label = 'Đang tải dữ liệu...' }: LoadingProps) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary">
      <Spinner animation="border" variant="danger" role="status" />
      <p className="mt-3 mb-0">{label}</p>
    </div>
  );
}
