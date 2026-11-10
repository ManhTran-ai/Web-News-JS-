import { describe, expect, it } from 'vitest';
import { historyCutoff, isNew } from './time';

describe('isNew', () => {
  it('trả về true cho bài đăng trong vòng 1 giờ', () => {
    const recent = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(isNew(recent)).toBe(true);
  });

  it('trả về false cho bài đăng cũ hơn 1 giờ', () => {
    const old = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    expect(isNew(old)).toBe(false);
  });

  it('trả về false cho ngày không hợp lệ', () => {
    expect(isNew('khong-phai-ngay')).toBe(false);
  });
});

describe('historyCutoff', () => {
  const now = new Date('2026-11-10T15:30:00.000Z').getTime();

  it('không lọc khi chọn "tất cả"', () => {
    expect(historyCutoff('all', now)).toBeNull();
  });

  it('lọc từ đầu ngày khi chọn "hôm nay"', () => {
    const cutoff = historyCutoff('today', now);
    expect(cutoff).not.toBeNull();
    expect(new Date(cutoff as number).getHours()).toBe(0);
    expect(new Date(cutoff as number).getMinutes()).toBe(0);
  });

  it('lùi 7 ngày khi chọn "7 ngày"', () => {
    expect(historyCutoff('week', now)).toBe(now - 7 * 86_400_000);
  });
});
