// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { usePolling } from './usePolling';
import { renderHook, renderWithProviders } from '@/test-utils/render';

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gọi callback sau mỗi chu kỳ', async () => {
    const callback = vi.fn();
    const { unmount } = await renderHook(() => usePolling(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    await unmount();
  });

  it('dừng gọi callback sau khi unmount', async () => {
    const callback = vi.fn();
    const { unmount } = await renderHook(() => usePolling(callback, 1000));

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    await unmount();
    await vi.advanceTimersByTimeAsync(5000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('tăng thời gian chờ khi callback báo lỗi (backoff)', async () => {
    const callback = vi.fn().mockResolvedValue(false);
    const { unmount } = await renderHook(() => usePolling(callback, 1000, { backoffFactor: 2 }));

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Lần thứ hai chỉ chạy sau 2000ms (1000 * 2).
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    await unmount();
  });

  it('giới hạn thời gian chờ tối đa', async () => {
    const callback = vi.fn().mockResolvedValue(false);
    const { unmount } = await renderHook(() =>
      usePolling(callback, 1000, { backoffFactor: 10, maxDelayMs: 4000 }),
    );

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Lần 2 chờ 4000ms (bị chặn bởi maxDelayMs).
    await vi.advanceTimersByTimeAsync(3000);
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    await unmount();
  });

  it('reset về chu kỳ gốc sau khi callback thành công', async () => {
    const callback = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const { unmount } = await renderHook(() => usePolling(callback, 1000, { backoffFactor: 2 }));

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Backoff → lần 2 chờ 2000ms.
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(2);

    // Thành công → lần 3 trở lại chờ 1000ms.
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(3);

    await unmount();
  });

  it('coi callback ném lỗi là thất bại và áp dụng backoff', async () => {
    const callback = vi.fn().mockRejectedValue(new Error('Lỗi mạng'));
    const { unmount } = await renderHook(() => usePolling(callback, 1000, { backoffFactor: 2 }));

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    await unmount();
  });

  it('dừng polling khi tab bị ẩn', async () => {
    const callback = vi.fn();
    const { unmount } = await renderHook(() => usePolling(callback, 1000));

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it('poll ngay lại khi tab hiện trở lại và bỏ backoff', async () => {
    const callback = vi.fn();
    const { unmount } = await renderHook(() => usePolling(callback, 1000));

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));

    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(callback).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it('reset thời gian chờ khi cửa sổ được focus', async () => {
    const callback = vi.fn().mockResolvedValue(false);
    const { unmount } = await renderHook(() => usePolling(callback, 1000, { backoffFactor: 4 }));

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('focus'));

    // Backoff bị reset nên lần 2 chạy đúng sau 1000ms.
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    await unmount();
  });

  it('dùng callback mới nhất khi prop thay đổi', async () => {
    const first = vi.fn();
    const second = vi.fn();

    function Poller({ callback }: { callback: () => void }): null {
      usePolling(callback, 1000);
      return null;
    }

    const { rerender, unmount } = await renderWithProviders(
      createElement(Poller, { callback: first }),
    );

    await vi.advanceTimersByTimeAsync(1000);
    expect(first).toHaveBeenCalledTimes(1);

    await rerender(createElement(Poller, { callback: second }));
    await vi.advanceTimersByTimeAsync(1000);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    await unmount();
  });
});
