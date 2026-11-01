import { enabledSources } from '../config/sources.js';
import { fetchFeed } from '../services/feed.service.js';
import { getContent } from '../services/content.service.js';
import { textLength } from '../utils/html.js';

const SAMPLE_PER_SOURCE = 3;

interface Row {
  nguon: string;
  bai: string;
  trang_thai: string;
  so_ky_tu: number;
  so_anh: number;
  thoi_gian_tai: string;
}

const rows: Row[] = [];

for (const source of enabledSources()) {
  const feed = source.feeds[0];
  if (!feed) continue;

  const result = await fetchFeed(source, feed);
  if (!result.ok) {
    rows.push({
      nguon: source.name,
      bai: '-',
      trang_thai: `LỖI FEED: ${result.error}`,
      so_ky_tu: 0,
      so_anh: 0,
      thoi_gian_tai: '-',
    });
    continue;
  }

  for (const article of result.items.slice(0, SAMPLE_PER_SOURCE)) {
    const started = Date.now();
    try {
      const content = await getContent(article);
      const elapsed = Date.now() - started;
      const images = (content.contentHtml.match(/<img/gi) || []).length;
      rows.push({
        nguon: source.name,
        bai: article.title.slice(0, 45),
        trang_thai: 'OK',
        so_ky_tu: textLength(content.contentHtml),
        so_anh: images,
        thoi_gian_tai: `${elapsed}ms`,
      });
    } catch (error) {
      const elapsed = Date.now() - started;
      const message = error instanceof Error ? error.message : String(error);
      rows.push({
        nguon: source.name,
        bai: article.title.slice(0, 45),
        trang_thai: `LỖI: ${message.slice(0, 60)}`,
        so_ky_tu: 0,
        so_anh: 0,
        thoi_gian_tai: `${elapsed}ms`,
      });
    }
  }
}

console.table(rows);

const bySource = new Map<string, { ok: number; total: number }>();
for (const row of rows) {
  const stat = bySource.get(row.nguon) ?? { ok: 0, total: 0 };
  stat.total += 1;
  if (row.trang_thai === 'OK') stat.ok += 1;
  bySource.set(row.nguon, stat);
}

let failed = false;
for (const [name, stat] of bySource) {
  const ratio = stat.total > 0 ? stat.ok / stat.total : 0;
  const status = ratio >= 2 / 3 ? 'ĐẠT' : 'CHƯA ĐẠT';
  console.log(`${name}: ${stat.ok}/${stat.total} bài lấy được nội dung — ${status}`);
  if (ratio < 2 / 3) failed = true;
}

if (failed) {
  console.error('Có nguồn lấy được nội dung dưới 2/3 số bài thử');
  process.exit(1);
}
