import { describe, expect, it } from 'vitest';
import { canonicalizeUrl, hostnameOf, isHttpUrl, resolveUrl } from './url.js';

describe('canonicalizeUrl', () => {
  it('trả null khi chuỗi rỗng', () => {
    expect(canonicalizeUrl('   ')).toBeNull();
  });

  it('trả null khi URL không hợp lệ', () => {
    expect(canonicalizeUrl('khong-phai-url')).toBeNull();
  });

  it('chỉ chấp nhận http và https', () => {
    expect(canonicalizeUrl('javascript:alert(1)')).toBeNull();
    expect(canonicalizeUrl('file:///etc/passwd')).toBeNull();
    expect(canonicalizeUrl('ftp://example.com/a')).toBeNull();
  });

  it('bỏ fragment', () => {
    expect(canonicalizeUrl('https://vnexpress.net/a#section')).toBe('https://vnexpress.net/a');
  });

  it('chuyển hostname về chữ thường', () => {
    expect(canonicalizeUrl('https://VNExpress.NET/a')).toBe('https://vnexpress.net/a');
  });

  it('xoá tham số tracking', () => {
    const result = canonicalizeUrl('https://vnexpress.net/a?utm_source=facebook&fbclid=123');
    expect(result).toBe('https://vnexpress.net/a');
  });

  it('giữ tham số có ý nghĩa', () => {
    expect(canonicalizeUrl('https://vnexpress.net/a?page=2')).toBe(
      'https://vnexpress.net/a?page=2',
    );
  });

  it('xoá dấu gạch chéo cuối đường dẫn', () => {
    expect(canonicalizeUrl('https://vnexpress.net/a/')).toBe('https://vnexpress.net/a');
  });

  it('giữ dấu gạch chéo gốc', () => {
    expect(canonicalizeUrl('https://vnexpress.net/')).toBe('https://vnexpress.net/');
  });

  it('sắp xếp thứ tự query param', () => {
    expect(canonicalizeUrl('https://vnexpress.net/a?b=2&a=1')).toBe(
      'https://vnexpress.net/a?a=1&b=2',
    );
  });

  it('tạo cùng kết quả cho các biến thể URL khác nhau', () => {
    const a = canonicalizeUrl('https://vnexpress.net/a/?utm_source=x');
    const b = canonicalizeUrl('https://vnexpress.net/a');
    expect(a).toBe(b);
  });
});

describe('hostnameOf', () => {
  it('lấy hostname', () => {
    expect(hostnameOf('https://vnexpress.net/bai-1.html')).toBe('vnexpress.net');
  });

  it('trả null khi URL không hợp lệ', () => {
    expect(hostnameOf('abc')).toBeNull();
  });
});

describe('isHttpUrl', () => {
  it('true với http và https', () => {
    expect(isHttpUrl('http://a.vn')).toBe(true);
    expect(isHttpUrl('https://a.vn')).toBe(true);
  });

  it('false với protocol khác', () => {
    expect(isHttpUrl('ftp://a.vn')).toBe(false);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('resolveUrl', () => {
  it('chuyển URL tương đối thành tuyệt đối', () => {
    expect(resolveUrl('/img/a.jpg', 'https://vnexpress.net/bai-1.html')).toBe(
      'https://vnexpress.net/img/a.jpg',
    );
  });

  it('giữ URL tuyệt đối', () => {
    expect(resolveUrl('https://cdn.vn/a.jpg', 'https://vnexpress.net/')).toBe(
      'https://cdn.vn/a.jpg',
    );
  });

  it('trả null với protocol không an toàn', () => {
    expect(resolveUrl('javascript:alert(1)', 'https://vnexpress.net/')).toBeNull();
  });
});
