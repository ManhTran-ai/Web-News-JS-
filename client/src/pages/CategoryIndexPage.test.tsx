// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryIndexPage } from './CategoryIndexPage';
import { renderWithProviders } from '@/test-utils/render';
import type { Article, Category, ListMeta } from '@/types/article';

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
  total: 1,
  totalPages: 1,
  updatedAt: '2026-11-08T00:00:00.000Z',
};

const CATEGORIES: Category[] = [
  { slug: 'thoi-su', name: 'Thời sự', count: 120 },
  { slug: 'the-thao', name: 'Thể thao', count: 80 },
];

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    title: 'Bài viết đại diện',
    summary: 'Tóm tắt bài viết',
    link: 'https://vnexpress.net/a1.html',
    sourceId: 'vnexpress',
    source: 'VnExpress',
    category: 'thoi-su',
    publishedAt: '2026-11-08T00:00:00.000Z',
    ...overrides,
  };
}

describe('CategoryIndexPage (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gọi API lấy danh sách chuyên mục khi vào trang', async () => {
    vi.mocked(endpoints.getCategories).mockResolvedValue(CATEGORIES);
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [], meta: META });

    const { unmount } = await renderWithProviders(<CategoryIndexPage />);

    expect(endpoints.getCategories).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it('hiển thị tên và số bài viết của từng chuyên mục', async () => {
    vi.mocked(endpoints.getCategories).mockResolvedValue(CATEGORIES);
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [], meta: META });

    const { container, unmount } = await renderWithProviders(<CategoryIndexPage />);

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Thời sự');
    });

    expect(container.textContent).toContain('120 bài viết');
    expect(container.textContent).toContain('Thể thao');
    expect(container.textContent).toContain('80 bài viết');

    await unmount();
  });

  it('gọi API lấy bài mới nhất đại diện cho mỗi chuyên mục', async () => {
    vi.mocked(endpoints.getCategories).mockResolvedValue(CATEGORIES);
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle()],
      meta: META,
    });

    const { unmount } = await renderWithProviders(<CategoryIndexPage />);

    await vi.waitFor(() => {
      expect(endpoints.getArticles).toHaveBeenCalledTimes(2);
    });

    expect(endpoints.getArticles).toHaveBeenCalledWith({
      category: 'thoi-su',
      page: 1,
      limit: 1,
    });
    expect(endpoints.getArticles).toHaveBeenCalledWith({
      category: 'the-thao',
      page: 1,
      limit: 1,
    });

    await unmount();
  });

  it('hiển thị tiêu đề bài mới nhất đại diện', async () => {
    vi.mocked(endpoints.getCategories).mockResolvedValue(CATEGORIES);
    vi.mocked(endpoints.getArticles).mockResolvedValue({
      data: [makeArticle({ id: 'rep-1', title: 'Bài tiêu điểm của chuyên mục' })],
      meta: META,
    });

    const { container, unmount } = await renderWithProviders(<CategoryIndexPage />);

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Bài tiêu điểm của chuyên mục');
    });

    await unmount();
  });

  it('không gọi lại API chuyên mục khi đã có trong store', async () => {
    vi.mocked(endpoints.getCategories).mockResolvedValue(CATEGORIES);
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [], meta: META });

    const { unmount } = await renderWithProviders(<CategoryIndexPage />, {
      preloadedState: {
        categories: { items: CATEGORIES, status: 'succeeded', error: null },
      },
    });

    expect(endpoints.getCategories).not.toHaveBeenCalled();

    await unmount();
  });

  it('hiển thị trạng thái chờ khi danh sách chuyên mục chưa về', async () => {
    vi.mocked(endpoints.getCategories).mockImplementation(() => new Promise(() => {}));
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [], meta: META });

    const { container, unmount } = await renderWithProviders(<CategoryIndexPage />);

    expect(container.textContent).toContain('Đang tải danh sách chuyên mục');

    await unmount();
  });

  it('mỗi chuyên mục có liên kết tới trang chi tiết', async () => {
    vi.mocked(endpoints.getCategories).mockResolvedValue(CATEGORIES);
    vi.mocked(endpoints.getArticles).mockResolvedValue({ data: [], meta: META });

    const { container, unmount } = await renderWithProviders(<CategoryIndexPage />);

    await vi.waitFor(() => {
      expect(container.querySelector('a[href="/chuyen-muc/thoi-su"]')).not.toBeNull();
    });

    expect(container.querySelector('a[href="/chuyen-muc/the-thao"]')).not.toBeNull();

    await unmount();
  });
});
