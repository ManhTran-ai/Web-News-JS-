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

export type { ApiErrorBody, ApiErrorCode, ApiErrorPayload } from './api';
export type { ApiItemResponse as ApiItem, ApiListResponse as ApiList } from './api';

export interface Source {
  id: string;
  name: string;
  homepage: string;
  enabled: boolean;
  count: number;
  ok: boolean;
  error?: string;
  feeds?: { category: string; url: string }[];
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

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
