import { describe, expect, it } from 'vitest';
import { isNew } from './time';

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
