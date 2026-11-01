import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { config } from '../config/env.js';
import { findSourceById, isAllowedDomain } from '../config/sources.js';
import { cacheService } from './cache.service.js';
import { extractFirstImage, extractMeta, sanitizeArticleHtml, textLength } from '../utils/html.js';
import { resolveUrl } from '../utils/url.js';
import type { Article, ArticleContent } from '../types/article.js';

export class ContentUnavailableError extends Error {
  readonly code = 'CONTENT_UNAVAILABLE';

  constructor(message: string) {
    super(message);
    this.name = 'ContentUnavailableError';
  }
}

const inflight = new Map<string, Promise<ArticleContent>>();

const MIN_TEXT_LENGTH = 400;

async function downloadHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': config.userAgent,
      Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(config.contentTimeoutMs),
  });

  if (!response.ok) {
    throw new ContentUnavailableError(`Tải trang báo thất bại với HTTP ${response.status}`);
  }

  return response.text();
}

function extractWithReadability(html: string): { content: string; title?: string } | null {
  try {
    const dom = new JSDOM(html);
    const article = new Readability(dom.window.document).parse();
    if (!article?.content) return null;
    return { content: article.content, title: article.title ?? undefined };
  } catch {
    return null;
  }
}

function extractWithSelector(html: string, selector: string): string | null {
  try {
    const dom = new JSDOM(html);
    const node = dom.window.document.querySelector(selector);
    if (!node) return null;
    return node.innerHTML;
  } catch {
    return null;
  }
}

async function crawl(article: Article): Promise<ArticleContent> {
  if (!isAllowedDomain(article.link)) {
    throw new ContentUnavailableError('Tên miền bài viết không nằm trong danh sách nguồn được phép');
  }

  const html = await downloadHtml(article.link);

  const source = findSourceById(article.sourceId);
  let rawContent: string | null = null;

  const readability = extractWithReadability(html);
  if (readability && textLength(readability.content) >= MIN_TEXT_LENGTH) {
    rawContent = readability.content;
  }

  if (!rawContent && source?.contentSelector) {
    const selected = extractWithSelector(html, source.contentSelector);
    if (selected && textLength(selected) >= MIN_TEXT_LENGTH) {
      rawContent = selected;
    }
  }

  if (!rawContent) {
    throw new ContentUnavailableError('Không trích được nội dung bài viết từ trang báo');
  }

  const contentHtml = sanitizeArticleHtml(rawContent, article.link);

  if (textLength(contentHtml) < 200) {
    throw new ContentUnavailableError('Nội dung bài viết quá ngắn sau khi làm sạch');
  }

  const author = extractMeta(html, 'author');
  const ogImage = extractMeta(html, 'og:image');
  const leadImage = ogImage ? resolveUrl(ogImage, article.link) : extractFirstImage(contentHtml);

  return {
    id: article.id,
    contentHtml,
    author,
    leadImage: leadImage ?? undefined,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getContent(article: Article): Promise<ArticleContent> {
  const cached = cacheService.getContent(article.id);
  if (cached) return cached;

  const existing = inflight.get(article.id);
  if (existing) return existing;

  const task = crawl(article)
    .then((content) => {
      cacheService.setContent(article.id, content);
      return content;
    })
    .finally(() => {
      inflight.delete(article.id);
    });

  inflight.set(article.id, task);
  return task;
}
