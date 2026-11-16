import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from './app.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Không lấy được cổng server');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('GET /api/health', () => {
  it('trả về trạng thái server', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.sources).toBeInstanceOf(Array);
  });
});

describe('GET /api/categories', () => {
  it('trả về 11 chuyên mục chuẩn', async () => {
    const response = await fetch(`${baseUrl}/api/categories`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(11);
    expect(body.data[0]).toHaveProperty('slug');
    expect(body.data[0]).toHaveProperty('name');
  });
});

describe('GET /api/sources', () => {
  it('trả về 5 nguồn tin cùng trạng thái', async () => {
    const response = await fetch(`${baseUrl}/api/sources`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(5);
    expect(body.data[0]).toHaveProperty('id');
    expect(body.data[0]).toHaveProperty('homepage');
    expect(body.data[0]).toHaveProperty('enabled');
  });
});

describe('GET /api/articles', () => {
  it('trả về danh sách bài kèm meta phân trang', async () => {
    const response = await fetch(`${baseUrl}/api/articles?page=1&limit=5`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toHaveProperty('page', 1);
    expect(body.meta).toHaveProperty('limit', 5);
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('totalPages');
    expect(body.meta).toHaveProperty('updatedAt');
  });

  it('lọc theo category', async () => {
    const response = await fetch(`${baseUrl}/api/articles?category=thoi-su&limit=5`);
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const article of body.data) {
      expect(article.category).toBe('thoi-su');
    }
  });

  it('lọc theo source', async () => {
    const response = await fetch(`${baseUrl}/api/articles?source=vnexpress&limit=5`);
    const body = await response.json();

    expect(response.status).toBe(200);
    for (const article of body.data) {
      expect(article.sourceId).toBe('vnexpress');
    }
  });

  it('tìm kiếm theo từ khoá', async () => {
    const response = await fetch(`${baseUrl}/api/articles?q=viet%20nam&limit=5`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('từ chối limit vượt quá giới hạn', async () => {
    const response = await fetch(`${baseUrl}/api/articles?limit=500`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBeTruthy();
  });

  it('từ chối page không hợp lệ', async () => {
    const response = await fetch(`${baseUrl}/api/articles?page=0`);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/articles/latest', () => {
  it('trả về bài mới nhất', async () => {
    const response = await fetch(`${baseUrl}/api/articles/latest?limit=5`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta).toHaveProperty('limit', 5);
  });
});

describe('GET /api/articles/featured', () => {
  it('trả về bài nổi bật', async () => {
    const response = await fetch(`${baseUrl}/api/articles/featured?limit=3`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta).toHaveProperty('limit', 3);
  });
});

describe('GET /api/articles/:id', () => {
  it('trả 404 với id không tồn tại', async () => {
    const response = await fetch(`${baseUrl}/api/articles/khong-ton-tai`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/articles/:id/related', () => {
  it('trả 404 với id không tồn tại', async () => {
    const response = await fetch(`${baseUrl}/api/articles/khong-ton-tai/related`);
    expect(response.status).toBe(404);
  });
});

describe('GET /api/articles/:id/content', () => {
  it('trả 404 với id không tồn tại', async () => {
    const response = await fetch(`${baseUrl}/api/articles/khong-ton-tai/content`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/search', () => {
  it('trả về kết quả tìm kiếm', async () => {
    const response = await fetch(`${baseUrl}/api/search?q=viet&limit=5`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('từ chối từ khoá rỗng', async () => {
    const response = await fetch(`${baseUrl}/api/search?q=`);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/articles/rss.xml', () => {
  it('trả về RSS hợp lệ', async () => {
    const response = await fetch(`${baseUrl}/api/articles/rss.xml?limit=3`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('rss+xml');
    expect(body).toContain('<rss');
    expect(body).toContain('<channel>');
  });
});

describe('route không tồn tại', () => {
  it('trả 404 với định dạng lỗi chuẩn', async () => {
    const response = await fetch(`${baseUrl}/api/khong-co`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBeTruthy();
  });
});

describe('header bảo mật', () => {
  it('không lộ công nghệ server', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.headers.get('x-powered-by')).toBeNull();
  });

  it('có X-Request-Id cho mỗi request', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });
});

describe('cache ETag', () => {
  it('trả 304 khi If-None-Match khớp', async () => {
    const first = await fetch(`${baseUrl}/api/articles/latest?limit=5`);
    const etag = first.headers.get('etag');

    expect(etag).toBeTruthy();
    expect(first.headers.get('cache-control')).toContain('max-age');

    const second = await fetch(`${baseUrl}/api/articles/latest?limit=5`, {
      headers: { 'If-None-Match': etag as string },
    });

    expect(second.status).toBe(304);
  });

  it('trả 200 khi nội dung thay đổi', async () => {
    const response = await fetch(`${baseUrl}/api/articles/latest?limit=5`, {
      headers: { 'If-None-Match': 'W/"khong-ton-tai"' },
    });

    expect(response.status).toBe(200);
  });
});
