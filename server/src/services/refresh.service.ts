import { config } from '../config/env.js';
import { enabledSources } from '../config/sources.js';
import { mapWithConcurrency } from '../utils/async.js';
import { articleStore } from './article.store.js';
import { cacheService } from './cache.service.js';
import { fetchFeed } from './feed.service.js';
import { prefetchContent } from './content.prefetch.js';
import { writeSnapshot } from './snapshot.service.js';
import type { Article, SourceStatus } from '../types/article.js';

const FEED_CONCURRENCY = 5;

export interface RefreshSummary {
  startedAt: string;
  finishedAt: string;
  added: number;
  feedsOk: number;
  feedsFailed: number;
  sources: SourceStatus[];
}

let lastRefreshAt: string | null = null;
let lastSummary: RefreshSummary | null = null;

export function getLastRefreshAt(): string | null {
  return lastRefreshAt;
}

export function getSourceStatuses(): SourceStatus[] {
  const counts = articleStore.countBySource();

  if (lastSummary) {
    return lastSummary.sources.map((status) => ({
      ...status,
      count: counts.get(status.id) ?? 0,
    }));
  }

  return enabledSources().map((source) => ({
    id: source.id,
    name: source.name,
    ok: false,
    count: counts.get(source.id) ?? 0,
  }));
}

export async function refreshAll(): Promise<RefreshSummary> {
  const startedAt = new Date().toISOString();
  const sources = enabledSources();

  const tasks = sources.flatMap((source) =>
    source.feeds.map((feed) => ({ source, feed })),
  );

  const results = await mapWithConcurrency(tasks, FEED_CONCURRENCY, async ({ source, feed }) =>
    fetchFeed(source, feed),
  );

  const allArticles: Article[] = [];
  const sourceStatuses = new Map<string, SourceStatus>();

  for (const result of results) {
    allArticles.push(...result.items);

    const status = sourceStatuses.get(result.sourceId) ?? {
      id: result.sourceId,
      name: result.source,
      ok: true,
      count: 0,
    };

    status.count += result.total;
    if (!result.ok) {
      status.ok = false;
      status.error = result.error ?? 'Lỗi không xác định';
    }
    sourceStatuses.set(result.sourceId, status);
  }

  const added = articleStore.upsertMany(allArticles);
  cacheService.clearQuery();

  const feedsOk = results.filter((r) => r.ok).length;
  const feedsFailed = results.length - feedsOk;

  lastRefreshAt = new Date().toISOString();

  const summary: RefreshSummary = {
    startedAt,
    finishedAt: lastRefreshAt,
    added,
    feedsOk,
    feedsFailed,
    sources: [...sourceStatuses.values()],
  };
  lastSummary = summary;

  await writeSnapshot(articleStore.snapshot());

  console.log(
    `[refresh] ${feedsOk}/${results.length} feed thành công, thêm ${added} bài, tổng ${articleStore.size}`,
  );
  for (const result of results) {
    if (!result.ok) {
      console.warn(`[refresh] Lỗi feed ${result.source} (${result.category}): ${result.error}`);
    }
  }

  void prefetchContent();

  return summary;
}

export function isRefreshing(): boolean {
  return lastSummary === null;
}

export const refreshConfig = { cron: config.refreshCron };
