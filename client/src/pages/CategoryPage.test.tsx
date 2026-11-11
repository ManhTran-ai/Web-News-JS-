// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { CategoryPage } from './CategoryPage';
import { renderWithProviders } from '@/test-utils/render';
import type { Article, Category, ListMeta, Source } from '@/types/article';

vi.mock('@/api/endpoints', () => ({
  getLatest: vi.fn(),
  getFeatured: vi.fn(),
  getByCategory: vi.fn(),
  getArticles: vi.fn(),
  getArticleById: vi.fn(),
  getRelated: vi.fn(),
  getRSS: vi.fn(),
  searchArticles: vi.fn(),
  getCategories: vi.fn(),
  getSources: vi.fn(),
}));

const endpoints = await import('@/api/endpoints');

const META: ListMeta = {
  page: 1,
  limit: 20,
  total: 45,
  totalPages: 3,
  updatedAt: '2026-11-08T00:00:00.000Z',
};

const CATEGORIES: Category[] = [{ slug: 'thoi-su', name: 'Thời sự', count: 120 }];

const SOURCES: Source[] = [
  { id: 'vnexpress', name: 'VnExpress', homepage: 'https://vnexpress.net', enabled: true, count: 10, ok: true },
  { id: 'tuoitre', name: 'Tuổi Trẻ', homepage: 'https://tuoitre.vn', enabled: true, count: 8, ok: true },
];

const RSS_XML =
  '<?xml version="1.0"?><rss><channel><item><title>Bài RSS một</title>' +
  '<link>http://localhost/b1</link><pubDate>Mon, 10 Nov 2026 08:00:00 GMT</pubDate>' +
  '<source url="https://vnexpress.net/b1.html">VnExpress</source></item></channel></rss>';

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    title: 'Bài viết trong chuyên mục',
    summary: 'Tóm tắt bài viết',
    link: 'https://vnexpress.net/a1.html',
    sourceId: 'vnexpress',
    source: 'VnExpress',
    category: 'thoi-su',
    publishedAt: '2026-11-08T00:00:00.000Z',
    ...overrides,
  };
}

function renderCategoryPage(initialEntries = ['/chuyen-muc/thoi-su']) {
  return renderWithProviders(
    <Routes>
      <Route path="/chuyen-muc/:slug" element={<CategoryPage />} />
    </Routes>,
    { initialEntries },
  );
}

describe('CategoryPage (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gọi API lấy bài viết theo chuyên mục khi vào trang', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [makeArticle()], meta: META });
    vi.mocked(endpoints.getRSS).mockResolvedValue(RSS_XML);

    const { unmount } = await renderCategoryPage();

    await vi.waitFor(() => {
      expect(endpoints.getArticles).toHaveBeenCalledWith({
        category: 'thoi-su',
        source: undefined,
        page: 1,
        limit: 20,
      });
    });

    await unmount();
  });

  it('hiển thị danh sách bài viết của chuyên mục', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1', title: 'Tin thời sự đáng chú ý' })],
      meta: META,
    });
    vi.mocked(endpoints.getRSS).mockResolvedValue(RSS_XML);

    const { container, unmount } = await renderCategoryPage();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Tin thời sự đáng chú ý');
    });

    expect(container.textContent).toContain('45 bài viết');

    await unmount();
  });

  it('hiển thị nút xem trang kế tiếp theo meta.totalPages', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [makeArticle()], meta: META });
    vi.mocked(endpoints.getRSS).mockResolvedValue(RSS_XML);

    const { container, unmount } = await renderCategoryPage();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Xem trang 2 / 3');
    });

    await unmount();
  });

  it('gọi API lấy feed RSS của chuyên mục', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [makeArticle()], meta: META });
    vi.mocked(endpoints.getRSS).mockResolvedValue(RSS_XML);

    const { container, unmount } = await renderCategoryPage();

    await vi.waitFor(() => {
      expect(endpoints.getRSS).toHaveBeenCalledWith('thoi-su', 20);
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Bài RSS một');
    });

    await unmount();
  });

  it('hiển thị thông báo lỗi khi tải bài viết thất bại', async () => {
    vi.mocked(endpoints.getArticles).mockRejectedValue(new Error('Lỗi mạng'));
    vi.mocked(endpoints.getRSS).mockResolvedValue(RSS_XML);

    const { container, unmount } = await renderCategoryPage();

    await vi.waitFor(() => {
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
    });

    expect(container.textContent).toContain('Thử lại');

    await unmount();
  });

  it('hiển thị trạng thái rỗng khi chuyên mục chưa có bài viết', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [], meta: META });
    vi.mocked(endpoints.getRSS).mockResolvedValue('<rss><channel></channel></rss>');

    const { container, unmount } = await renderCategoryPage();

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Chưa có bài viết');
    });

    await unmount();
  });

  it('lọc theo nguồn khi URL có tham số source', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [makeArticle()], meta: META });
    vi.mocked(endpoints.getRSS).mockResolvedValue(RSS_XML);

    const { unmount } = await renderCategoryPage(['/chuyen-muc/thoi-su?source=vnexpress']);

    await vi.waitFor(() => {
      expect(endpoints.getArticles).toHaveBeenCalledWith({
        category: 'thoi-su',
        source: 'vnexpress',
        page: 1,
        limit: 20,
      });
    });

    await unmount();
  });

  it('lấy danh sách nguồn để đổ bộ lọc', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [makeArticle()], meta: META });
    vi.mocked(endpoints.getRSS).mockResolvedValue(RSS_XML);

    const { container, unmount } = await renderWithProviders(
      <Routes>
        <Route path="/chuyen-muc/:slug" element={<CategoryPage />} />
      </Routes>,
      {
        initialEntries: ['/chuyen-muc/thoi-su'],
        preloadedState: {
          sources: { items: SOURCES, status: 'succeeded', error: null },
          categories: { items: CATEGORIES, status: 'succeeded', error: null },
        },
      },
    );

    await vi.waitFor(() => {
      expect(container.querySelector('#category-source')).not.toBeNull();
    });

    const select = container.querySelector('#category-source') as HTMLSelectElement;
    const options = Array.from(select.options).map((option) => option.textContent);
    expect(options).toContain('VnExpress');
    expect(options).toContain('Tuổi Trẻ');

    await unmount();
  });

  it('hiển thị tên chuyên mục lấy từ store', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [makeArticle()], meta: META });
    vi.mocked(endpoints.getRSS).mockResolvedValue(RSS_XML);

    const { container, unmount } = await renderWithProviders(
      <Routes>
        <Route path="/chuyen-muc/:slug" element={<CategoryPage />} />
      </Routes>,
      {
        initialEntries: ['/chuyen-muc/thoi-su'],
        preloadedState: {
          categories: { items: CATEGORIES, status: 'succeeded', error: null },
        },
      },
    );

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Thời sự');
    });

    await unmount();
  });
});
