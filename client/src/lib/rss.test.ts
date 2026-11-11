// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parseRssItems } from './rss';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tin tức 24h</title>
    <item>
      <title>Bài một</title>
      <link>http://localhost:4000/bai-viet/a1</link>
      <pubDate>Mon, 10 Nov 2026 08:00:00 GMT</pubDate>
      <source url="https://vnexpress.net/a1.html">VnExpress</source>
    </item>
    <item>
      <title>Bài hai</title>
      <link>http://localhost:4000/bai-viet/a2</link>
      <pubDate>ngày không hợp lệ</pubDate>
      <source url="https://tuoitre.vn/a2.html">Tuổi Trẻ</source>
    </item>
  </channel>
</rss>`;

describe('parseRssItems', () => {
  it('đọc được các item trong feed', () => {
    const items = parseRssItems(XML);
    expect(items).toHaveLength(2);
    expect(items[0]?.title).toBe('Bài một');
    expect(items[0]?.link).toBe('http://localhost:4000/bai-viet/a1');
    expect(items[0]?.source).toBe('VnExpress');
    expect(items[0]?.pubDate).toBe('2026-11-10T08:00:00.000Z');
  });

  it('bỏ pubDate không hợp lệ', () => {
    const items = parseRssItems(XML);
    expect(items[1]?.pubDate).toBeNull();
  });

  it('trả mảng rỗng khi XML rỗng', () => {
    expect(parseRssItems('')).toEqual([]);
  });

  it('trả mảng rỗng khi XML không hợp lệ', () => {
    expect(parseRssItems('<rss><channel><item></rss>')).toEqual([]);
  });
});
