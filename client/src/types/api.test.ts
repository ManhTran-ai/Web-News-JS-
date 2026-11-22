import { describe, expect, it } from 'vitest';
import type {
  ApiErrorBody,
  ApiItemResponse,
  ApiListResponse,
  HealthResponse,
  RefreshResponse,
  RelatedResponse,
  RssResponse,
} from './api';
import type { Article } from './article';

const ARTICLE: Article = {
  id: 'a1',
  title: 'Bài viết',
  summary: 'Tóm tắt',
  link: 'https://vnexpress.net/a1.html',
  sourceId: 'vnexpress',
  source: 'VnExpress',
  category: 'thoi-su',
  publishedAt: '2026-11-08T00:00:00.000Z',
};

const META = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
  updatedAt: '2026-11-08T00:00:00.000Z',
};

describe('types/api - contract', () => {
  it('ApiListResponse chứa data và meta', () => {
    const response: ApiListResponse<Article> = { data: [ARTICLE], meta: META };
    expect(response.data).toHaveLength(1);
    expect(response.meta.totalPages).toBe(1);
  });

  it('ApiItemResponse bọc một phần tử', () => {
    const response: ApiItemResponse<Article> = { data: ARTICLE };
    expect(response.data.id).toBe('a1');
  });

  it('RelatedResponse là danh sách bài kèm meta', () => {
    const response: RelatedResponse = { data: [ARTICLE], meta: META };
    expect(response.data[0]?.source).toBe('VnExpress');
  });

  it('RssResponse giữ XML và danh sách mục', () => {
    const response: RssResponse = {
      xml: '<rss></rss>',
      items: [{ title: 'Bài một', link: 'https://vnexpress.net/b1.html' }],
    };
    expect(response.items[0]?.title).toBe('Bài một');
  });

  it('RefreshResponse chứa summary đầy đủ', () => {
    const response: RefreshResponse = {
      data: {
        startedAt: '2026-11-08T00:00:00.000Z',
        finishedAt: '2026-11-08T00:00:05.000Z',
        added: 12,
        feedsOk: 5,
        feedsFailed: 0,
        sources: [{ id: 'vnexpress', name: 'VnExpress', ok: true, count: 30 }],
      },
    };
    expect(response.data.added).toBe(12);
    expect(response.data.sources[0]?.ok).toBe(true);
  });

  it('ApiErrorBody có mã lỗi và thông báo', () => {
    const body: ApiErrorBody = {
      error: { code: 'CONTENT_UNAVAILABLE', message: 'Không lấy được nội dung' },
    };
    expect(body.error.code).toBe('CONTENT_UNAVAILABLE');
  });

  it('HealthResponse mô tả trạng thái server', () => {
    const response: HealthResponse = {
      status: 'ok',
      uptime: 120,
      lastRefreshAt: null,
      articleCount: 0,
      sources: [],
    };
    expect(response.lastRefreshAt).toBeNull();
  });
});
