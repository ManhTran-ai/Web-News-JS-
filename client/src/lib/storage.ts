export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Ghi dữ liệu xuống `localStorage`.
 * Trả về `false` nếu ghi không thành công (bị chặn hoặc hết bộ nhớ).
 */
export function writeStorage<T>(key: string, value: T): boolean {
  // Không có `window` (SSR / test) thì không có gì để ghi và cũng không phải lỗi.
  if (typeof window === 'undefined') return true;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // localStorage có thể bị chặn, báo lỗi để tầng UI hiển thị thông báo
    return false;
  }
}
