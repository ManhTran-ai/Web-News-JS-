import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_SLUGS, isCategorySlug } from './categories.js';
import { SOURCES, isAllowedDomain, findSourceById, enabledSources } from './sources.js';

describe('CATEGORIES', () => {
  it('có đúng 11 chuyên mục chuẩn', () => {
    expect(CATEGORIES).toHaveLength(11);
  });

  it('mọi slug đều duy nhất', () => {
    expect(new Set(CATEGORY_SLUGS).size).toBe(CATEGORY_SLUGS.length);
  });

  it('mọi chuyên mục có tên hiển thị', () => {
    for (const category of CATEGORIES) {
      expect(category.name.length).toBeGreaterThan(0);
    }
  });

  it('isCategorySlug nhận diện đúng slug', () => {
    expect(isCategorySlug('thoi-su')).toBe(true);
    expect(isCategorySlug('khong-ton-tai')).toBe(false);
  });
});

describe('SOURCES', () => {
  it('có 5 nguồn tin', () => {
    expect(SOURCES).toHaveLength(5);
  });

  it('mọi nguồn có id và tên duy nhất', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    expect(new Set(SOURCES.map((s) => s.name)).size).toBe(SOURCES.length);
  });

  it('mọi nguồn có ít nhất một feed', () => {
    for (const source of SOURCES) {
      expect(source.feeds.length).toBeGreaterThan(0);
    }
  });

  it('mọi feed dùng chuyên mục hợp lệ', () => {
    for (const source of SOURCES) {
      for (const feed of source.feeds) {
        expect(feed.category === 'tong-hop' || isCategorySlug(feed.category)).toBe(true);
      }
    }
  });

  it('mọi feed dùng URL https', () => {
    for (const source of SOURCES) {
      for (const feed of source.feeds) {
        expect(feed.url.startsWith('https://')).toBe(true);
      }
    }
  });

  it('không trùng URL feed trong cùng một nguồn', () => {
    for (const source of SOURCES) {
      const urls = source.feeds.map((f) => f.url);
      expect(new Set(urls).size).toBe(urls.length);
    }
  });

  it('mọi nguồn đều phủ đủ 11 chuyên mục chuẩn', () => {
    for (const source of SOURCES) {
      const covered = new Set(
        source.feeds.map((f) => f.category).filter((c): c is string => c !== 'tong-hop'),
      );
      for (const slug of CATEGORY_SLUGS) {
        expect(covered.has(slug)).toBe(true);
      }
    }
  });

  it('findSourceById trả đúng nguồn', () => {
    expect(findSourceById('vnexpress')?.name).toBe('VnExpress');
    expect(findSourceById('khong-co')).toBeUndefined();
  });

  it('enabledSources trả về các nguồn đang bật', () => {
    expect(enabledSources().length).toBeGreaterThan(0);
    for (const source of enabledSources()) {
      expect(source.enabled).toBe(true);
    }
  });
});

describe('isAllowedDomain', () => {
  it('cho phép domain của nguồn tin', () => {
    expect(isAllowedDomain('https://vnexpress.net/bai-1.html')).toBe(true);
    expect(isAllowedDomain('https://tuoitre.vn/bai-1.html')).toBe(true);
    expect(isAllowedDomain('https://thanhnien.vn/bai-1.html')).toBe(true);
    expect(isAllowedDomain('https://dantri.com.vn/bai-1.html')).toBe(true);
    expect(isAllowedDomain('https://vietnamnet.vn/bai-1.html')).toBe(true);
  });

  it('cho phép sub-domain', () => {
    expect(isAllowedDomain('https://news.vnexpress.net/bai-1.html')).toBe(true);
  });

  it('chặn domain lạ', () => {
    expect(isAllowedDomain('https://evil.example.com/bai-1.html')).toBe(false);
  });

  it('chặn URL giả mạo chứa domain hợp lệ', () => {
    expect(isAllowedDomain('https://vnexpress.net.evil.com/bai-1.html')).toBe(false);
  });

  it('chặn URL không hợp lệ', () => {
    expect(isAllowedDomain('khong-phai-url')).toBe(false);
  });
});
