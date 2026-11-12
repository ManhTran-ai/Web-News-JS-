export interface Article {
  id: string;
  title: string;
  summary: string;
  thumbnail?: string;
  link: string;
  sourceId: string;
  source: string;
  category: string;
  publishedAt: string;
}

export interface Category {
  slug: string;
  name: string;
  count: number;
}

export interface ArticleContent {
  id: string;
  contentHtml: string;
  author?: string;
  leadImage?: string;
  fetchedAt: string;
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  updatedAt: string;
}

export interface ApiList<T> {
  data: T[];
  meta: ListMeta;
}

export interface ApiItem<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export type ApiErrorPayload = ApiError;

export interface SourceStatus {
  id: string;
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface User {
  id: string;
  fullName: string;
  avatar?: string;
  email?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  user?: User;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  likes?: number;
  replies?: Comment[];
}
