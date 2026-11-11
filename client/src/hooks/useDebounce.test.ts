// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';
import { renderHook, tick } from '@/test-utils/render';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('trả về giá trị ban đầu ngay lập tức', async () => {
    const { result, unmount } = await renderHook(() => useDebounce('bong da', 400));

    expect(result()).toBe('bong da');

    await unmount();
  });

  it('chưa cập nhật trước khi hết thời gian chờ', async () => {
    const { result, rerender, unmount } = await renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await tick(399);
    expect(result()).toBe('a');

    await unmount();
  });

  it('cập nhật sau khi hết thời gian chờ', async () => {
    const { result, rerender, unmount } = await renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await tick(400);
    expect(result()).toBe('ab');

    await unmount();
  });

  it('chỉ cập nhật sau khoảng thời gian chờ tính từ lần gõ cuối', async () => {
    const { result, rerender, unmount } = await renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await tick(300);
    await rerender({ value: 'abc' });
    await tick(300);
    // Chưa đủ 400ms kể từ lần gõ cuối.
    expect(result()).toBe('a');

    await tick(100);
    expect(result()).toBe('abc');

    await unmount();
  });

  it('không cập nhật khi giá trị không đổi', async () => {
    const { result, rerender, unmount } = await renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'a' });
    await tick(400);
    expect(result()).toBe('a');

    await unmount();
  });

  it('dùng mặc định 400ms khi không truyền thời gian chờ', async () => {
    const { result, rerender, unmount } = await renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await tick(399);
    expect(result()).toBe('a');

    await tick(1);
    expect(result()).toBe('ab');

    await unmount();
  });
});
