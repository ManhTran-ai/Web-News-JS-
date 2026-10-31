import Parser from 'rss-parser';
import { config } from '../config/env.js';
import type { FeedConfig, SourceConfig } from '../config/sources.js';
import { parseDate } from '../utils/date.js';
import { articleId } from '../utils/hash.js';
import { stripHtml } from '../utils/text.js';
import { canonicalizeUrl } from '../utils/url.js';
import type { Article } from '../types/article.js';

export interface FeedResult {
  sourceId: string;
  source: string;
  category: string;
  url: string;
  ok: boolean;
  error?: string;
  items: Article[];
  total: number;
  skipped: number;
  skippedReasons: Record<string, number>;
}

const parser = new Parser({
  timeout: config.feedTimeoutMs,
});

interface RawItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  content?: string;
  contentSnippet?: string;
  description?: string;
  enclosure?: { url?: string };
  'media:content'?: { $?: { url?: string } };
  'media:thumbnail'?: { $?: { url?: string } };
  'dc:creator'?: string;
}

function pickThumbnail(item: RawItem, descriptionHtml: string): string | undefined {
  const candidates = [
    item.enclosure?.url,
    item['media:content']?.$?.url,
    item['media:thumbnail']?.$?.url,
  ];

  for (const candidate of candidates) {
    if (candidate && /^https?:\/\//i.test(candidate)) return candidate;
  }

  const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(descriptionHtml);
  return imgMatch?.[1];
}

export async function fetchFeed(source: SourceConfig, feed: FeedConfig): Promise<FeedResult> {
  const skippedReasons: Record<string, number> = {};
  const items: Article[] = [];

  const track = (reason: string): void => {
    skippedReasons[reason] = (skippedReasons[reason] ?? 0) + 1;
  };

  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      signal: AbortSignal.timeout(config.feedTimeoutMs),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const parsed = await parser.parseString(xml);

    for (const raw of parsed.items as RawItem[]) {
      const title = stripHtml(raw.title ?? '').trim();
      if (!title) {
        track('thiếu tiêu đề');
        continue;
      }

      const rawLink = raw.link ?? raw.guid ?? '';
      const canonical = canonicalizeUrl(rawLink);
      if (!canonical) {
        track('link không hợp lệ');
        continue;
      }

      const publishedAt = parseDate(raw.isoDate ?? raw.pubDate);
      if (!publishedAt) {
        track('ngày đăng không hợp lệ');
        continue;
      }

      const descriptionHtml = raw.description ?? raw.content ?? raw.contentSnippet ?? '';
      const summary = stripHtml(descriptionHtml);

      items.push({
        id: articleId(canonical),
        title,
        summary,
        thumbnail: pickThumbnail(raw, descriptionHtml),
        link: canonical,
        sourceId: source.id,
        source: source.name,
        category: feed.category,
        publishedAt,
      });
    }

    return {
      sourceId: source.id,
      source: source.name,
      category: feed.category,
      url: feed.url,
      ok: true,
      items,
      total: items.length,
      skipped: Object.values(skippedReasons).reduce((a, b) => a + b, 0),
      skippedReasons,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      sourceId: source.id,
      source: source.name,
      category: feed.category,
      url: feed.url,
      ok: false,
      error: message,
      items: [],
      total: 0,
      skipped: 0,
      skippedReasons,
    };
  }
}
