import { describe, expect, it, vi, afterEach } from 'vitest';
import { getContent } from './content.service.js';
import type { Article } from '../types/article.js';

const longText = 'Nội dung bài viết chi tiết. '.repeat(60);

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'c1',
    title: 'Bài viết',
    summary: 'Tóm tắt',
    link: 'https://vnexpress.net/bai-1.html',
    sourceId: 'vnexpress',
    source: 'VnExpress',
    category: 'thoi-su',
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeHtml(body: string): string {
  return `<!DOCTYPE html><html><head><title>Bài viết</title>
<meta property="og:image" content="https://cdn.vn/hero.jpg" />
<meta name="author" content="Nguyễn Văn A" />
</head><body>${body}</body></html>`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(body: string): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => body,
    })),
  );
}

describe('getContent', () => {
  it('trích được nội dung từ trang báo', async () => {
    stubFetch(makeHtml(`<article><p>${longText}</p></article>`));

    const content = await getContent(makeArticle({ id: 'c-noi-dung' }));

    expect(content.id).toBe('c-noi-dung');
    expect(content.contentHtml).toContain('Nội dung bài viết chi tiết');
  });

  it('loại bỏ script và iframe khỏi nội dung', async () => {
    stubFetch(
      makeHtml(
        `<article><p>${longText}</p><script>alert(1)</script><iframe src="https://x"></iframe></article>`,
      ),
    );

    const content = await getContent(makeArticle({ id: 'c-script' }));

    expect(content.contentHtml).not.toContain('<script');
    expect(content.contentHtml).not.toContain('<iframe');
    expect(content.contentHtml).not.toContain('onerror');
  });

  it('đổi ảnh lazy thành thuộc tính src', async () => {
    stubFetch(
      makeHtml(`<article><p>${longText}</p><img data-src="https://cdn.vn/lazy.jpg" alt="Ảnh" /></article>`),
    );

    const content = await getContent(makeArticle({ id: 'c-lazy' }));

    expect(content.contentHtml).toContain('src="https://cdn.vn/lazy.jpg"');
  });

  it('ép link ra ngoài mở tab mới', async () => {
    stubFetch(
      makeHtml(`<article><p>${longText}</p><a href="https://vnexpress.net/x">Link</a></article>`),
    );

    const content = await getContent(makeArticle({ id: 'c-link' }));

    expect(content.contentHtml).toContain('target="_blank"');
    expect(content.contentHtml).toContain('rel="noopener noreferrer"');
  });

  it('chặn URL ngoài danh sách nguồn được phép', async () => {
    stubFetch(makeHtml(`<article><p>${longText}</p></article>`));

    await expect(
      getContent(makeArticle({ id: 'c-ssrf', link: 'https://evil.example.com/bai' })),
    ).rejects.toThrow(/tên miền/i);
  });

  it('ném lỗi khi trích không được nội dung', async () => {
    stubFetch(makeHtml('<div>Không có gì</div>'));

    await expect(getContent(makeArticle({ id: 'c-rong' }))).rejects.toThrow();
  });

  it('gộp request trùng lặp chỉ crawl một lần', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => makeHtml(`<article><p>${longText}</p></article>`),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const article = makeArticle({ id: 'c-gop' });
    const [first, second] = await Promise.all([
      getContent(article),
      getContent(article),
    ]);

    expect(first.id).toBe(second.id);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lấy nội dung từ cache ở lần gọi thứ hai', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => makeHtml(`<article><p>${longText}</p></article>`),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const article = makeArticle({ id: 'c-cache' });
    await getContent(article);
    await getContent(article);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('cho phép thử lại sau khi lần trước thất bại', async () => {
    let attempt = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        attempt += 1;
        if (attempt === 1) {
          return { ok: true, status: 200, text: async () => '<div>Rỗng</div>' };
        }
        return {
          ok: true,
          status: 200,
          text: async () => makeHtml(`<article><p>${longText}</p></article>`),
        };
      }),
    );

    const article = makeArticle({ id: 'c-thu-lai' });

    await expect(getContent(article)).rejects.toThrow();
    const content = await getContent(article);
    expect(content.contentHtml).toContain('Nội dung');
  });
});
