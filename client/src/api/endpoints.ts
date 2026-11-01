import { http } from './http';
import type {
  ApiItem,
  ApiList,
  Article,
  ArticleContent,
  Category,
} from '@/types/article';

export async function getCategories(): Promise<Category[]> {
  const response = await http.get<{ data: Category[] }>('/categories');
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

export async function getArticleContent(id: string): Promise<ArticleContent> {
  const response = await http.get<ApiItem<ArticleContent>>(`/articles/${id}/content`);
  return response.data.data;
}
