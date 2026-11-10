import { describe, expect, it } from 'vitest';
import { cacheService } from './cache.service.js';
import type { ArticleContent } from '../types/article.js';

function makeContent(id: string): ArticleContent {
  return {
    id,
    contentHtml: '<p>Nội dung</p>',
    fetchedAt: new Date().toISOString(),
  };
}

describe('cacheService', () => {
  it('lưu và đọc nội dung theo id', () => {
    cacheService.setContent('b1', makeContent('b1'));
    expect(cacheService.getContent('b1')?.id).toBe('b1');
    expect(cacheService.hasContent('b1')).toBe(true);
  });

  it('trả undefined khi chưa có nội dung', () => {
    expect(cacheService.getContent('khong-ton-tai')).toBeUndefined();
    expect(cacheService.hasContent('khong-ton-tai')).toBe(false);
  });

  it('liệt kê danh sách id đã cache', () => {
    cacheService.setContent('b2', makeContent('b2'));
    expect(cacheService.contentIds().has('b2')).toBe(true);
  });

  it('lưu và xoá cache query', () => {
    cacheService.setQuery('key-1', { value: 1 });
    expect(cacheService.getQuery('key-1')).toEqual({ value: 1 });
    cacheService.clearQuery();
    expect(cacheService.getQuery('key-1')).toBeUndefined();
  });

  it('xoá toàn bộ cache nội dung', () => {
    cacheService.setContent('b3', makeContent('b3'));
    cacheService.clearContent();
    expect(cacheService.getContent('b3')).toBeUndefined();
  });
});
