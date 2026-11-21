import type { Article, ListMeta } from './article';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONTENT_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED'
  | 'REFRESH_IN_PROGRESS'
  | 'TIMEOUT'
  | 'NETWORK_ERROR';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode | string;
    message: string;
  };
}

export type ApiErrorPayload = ApiErrorBody;

export interface ApiListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface RelatedResponse extends ApiListResponse<Article> {
  data: Article[];
}

export interface RssFeedItem {
  title: string;
  link: string;
  publishedAt?: string;
  source?: string;
  description?: string;
}

export interface RssResponse {
  xml: string;
  items: RssFeedItem[];
}

export interface RefreshSourceStatus {
  id: string;
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface RefreshSummary {
  startedAt: string;
  finishedAt: string;
  added: number;
  feedsOk: number;
  feedsFailed: number;
  sources: RefreshSourceStatus[];
}

export interface RefreshResponse {
  data: RefreshSummary;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  lastRefreshAt: string | null;
  articleCount: number;
  sources: RefreshSourceStatus[];
}
