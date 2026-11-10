import { describe, expect, it } from 'vitest';
import { ArticleStore } from './article.store.js';
import type { Article } from '../types/article.js';

const HOUR = 3600_000;

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString();
}

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    title: 'Tiêu đề bài viết',
    summary: 'Tóm tắt nội dung',
    link: 'https://vnexpress.net/bai-1.html',
    sourceId: 'vnexpress',
    source: 'VnExpress',
    category: 'thoi-su',
    publishedAt: hoursAgo(1),
    ...overrides,
  };
}

describe('ArticleStore.upsertMany', () => {
  it('thêm bài mới và trả về số bài thêm', () => {
    const store = new ArticleStore();
    const added = store.upsertMany([makeArticle()]);
    expect(added).toBe(1);
    expect(store.size).toBe(1);
  });

  it('không thêm trùng cùng id', () => {
    const store = new ArticleStore();
    store.upsertMany([makeArticle()]);
    const added = store.upsertMany([makeArticle({ title: 'Tiêu đề mới' })]);
    expect(added).toBe(0);
    expect(store.size).toBe(1);
    expect(store.getById('a1')?.title).toBe('Tiêu đề mới');
  });

  it('nâng category tong-hop lên chuyên mục cụ thể', () => {
    const store = new ArticleStore();
    store.upsertMany([makeArticle({ category: 'tong-hop' })]);
    store.upsertMany([makeArticle({ category: 'the-thao' })]);
    expect(store.getById('a1')?.category).toBe('the-thao');
  });

  it('giữ category chuyên mục khi bản mới là tong-hop', () => {
    const store = new ArticleStore();
    store.upsertMany([makeArticle({ category: 'the-thao' })]);
    store.upsertMany([makeArticle({ category: 'tong-hop' })]);
    expect(store.getById('a1')?.category).toBe('the-thao');
  });

  it('không xoá thumbnail cũ khi bài mới không có ảnh', () => {
    const store = new ArticleStore();
    store.upsertMany([makeArticle({ thumbnail: 'https://cdn.vn/a.jpg' })]);
    store.upsertMany([makeArticle({ thumbnail: undefined })]);
    expect(store.getById('a1')?.thumbnail).toBe('https://cdn.vn/a.jpg');
  });

  it('không xoá summary cũ khi bài mới có summary rỗng', () => {
    const store = new ArticleStore();
    store.upsertMany([makeArticle({ summary: 'Có tóm tắt' })]);
    store.upsertMany([makeArticle({ summary: '' })]);
    expect(store.getById('a1')?.summary).toBe('Có tóm tắt');
  });
});

