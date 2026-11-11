import { http } from './http';
import type {
  ApiItem,
  ApiList,
  Article,
  ArticleContent,
  Category,
  Source,
} from '@/types/article';

export async function getCategories(): Promise<Category[]> {
  const response = await http.get<{ data: Category[] }>('/categories');
  return response.data.data;
}

export async function getSources(): Promise<Source[]> {
  const response = await http.get<{ data: Source[] }>('/sources');
  return response.data.data;
}

export async function getLatest(
  limit = 20,
  page = 1,
): Promise<ApiList<Article>> {
  const response = await http.get<ApiList<Article>>('/articles/latest', { params: { limit, page } });
  return response.data;
}

export async function getFeatured(limit = 10): Promise<ApiList<Article>> {
  const response = await http.get<ApiList<Article>>('/articles/featured', { params: { limit } });
  return response.data;
}

export async function getByCategory(
  category: string,
  limit = 20,
  page = 1,
): Promise<ApiList<Article>> {
  const response = await http.get<ApiList<Article>>('/articles', {
    params: { category, limit, page },
  });
  return response.data;
}

export interface ArticleListParams {
  category?: string;
  source?: string;
  q?: string;
  since?: string;
  until?: string;
  page?: number;
  limit?: number;
}

/**
 * Endpoint danh sách tổng hợp — hỗ trợ lọc theo chuyên mục, nguồn, từ khoá và khoảng thời gian.
 * Dùng cho màn hình tìm kiếm vì `/api/search` chỉ nhận `q`.
 */
export async function getArticles(params: ArticleListParams = {}): Promise<ApiList<Article>> {
  const response = await http.get<ApiList<Article>>('/articles', { params });
  return response.data;
}

export async function searchArticles(
  q: string,
  limit = 20,
  page = 1,
): Promise<ApiList<Article>> {
  const response = await http.get<ApiList<Article>>('/search', { params: { q, limit, page } });
  return response.data;
}

export async function getArticleById(id: string): Promise<Article> {
  const response = await http.get<ApiItem<Article>>(`/articles/${id}`);
  return response.data.data;
}

export async function getRelated(id: string, limit = 6): Promise<ApiList<Article>> {
  const response = await http.get<ApiList<Article>>(`/articles/${id}/related`, {
    params: { limit },
  });
  return response.data;
}

export async function getArticleContent(id: string): Promise<ArticleContent> {
  const response = await http.get<ApiItem<ArticleContent>>(`/articles/${id}/content`);
  return response.data.data;
}

/** Endpoint RSS của server — trả về XML để client có thể đăng ký nguồn. */
export async function getRSS(category?: string, limit = 20): Promise<string> {
  const response = await http.get<string>('/articles/rss.xml', {
    params: { category, limit },
    responseType: 'text',
  });
  return response.data;
}