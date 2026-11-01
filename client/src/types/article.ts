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

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

export interface Source {
  id: string;
  name: string;
  homepage: string;
  enabled: boolean;
  count: number;
  ok: boolean;
  error?: string;
}

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
