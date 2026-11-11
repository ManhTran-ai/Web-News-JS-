export interface RssItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string | null;
}

/**
 * Đọc các `<item>` của một feed RSS bằng DOMParser.
 * Dùng cho feed do server của dự án phục vụ (`/api/articles/rss.xml`).
 */
export function parseRssItems(xml: string): RssItem[] {
  if (!xml.trim()) return [];

  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) return [];

  return Array.from(document.querySelectorAll('item')).map((node) => {
    const rawDate = node.querySelector('pubDate')?.textContent?.trim() ?? '';
    const parsedDate = rawDate ? new Date(rawDate) : null;
    const pubDate =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;

    return {
      title: node.querySelector('title')?.textContent?.trim() ?? '',
      link: node.querySelector('link')?.textContent?.trim() ?? '',
      pubDate,
      source: node.querySelector('source')?.textContent?.trim() ?? null,
    };
  });
}