describe('ArticleStore.query', () => {
  it('lọc theo category', () => {
    const store = new ArticleStore();
    store.upsertMany([
      makeArticle({ id: 'a1', category: 'thoi-su' }),
      makeArticle({ id: 'a2', category: 'the-thao' }),
    ]);
    const result = store.query({ page: 1, limit: 10, category: 'the-thao' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('a2');
  });

  it('lọc theo source', () => {
    const store = new ArticleStore();
    store.upsertMany([
      makeArticle({ id: 'a1', sourceId: 'vnexpress' }),
      makeArticle({ id: 'a2', sourceId: 'tuoitre' }),
    ]);
    const result = store.query({ page: 1, limit: 10, source: 'tuoitre' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('a2');
  });

  it('tìm kiếm không phân biệt dấu tiếng Việt', () => {
    const store = new ArticleStore();
    store.upsertMany([makeArticle({ id: 'a1', title: 'Việt Nam vô địch' })]);
    const result = store.query({ page: 1, limit: 10, q: 'viet nam' });
    expect(result.items).toHaveLength(1);
  });

  it('sắp xếp mới nhất trước', () => {
    const store = new ArticleStore();
    store.upsertMany([
      makeArticle({ id: 'old', publishedAt: hoursAgo(48) }),
      makeArticle({ id: 'new', publishedAt: hoursAgo(2) }),
    ]);
    const result = store.query({ page: 1, limit: 10 });
    expect(result.items[0]?.id).toBe('new');
  });

  it('clamp page vượt quá totalPages', () => {
    const store = new ArticleStore();
    store.upsertMany([makeArticle({ id: 'a1' })]);
    const result = store.query({ page: 999, limit: 10 });
    expect(result.meta.page).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  it('trả totalPages tối thiểu bằng 1 khi không có bài', () => {
    const store = new ArticleStore();
    const result = store.query({ page: 1, limit: 10 });
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(1);
  });

  it('phân trang đúng số bài mỗi trang', () => {
    const store = new ArticleStore();
    store.upsertMany(
      Array.from({ length: 25 }, (_, i) => makeArticle({ id: `a${i}` })),
    );
    const page1 = store.query({ page: 1, limit: 10 });
    const page2 = store.query({ page: 2, limit: 10 });
    expect(page1.items).toHaveLength(10);
    expect(page2.items).toHaveLength(10);
    expect(page1.meta.total).toBe(25);
    expect(page1.meta.totalPages).toBe(3);
  });

  it('lọc theo khoảng thời gian since và until', () => {
    const store = new ArticleStore();
    store.upsertMany([
      makeArticle({ id: 'a1', publishedAt: hoursAgo(48) }),
      makeArticle({ id: 'a2', publishedAt: hoursAgo(2) }),
    ]);
    const since = new Date(Date.now() - 24 * HOUR).toISOString();
    const until = new Date(Date.now() + 24 * HOUR).toISOString();
    const result = store.query({ page: 1, limit: 10, since, until });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('a2');
  });

  it('không lộ trường nội bộ searchText ra ngoài', () => {
    const store = new ArticleStore();
    store.upsertMany([makeArticle()]);
    expect(store.getById('a1')).not.toHaveProperty('searchText');
  });
});

describe('ArticleStore.featured', () => {
  it('ưu tiên bài có ảnh và xen kẽ nhiều nguồn', () => {
    const store = new ArticleStore();
    store.upsertMany([
      makeArticle({ id: 'v1', sourceId: 'vnexpress', thumbnail: 'https://cdn/v1.jpg' }),
      makeArticle({ id: 'v2', sourceId: 'vnexpress', thumbnail: 'https://cdn/v2.jpg' }),
      makeArticle({ id: 't1', sourceId: 'tuoitre', thumbnail: 'https://cdn/t1.jpg' }),
    ]);
    const result = store.featured(2);
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.sourceId)).toEqual(['vnexpress', 'tuoitre']);
  });

  it('loại bài không có ảnh', () => {
    const store = new ArticleStore();
    store.upsertMany([makeArticle({ id: 'a1', thumbnail: undefined })]);
    expect(store.featured(5)).toHaveLength(0);
  });
});

describe('ArticleStore.related', () => {
  it('trả bài cùng chuyên mục, loại trừ chính nó', () => {
    const store = new ArticleStore();
    store.upsertMany([
      makeArticle({ id: 'a1', category: 'thoi-su' }),
      makeArticle({ id: 'a2', category: 'thoi-su' }),
      makeArticle({ id: 'a3', category: 'the-thao' }),
    ]);
    const result = store.related('a1', 5);
    expect(result.map((a) => a.id)).toEqual(['a2']);
  });

  it('trả mảng rỗng khi bài không tồn tại', () => {
    const store = new ArticleStore();
    expect(store.related('khong-co', 5)).toEqual([]);
  });
});

describe('ArticleStore.categories', () => {
  it('đếm số bài theo chuyên mục', () => {
    const store = new ArticleStore();
    store.upsertMany([
      makeArticle({ id: 'a1', category: 'thoi-su' }),
      makeArticle({ id: 'a2', category: 'thoi-su' }),
      makeArticle({ id: 'a3', category: 'the-thao' }),
    ]);
    const categories = store.categories();
    expect(categories.find((c) => c.slug === 'thoi-su')?.count).toBe(2);
    expect(categories.find((c) => c.slug === 'the-thao')?.count).toBe(1);
  });
});
