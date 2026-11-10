import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchFeed } from './feed.service.js';
import type { SourceConfig } from '../config/sources.js';

const source: SourceConfig = {
  id: 'test',
  name: 'Nguồn Test',
  homepage: 'https://test.vn',
  enabled: true,
  domains: ['test.vn'],
  feeds: [{ category: 'thoi-su', url: 'https://test.vn/rss/thoi-su.rss' }],
};

const feed = source.feeds[0]!;

function makeXml(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test</title>
${items}
</channel></rss>`;
}

const validItem = `
<item>
  <title>Bài viết hợp lệ</title>
  <link>https://test.vn/bai-1.html</link>
  <pubDate>Mon, 02 Nov 2026 08:00:00 +0700</pubDate>
  <description><![CDATA[<p>Tóm tắt bài viết</p>]]></description>
</item>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(body: string, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status,
      text: async () => body,
    })),
  );
}

describe('fetchFeed', () => {
  it('đọc được các item hợp lệ', async () => {
    stubFetch(makeXml(validItem));
    const result = await fetchFeed(source, feed);

    expect(result.ok).toBe(true);
    expect(result.total).toBe(1);
    expect(result.items[0]?.title).toBe('Bài viết hợp lệ');
    expect(result.items[0]?.source).toBe('Nguồn Test');
    expect(result.items[0]?.category).toBe('thoi-su');
  });

  it('lấy ảnh từ enclosure trước tiên', async () => {
    stubFetch(
      makeXml(`
<item>
  <title>Bài có ảnh</title>
  <link>https://test.vn/bai-2.html</link>
  <pubDate>Mon, 02 Nov 2026 08:00:00 +0700</pubDate>
  <enclosure url="https://cdn.test.vn/a.jpg" type="image/jpeg" />
  <media:content url="https://cdn.test.vn/b.jpg" xmlns:media="http://search.yahoo.com/mrss/" />
</item>`),
    );
    const result = await fetchFeed(source, feed);
    expect(result.items[0]?.thumbnail).toBe('https://cdn.test.vn/a.jpg');
  });

  it('bỏ item thiếu tiêu đề và ghi lý do', async () => {
    stubFetch(
      makeXml(`
<item>
  <link>https://test.vn/bai-3.html</link>
  <pubDate>Mon, 02 Nov 2026 08:00:00 +0700</pubDate>
</item>`),
    );
    const result = await fetchFeed(source, feed);

    expect(result.total).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.skippedReasons['thiếu tiêu đề']).toBe(1);
  });

  it('bỏ item có link không hợp lệ', async () => {
    stubFetch(
      makeXml(`
<item>
  <title>Bài lỗi link</title>
  <link>javascript:alert(1)</link>
  <pubDate>Mon, 02 Nov 2026 08:00:00 +0700</pubDate>
</item>`),
    );
    const result = await fetchFeed(source, feed);

    expect(result.total).toBe(0);
    expect(result.skippedReasons['link không hợp lệ']).toBe(1);
  });

  it('bỏ item có ngày đăng không hợp lệ, không thay bằng giờ hiện tại', async () => {
    stubFetch(
      makeXml(`
<item>
  <title>Bài lỗi ngày</title>
  <link>https://test.vn/bai-4.html</link>
  <pubDate>không phải ngày</pubDate>
</item>`),
    );
    const result = await fetchFeed(source, feed);

    expect(result.total).toBe(0);
    expect(result.skippedReasons['ngày đăng không hợp lệ']).toBe(1);
  });

  it('không ném lỗi khi HTTP thất bại', async () => {
    stubFetch('', false, 500);
    const result = await fetchFeed(source, feed);

    expect(result.ok).toBe(false);
    expect(result.items).toHaveLength(0);
    expect(result.error).toContain('500');
  });

  it('không ném lỗi khi mạng lỗi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    const result = await fetchFeed(source, feed);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('network down');
  });

  it('tạo id ổn định cho cùng một link', async () => {
    stubFetch(makeXml(validItem));
    const first = await fetchFeed(source, feed);

    stubFetch(makeXml(validItem));
    const second = await fetchFeed(source, feed);

    expect(first.items[0]?.id).toBe(second.items[0]?.id);
    expect(first.items[0]?.id).toHaveLength(16);
  });

  it('loại bỏ thẻ HTML trong tóm tắt', async () => {
    stubFetch(makeXml(validItem));
    const result = await fetchFeed(source, feed);
    expect(result.items[0]?.summary).toBe('Tóm tắt bài viết');
  });
});
