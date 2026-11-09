import { describe, expect, it } from 'vitest';
import { mapWithConcurrency, sleep } from './async.js';

describe('mapWithConcurrency', () => {
  it('xử lý toàn bộ phần tử và giữ đúng thứ tự', async () => {
    const input = [1, 2, 3, 4, 5];
    const result = await mapWithConcurrency(input, 2, async (value) => value * 2);
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it('trả mảng rỗng với input rỗng', async () => {
    const result = await mapWithConcurrency([], 3, async (value) => value);
    expect(result).toEqual([]);
  });

  it('không chạy vượt quá giới hạn đồng thời', async () => {
    let running = 0;
    let maxRunning = 0;

    await mapWithConcurrency(Array.from({ length: 10 }, (_, i) => i), 3, async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await sleep(5);
      running -= 1;
    });

    expect(maxRunning).toBeLessThanOrEqual(3);
    expect(maxRunning).toBeGreaterThan(1);
  });

  it('truyền đúng index cho worker', async () => {
    const result = await mapWithConcurrency(['a', 'b', 'c'], 1, async (value, index) => `${value}${index}`);
    expect(result).toEqual(['a0', 'b1', 'c2']);
  });

  it('giữ thứ tự kết quả dù thời gian hoàn thành khác nhau', async () => {
    const result = await mapWithConcurrency([30, 10, 20], 3, async (delay) => {
      await sleep(delay);
      return delay;
    });
    expect(result).toEqual([30, 10, 20]);
  });
});

describe('sleep', () => {
  it('hoàn thành sau khoảng thời gian yêu cầu', async () => {
    const startedAt = Date.now();
    await sleep(20);
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(15);
  });
});
