import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { articleStore } from '../services/article.store.js';
import { getContent } from '../services/content.service.js';
import { getLastRefreshAt, getSourceStatuses, refreshAll } from '../services/refresh.service.js';
import { SOURCES } from '../config/sources.js';
import { CATEGORY_NAMES } from '../config/categories.js';
import { ApiError } from '../middlewares/error.js';
import type { Article } from '../types/article.js';

function requireArticle(id: string): Article {
  const article = articleStore.getById(id);
  if (!article) {
    throw new ApiError(404, 'NOT_FOUND', 'Bài viết không tồn tại hoặc đã hết thời hạn lưu giữ');
  }
  return article;
}

function paramId(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]&gt;')}]]>`;
}

function sendCachedJson(res: Response, payload: unknown, maxAgeSeconds: number): void {
  const body = JSON.stringify(payload);
  const etag = `W/"${createHash('sha1').update(body).digest('base64url').slice(0, 20)}"`;

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}`);

  if (res.req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(body);
}

export function healthController(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    lastRefreshAt: getLastRefreshAt(),
    articleCount: articleStore.size,
    sources: getSourceStatuses(),
  });
}

export async function refreshController(_req: Request, res: Response): Promise<void> {
  const summary = await refreshAll();
  res.json({ data: summary });
}

export function categoriesController(_req: Request, res: Response): void {
  const counts = new Map(articleStore.categories().map((c) => [c.slug, c.count]));
  const data = Object.entries(CATEGORY_NAMES).map(([slug, name]) => ({
    slug,
    name,
    count: counts.get(slug) ?? 0,
  }));
  res.json({ data });
}

export function sourcesController(_req: Request, res: Response): void {
  const statuses = new Map(getSourceStatuses().map((s) => [s.id, s]));
  const counts = articleStore.countBySource();
  const data = SOURCES.map((source) => {
    const status = statuses.get(source.id);
    return {
      id: source.id,
      name: source.name,
      homepage: source.homepage,
      enabled: source.enabled,
      count: counts.get(source.id) ?? 0,
      ok: status?.ok ?? false,
      error: status?.error,
      feeds: source.feeds.map((f) => ({ category: f.category, url: f.url })),
    };
  });
  res.json({ data });
}

export function listArticlesController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as {
    category?: string;
    source?: string;
    q?: string;
    since?: string;
    until?: string;
    page: number;
    limit: number;
  };
  const result = articleStore.query(query);
  sendCachedJson(res, { data: result.items, meta: result.meta }, 30);
}

export function latestController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as { page: number; limit: number };
  const result = articleStore.query({ page: query.page, limit: query.limit });
  sendCachedJson(res, { data: result.items, meta: result.meta }, 30);
}

export function featuredController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as { limit: number };
  const items = articleStore.featured(query.limit);
  sendCachedJson(
    res,
    {
      data: items,
      meta: {
        page: 1,
        limit: query.limit,
        total: items.length,
        totalPages: 1,
        updatedAt: articleStore.updatedAt,
      },
    },
    60,
  );
}

export function searchController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as { q: string; page: number; limit: number };
  const result = articleStore.query(query);
  sendCachedJson(res, { data: result.items, meta: result.meta }, 30);
}

export function getArticleController(req: Request, res: Response): void {
  const article = requireArticle(paramId(req));
  res.json({ data: article });
}

export function relatedController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as { limit: number };
  const id = paramId(req);
  requireArticle(id);
  const items = articleStore.related(id, query.limit);
  res.json({
    data: items,
    meta: {
      page: 1,
      limit: query.limit,
      total: items.length,
      totalPages: 1,
      updatedAt: articleStore.updatedAt,
    },
  });
}

export async function contentController(req: Request, res: Response): Promise<void> {
  const article = requireArticle(paramId(req));
  const content = await getContent(article);
  res.json({ data: content });
}

export function rssController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as { limit: number; category?: string };
  const items = articleStore.query({
    page: 1,
    limit: query.limit,
    category: query.category,
  }).items;

  const baseUrl = `${req.protocol}://${req.get('host') ?? 'localhost'}`;
  const itemsXml = items
    .map((article) => {
      const link = `${baseUrl}/bai-viet/${article.id}`;
      const category = CATEGORY_NAMES[article.category] ?? article.category;
      return [
        '    <item>',
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="false">${escapeXml(article.id)}</guid>`,
        `      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>`,
        `      <category>${escapeXml(category)}</category>`,
        `      <source url="${escapeXml(article.link)}">${escapeXml(article.source)}</source>`,
        `      <description>${cdata(article.summary)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    '    <title>Tin tức 24h</title>',
    `    <link>${escapeXml(baseUrl)}</link>`,
    '    <description>Tổng hợp tin tức từ VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, VietnamNet</description>',
    '    <language>vi</language>',
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    itemsXml,
    '  </channel>',
    '</rss>',
  ].join('\n');

  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(xml);
}
