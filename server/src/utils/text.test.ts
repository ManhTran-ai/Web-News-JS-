import { describe, expect, it } from 'vitest';
import { stripHtml, toSearchText, truncate } from './text.js';

describe('toSearchText', () => {
  it('bỏ dấu tiếng Việt', () => {
    expect(toSearchText('Đà Nẵng')).toBe('da nang');
  });

  it('bỏ dấu và chuyển đ thành d', () => {
    expect(toSearchText('Thủ đô Hà Nội')).toBe('thu do ha noi');
  });

  it('viết thường và gộp khoảng trắng', () => {
    expect(toSearchText('  Xin   CHÀO  ')).toBe('xin chao');
  });

  it('giữ số và dấu gạch nối', () => {
    expect(toSearchText('Bài 2024 - Tin')).toBe('bai 2024 - tin');
  });
});

describe('stripHtml', () => {
  it('bỏ thẻ HTML', () => {
    expect(stripHtml('<p>Xin chào <b>Việt Nam</b></p>')).toBe('Xin chào Việt Nam');
  });

  it('decode HTML entity', () => {
    expect(stripHtml('Tin &amp; b&#224;i')).toBe('Tin & bài');
  });

  it('bỏ script và style', () => {
    expect(stripHtml('<script>alert(1)</script>Text')).toBe('Text');
  });
});

describe('truncate', () => {
  it('giữ nguyên chuỗi ngắn', () => {
    expect(truncate('Ngắn', 10)).toBe('Ngắn');
  });

  it('cắt chuỗi dài', () => {
    expect(truncate('Một hai ba bốn năm', 10)).toBe('Một hai ba…');
  });
});
