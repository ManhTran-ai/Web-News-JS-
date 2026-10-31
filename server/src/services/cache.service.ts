import NodeCache from 'node-cache';
import { config } from '../config/env.js';
import type { ArticleContent } from '../types/article.js';

const queryCache = new NodeCache({ stdTTL: 30, checkperiod: 30 });

const contentCache = new NodeCache({
  stdTTL: config.contentTtlHours * 3600,
  checkperiod: 600,
  maxKeys: 1000,
});

export const cacheService = {
  getQuery<T>(key: string): T | undefined {
    return queryCache.get<T>(key);
  },
  setQuery<T>(key: string, value: T): void {
    queryCache.set(key, value);
  },
  clearQuery(): void {
    queryCache.flushAll();
  },
  getContent(id: string): ArticleContent | undefined {
    return contentCache.get<ArticleContent>(id);
  },
  setContent(id: string, content: ArticleContent): void {
    contentCache.set(id, content);
  },
  hasContent(id: string): boolean {
    return contentCache.has(id);
  },
  contentIds(): Set<string> {
    return new Set(contentCache.keys());
  },
  clearContent(): void {
    contentCache.flushAll();
  },
};
