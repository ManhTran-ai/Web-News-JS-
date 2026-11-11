import { useEffect, useRef } from 'react';

export interface PollingOptions {
  /** Hệ số nhân thời gian chờ sau mỗi lần lỗi. Mặc định 2. */
  backoffFactor?: number;
  /** Thời gian chờ tối đa (ms) khi liên tục lỗi. Mặc định gấp 5 lần `intervalMs`. */
  maxDelayMs?: number;
}

/**
 * Tự làm mới dữ liệu theo chu kỳ.
 *
 * - Có backoff: mỗi lần lỗi thì thời gian chờ nhân lên `backoffFactor` (giới hạn bởi `maxDelayMs`),
 *   thành công thì trở về `intervalMs`.
 * - Dừng khi tab bị ẩn (`visibilitychange`) để không poll quá nhiều khi người dùng đổi tab.
 * - Khi tab hiện lại hoặc cửa sổ được focus thì reset thời gian chờ về `intervalMs`.
 *
 * `callback` trả về `false` (hoặc ném lỗi) để báo "lần này thất bại" — khi đó hook sẽ
 * áp dụng backoff cho lần chờ kế tiếp.
 */
export function usePolling(
  callback: () => void | boolean | Promise<void | boolean>,
  intervalMs: number,
  options: PollingOptions = {},
): void {
  const { backoffFactor = 2, maxDelayMs = intervalMs * 5 } = options;

  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let currentDelay = intervalMs;
    let paused = false;
    let disposed = false;

    const clear = (): void => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    const schedule = (): void => {
      if (disposed || paused) return;
      clear();
      timer = setTimeout(() => {
        void run();
      }, currentDelay);
    };

    const run = async (): Promise<void> => {
      if (disposed || paused) return;

      let failed = false;
      try {
        const result = await saved.current();
        failed = result === false;
      } catch {
        failed = true;
      }

      if (disposed || paused) return;

      currentDelay = failed ? Math.min(currentDelay * backoffFactor, maxDelayMs) : intervalMs;

      schedule();
    };

    const handleVisibility = (): void => {
      if (document.hidden) {
        paused = true;
        clear();
        return;
      }

      // Tab hiện lại → bỏ backoff và poll ngay.
      paused = false;
      currentDelay = intervalMs;
      void run();
    };

    const handleFocus = (): void => {
      if (disposed || paused) return;
      // Bỏ backoff và tính lại thời gian chờ từ đầu.
      currentDelay = intervalMs;
      schedule();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    schedule();

    return () => {
      disposed = true;
      clear();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [backoffFactor, intervalMs, maxDelayMs]);
}
