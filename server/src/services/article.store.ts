import { config } from '../config/env.js';
import { CATEGORY_NAMES } from '../config/categories.js';
import { toSearchText } from '../utils/text.js';
import type { Article, Category, ListMeta } from '../types/article.js';

interface StoredArticle extends Article {
  searchText: string;
}

export interface QueryOptions {
  category?: string;
  source?: string;
  q?: string;
  page: number;
  limit: number;
}

export interface QueryResult {
  items: Article[];
  meta: ListMeta;
}

export class ArticleStore {
  private articles = new Map<string, StoredArticle>();
  private lastUpdatedAt = new Date().toISOString();

  upsertMany(incoming: Article[]): number {
    let added = 0;

    for (const article of incoming) {
      const existing = this.articles.get(article.id);

      if (!existing) {
        this.articles.set(article.id, {
          ...article,
          searchText: this.buildSearchText(article),
        });
        added += 1;
        continue;
      }

      const merged: StoredArticle = {
        ...existing,
        ...article,
        category:
          existing.category === 'tong-hop' && article.category !== 'tong-hop'
            ? article.category
            : existing.category,
        summary: article.summary || existing.summary,
        thumbnail: article.thumbnail ?? existing.thumbnail,
        searchText: '',
      };
      merged.searchText = this.buildSearchText(merged);
      this.articles.set(article.id, merged);
    }

    this.prune();
    this.lastUpdatedAt = new Date().toISOString();
    return added;
  }

  private buildSearchText(article: Article): string {
    return toSearchText(`${article.title} ${article.summary} ${article.source}`);
  }

  private prune(): void {
    const cutoff = Date.now() - config.retentionHours * 3600 * 1000;

    for (const [id, article] of this.articles) {
      if (new Date(article.publishedAt).getTime() < cutoff) {
        this.articles.delete(id);
      }
    }

    if (this.articles.size > config.maxArticles) {
      const sorted = [...this.articles.values()].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      const keep = new Set(sorted.slice(0, config.maxArticles).map((a) => a.id));
      for (const id of this.articles.keys()) {
        if (!keep.has(id)) this.articles.delete(id);
      }
    }
  }

  get size(): number {
    return this.articles.size;
  }

  get updatedAt(): string {
    return this.lastUpdatedAt;
  }

  all(): Article[] {
    return [...this.articles.values()].map(this.toPublic);
  }

  private toPublic(article: StoredArticle): Article {
    const { searchText: _searchText, ...rest } = article;
    return rest;
  }

  getById(id: string): Article | undefined {
    const found = this.articles.get(id);
    return found ? this.toPublic(found) : undefined;
  }

  query(options: QueryOptions): QueryResult {
    const { category, source, q, page, limit } = options;

    let filtered = [...this.articles.values()];

    if (category) {
      filtered = filtered.filter((a) => a.category === category);
    }
    if (source) {
      filtered = filtered.filter((a) => a.sourceId === source);
    }
    if (q) {
      const needle = toSearchText(q);
      filtered = needle ? filtered.filter((a) => a.searchText.includes(needle)) : filtered;
    }

    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * limit;
    const items = filtered.slice(start, start + limit).map(this.toPublic);

    return {
      items,
      meta: {
        page: safePage,
        limit,
        total,
        totalPages,
        updatedAt: this.lastUpdatedAt,
      },
    };
  }

  latest(limit: number): Article[] {
    return this.query({ page: 1, limit }).items;
  }

  featured(limit: number): Article[] {
    const sorted = this.query({ page: 1, limit: Math.max(limit * 6, 40) }).items;
    const withImage = sorted.filter((a) => a.thumbnail);
    const result: Article[] = [];
    const usedSources = new Set<string>();

    for (const article of withImage) {
      if (result.length >= limit) break;
      if (usedSources.has(article.sourceId)) continue;
      usedSources.add(article.sourceId);
      result.push(article);
    }

    for (const article of withImage) {
      if (result.length >= limit) break;
      if (result.includes(article)) continue;
      result.push(article);
    }

    return result;
  }

  related(id: string, limit: number): Article[] {
    const target = this.articles.get(id);
    if (!target) return [];

    return this.query({ category: target.category, page: 1, limit: limit + 1 })
      .items.filter((a) => a.id !== id)
      .slice(0, limit);
  }

  categories(): Category[] {
    const counts = new Map<string, number>();
    for (const article of this.articles.values()) {
      counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
    }

    const categories: Category[] = [...counts.entries()].map(([slug, count]) => ({
      slug,
      name: CATEGORY_NAMES[slug] ?? slug,
      count,
    }));

    categories.sort((a, b) => b.count - a.count);
    return categories;
  }

  countBySource(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const article of this.articles.values()) {
      counts.set(article.sourceId, (counts.get(article.sourceId) ?? 0) + 1);
    }
    return counts;
  }

  recentWithoutContent(existingIds: Set<string>, limit: number): Article[] {
    return this.query({ page: 1, limit: Math.max(limit * 3, 30) })
      .items.filter((a) => !existingIds.has(a.id))
      .slice(0, limit);
  }

  snapshot(): Article[] {
    return this.all();
  }

  hydrate(articles: Article[]): void {
    for (const article of articles) {
      this.articles.set(article.id, { ...article, searchText: this.buildSearchText(article) });
    }
    this.prune();
    this.lastUpdatedAt = new Date().toISOString();
  }
}

export const articleStore = new ArticleStore();
