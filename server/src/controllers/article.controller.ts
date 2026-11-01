import type { Request, Response } from 'express';
import { articleStore } from '../services/article.store.js';
import { getContent } from '../services/content.service.js';
import { getLastRefreshAt, getSourceStatuses } from '../services/refresh.service.js';
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

export function healthController(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    lastRefreshAt: getLastRefreshAt(),
    articleCount: articleStore.size,
    sources: getSourceStatuses(),
  });
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
    page: number;
    limit: number;
  };
  const result = articleStore.query(query);
  res.json({ data: result.items, meta: result.meta });
}

export function latestController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as { page: number; limit: number };
  const result = articleStore.query({ page: query.page, limit: query.limit });
  res.json({ data: result.items, meta: result.meta });
}

export function featuredController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as { limit: number };
  const items = articleStore.featured(query.limit);
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

export function searchController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as { q: string; page: number; limit: number };
  const result = articleStore.query(query);
  res.json({ data: result.items, meta: result.meta });
}

export function getArticleController(req: Request, res: Response): void {
  const article = requireArticle(paramId(req));
  res.json({ data: article });
}

export function relatedController(req: Request, res: Response): void {
  const query = res.locals.parsedQuery as { limit: number };
  const id = paramId(req);
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
