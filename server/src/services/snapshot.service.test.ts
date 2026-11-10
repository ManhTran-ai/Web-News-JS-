import { describe, expect, it } from 'vitest';
import { readSnapshot, writeSnapshot } from './snapshot.service.js';
import type { Article } from '../types/article.js';

const article: Article = {
  id: 's1',
  title: 'Bài lưu snapshot',
  summary: 'Tóm tắt',
  link: 'https://vnexpress.net/s1.html',
  sourceId: 'vnexpress',
  source: 'VnExpress',
  category: 'thoi-su',
  publishedAt: new Date().toISOString(),
};

describe('snapshot.service', () => {
  it('ghi và đọc lại được danh sách bài viết', async () => {
    await writeSnapshot([article]);
    const restored = await readSnapshot();

    expect(restored).toHaveLength(1);
    expect(restored[0]?.id).toBe('s1');
    expect(restored[0]?.title).toBe('Bài lưu snapshot');
  });

  it('ghi danh sách rỗng thì đọc ra danh sách rỗng', async () => {
    await writeSnapshot([]);
    expect(await readSnapshot()).toEqual([]);
  });

  it('không ném lỗi khi đọc file không tồn tại', async () => {
    await writeSnapshot([]);
    const restored = await readSnapshot();
    expect(Array.isArray(restored)).toBe(true);
  });
});
