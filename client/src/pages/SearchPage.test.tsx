// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { SearchPage } from './SearchPage';
import { renderWithProviders, fireChange } from '@/test-utils/render';
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
  total: 12,
  totalPages: 1,
  updatedAt: '2026-11-08T00:00:00.000Z',
};

const CATEGORIES: Category[] = [{ slug: 'the-thao', name: 'Thể thao', count: 80 }];

const SOURCES: Source[] = [
  {
    id: 'vnexpress',
    name: 'VnExpress',
    homepage: 'https://vnexpress.net',
    enabled: true,
    count: 10,
    ok: true,
  },
];

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    title: 'Kết quả bóng đá',
    summary: 'Tóm tắt',
    link: 'https://vnexpress.net/a1.html',
    sourceId: 'vnexpress',
    source: 'VnExpress',
    category: 'the-thao',
    publishedAt: '2026-11-08T00:00:00.000Z',
    ...overrides,
  };
}

function renderSearchPage(initialEntries = ['/tim-kiem']) {
  return renderWithProviders(
    <Routes>
      <Route path="/tim-kiem" element={<SearchPage />} />
    </Routes>,
    { initialEntries },
  );
}

describe('SearchPage (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị yêu cầu nhập từ khoá khi chưa có từ khoá', async () => {
    const { container, unmount } = await renderSearchPage();

    expect(container.textContent).toContain('Chưa nhập từ khoá');
    expect(endpoints.getArticles).not.toHaveBeenCalled();

    await unmount();
  });

  it('gọi API tìm kiếm khi URL có sẵn từ khoá', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [makeArticle()], meta: META });

    const { unmount } = await renderSearchPage(['/tim-kiem?q=bong+da']);

    await vi.waitFor(() => {
      expect(endpoints.getArticles).toHaveBeenCalledTimes(1);
    });

    expect(vi.mocked(endpoints.getArticles).mock.calls[0]?.[0]).toMatchObject({ q: 'bong da' });

    await unmount();
  });

  it('hiển thị kết quả tìm kiếm và tổng số kết quả', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'a1', title: 'Kết quả bóng đá hôm nay' })],
      meta: META,
    });

    const { container, unmount } = await renderSearchPage(['/tim-kiem?q=bong+da']);

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Kết quả bóng đá hôm nay');
    });

    expect(container.textContent).toContain('Tìm thấy 12 bài viết');

    await unmount();
  });

  it('gắn badge "liên quan cao" cho 3 kết quả đầu', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [
        makeArticle({ id: 'a1', title: 'Kết quả 1' }),
        makeArticle({ id: 'a2', title: 'Kết quả 2' }),
        makeArticle({ id: 'a3', title: 'Kết quả 3' }),
        makeArticle({ id: 'a4', title: 'Kết quả 4' }),
      ],
      meta: META,
    });

    const { container, unmount } = await renderSearchPage(['/tim-kiem?q=bong+da']);

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Kết quả 1');
    });

    const badges = Array.from(container.querySelectorAll('.badge')).filter(
      (badge) => badge.textContent === 'Liên quan cao',
    );
    expect(badges).toHaveLength(3);

    await unmount();
  });

  it('hiển thị trạng thái rỗng khi không có kết quả', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [], meta: META });

    const { container, unmount } = await renderSearchPage(['/tim-kiem?q=khongco']);

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Không tìm thấy kết quả');
    });

    await unmount();
  });

  it('hiển thị thông báo lỗi khi tìm kiếm thất bại', async () => {
    vi.mocked(endpoints.getArticles).mockRejectedValue(new Error('Lỗi mạng'));

    const { container, unmount } = await renderSearchPage(['/tim-kiem?q=bong+da']);

    await vi.waitFor(() => {
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
    });

    await unmount();
  });

  it('hiển thị bộ lọc chuyên mục và nguồn', async () => {
    const { container, unmount } = await renderWithProviders(
      <Routes>
        <Route path="/tim-kiem" element={<SearchPage />} />
      </Routes>,
      {
        initialEntries: ['/tim-kiem'],
        preloadedState: {
          categories: { items: CATEGORIES, status: 'succeeded', error: null },
          sources: { items: SOURCES, status: 'succeeded', error: null },
        },
      },
    );

    const categorySelect = container.querySelector('#search-category') as HTMLSelectElement;
    const sourceSelect = container.querySelector('#search-source') as HTMLSelectElement;

    expect(Array.from(categorySelect.options).map((o) => o.textContent)).toContain('Thể thao');
    expect(Array.from(sourceSelect.options).map((o) => o.textContent)).toContain('VnExpress');

    await unmount();
  });

  it('truyền bộ lọc chuyên mục và nguồn xuống API', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [makeArticle()], meta: META });

    const { unmount } = await renderSearchPage([
      '/tim-kiem?q=bong+da&category=the-thao&source=vnexpress',
    ]);

    await vi.waitFor(() => {
      expect(endpoints.getArticles).toHaveBeenCalledTimes(1);
    });

    expect(vi.mocked(endpoints.getArticles).mock.calls[0]?.[0]).toMatchObject({
      q: 'bong da',
      category: 'the-thao',
      source: 'vnexpress',
    });

    await unmount();
  });

  it('chỉ gọi API một lần khi gõ nhiều từ khoá liên tiếp', async () => {
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [makeArticle()], meta: META });

    const { container, unmount } = await renderSearchPage();

    const input = container.querySelector('#search-keyword') as HTMLInputElement;

    // Gõ từng ký tự — slice tự debounce nên chỉ một request được gửi.
    for (const value of ['b', 'bo', 'bong', 'bong da']) {
      await fireChange(input, value);
    }

    await vi.waitFor(
      () => {
        expect(endpoints.getArticles).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );

    await unmount();
  });
});
