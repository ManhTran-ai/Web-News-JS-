import { enabledSources } from '../config/sources.js';
import { fetchFeed } from '../services/feed.service.js';
import { mapWithConcurrency } from '../utils/async.js';

const tasks = enabledSources().flatMap((source) =>
  source.feeds.map((feed) => ({ source, feed })),
);

const results = await mapWithConcurrency(tasks, 5, async ({ source, feed }) => {
  const result = await fetchFeed(source, feed);
  const withImage = result.items.filter((item) => item.thumbnail).length;
  const withDate = result.items.filter((item) => item.publishedAt).length;
  const newest = result.items.reduce<string>(
    (acc, item) => (acc === '' || item.publishedAt > acc ? item.publishedAt : acc),
    '',
  );

  return {
    nguon: source.name,
    chuyen_muc: feed.category,
    trang_thai: result.ok ? 'OK' : `LỖI: ${result.error}`,
    so_bai: result.total,
    'bai_co_anh': result.total > 0 ? `${Math.round((withImage / result.total) * 100)}%` : '0%',
    'bai_co_ngay': result.total > 0 ? `${Math.round((withDate / result.total) * 100)}%` : '0%',
    'moi_nhat': newest ? newest.slice(0, 16).replace('T', ' ') : '-',
  };
});

console.table(results);

const okSources = new Set(
  results.filter((r) => r.trang_thai === 'OK').map((r) => r.nguon),
);
const okCategories = new Set(
  results.filter((r) => r.trang_thai === 'OK').map((r) => r.chuyen_muc),
);

console.log(`Nguồn hoạt động: ${okSources.size} (${[...okSources].join(', ')})`);
console.log(`Chuyên mục có dữ liệu: ${okCategories.size}`);
console.log(`Feed lỗi: ${results.filter((r) => r.trang_thai !== 'OK').length}/${results.length}`);

if (okSources.size < 3) {
  console.error('Yêu cầu tối thiểu 3 nguồn hoạt động chưa đạt');
  process.exit(1);
}
