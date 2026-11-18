import { useEffect } from 'react';

type ToastVariant = 'info' | 'error' | 'success';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  /** Nhãn của nút hành động, ví dụ "Hoàn tác". */
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  /** Thời gian tự đóng (ms). Bỏ trống thì toast không tự đóng. */
  autoHideMs?: number;
}

export function Toast({
  message,
  variant = 'info',
  actionLabel,
  onAction,
  onClose,
  autoHideMs,
}: ToastProps) {
  useEffect(() => {
    if (!autoHideMs || !onClose) return;

    const timer = window.setTimeout(onClose, autoHideMs);
    return () => window.clearTimeout(timer);
  }, [autoHideMs, onClose]);

  return (
    <div
      className={`n24-toast n24-toast--${variant}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <p className="n24-toast__message">{message}</p>

      <div className="n24-toast__actions">
        {actionLabel && onAction && (
          <button type="button" className="btn btn-sm btn-dark" onClick={onAction}>
            {actionLabel}
          </button>
        )}

        {onClose && (
          <button
            type="button"
            className="btn btn-sm btn-link n24-toast__close"
            aria-label="Đóng thông báo"
            onClick={onClose}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
