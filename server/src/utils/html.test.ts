import { describe, expect, it } from 'vitest';
import { sanitizeArticleHtml } from './html.js';

const BASE = 'https://vnexpress.net/';

describe('sanitizeArticleHtml', () => {
  it('loại bỏ script và iframe', () => {
    const html = '<p>Nội dung</p><script>alert(1)</script><iframe src="x"></iframe>';
    const result = sanitizeArticleHtml(html, BASE);
    expect(result).not.toContain('script');
    expect(result).not.toContain('iframe');
    expect(result).toContain('Nội dung');
  });

  it('loại bỏ thuộc tính sự kiện', () => {
    const html = '<p onclick="alert(1)">Text</p><img src="/a.jpg" onerror="alert(1)" alt="a">';
    const result = sanitizeArticleHtml(html, BASE);
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onerror');
  });

  it('ép target và rel cho thẻ a', () => {
    const html = '<a href="/bai-viet-1.html">Bài</a>';
    const result = sanitizeArticleHtml(html, BASE);
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('đổi URL tương đối thành tuyệt đối', () => {
    const html = '<a href="/bai-viet-1.html">Bài</a><img src="/img/a.jpg" alt="a">';
    const result = sanitizeArticleHtml(html, BASE);
    expect(result).toContain('https://vnexpress.net/bai-viet-1.html');
    expect(result).toContain('https://vnexpress.net/img/a.jpg');
  });

  it('chuyển data-src thành src', () => {
    const html = '<img data-src="https://cdn.example.com/a.jpg" alt="a">';
    const result = sanitizeArticleHtml(html, BASE);
    expect(result).toContain('src="https://cdn.example.com/a.jpg"');
  });

  it('loại bỏ javascript: url', () => {
    const html = '<a href="javascript:alert(1)">x</a>';
    const result = sanitizeArticleHtml(html, BASE);
    expect(result).not.toContain('javascript:');
  });
});
