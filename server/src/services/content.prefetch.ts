import { config } from '../config/env.js';
import { articleStore } from './article.store.js';
import { getContent } from './content.service.js';
import { cacheService } from './cache.service.js';
import { sleep } from '../utils/async.js';

const PREFETCH_CONCURRENCY = 3;
const PREFETCH_DELAY_MS = 400;

export async function prefetchContent(): Promise<void> {
  const count = config.contentPrefetchCount;
  if (count <= 0) return;

  const cached = cacheService.contentIds();
  const pending = articleStore.recentWithoutContent(cached, count);

  if (pending.length === 0) return;

  console.log(`[prefetch] Bắt đầu tải trước ${pending.length} bài mới nhất`);

  let cursor = 0;
  let done = 0;
  let failed = 0;

  const workers = Array.from(
    { length: Math.min(PREFETCH_CONCURRENCY, pending.length) },
    async () => {
      while (cursor < pending.length) {
        const index = cursor;
        cursor += 1;
        const article = pending[index];
        if (!article) continue;

        try {
          await getContent(article);
          done += 1;
        } catch (error) {
          failed += 1;
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`[prefetch] Không lấy được nội dung "${article.title}": ${message}`);
        }

        await sleep(PREFETCH_DELAY_MS);
      }
    },
  );

  await Promise.all(workers);
  console.log(`[prefetch] Hoàn tất: ${done} thành công, ${failed} lỗi`);
}
