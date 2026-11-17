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

/** Ghi dữ liệu xuống `localStorage`. Trả về `false` nếu không ghi được (bị chặn/quá bộ nhớ). */
export function writeStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // localStorage có thể bị chặn, bỏ qua lỗi để app vẫn chạy
    return false;
  }
}
