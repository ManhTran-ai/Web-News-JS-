import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorPayload } from '@/types/article';

const RESPONSE_CACHE_LIMIT = 200;

interface CachedResponse {
  etag: string;
  body: unknown;
}

/** Cache ETag + body theo URL để gửi `If-None-Match` và phục hồi khi server trả 304. */
const responseCache = new Map<string, CachedResponse>();

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
  validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
});

function cacheKey(config: InternalAxiosRequestConfig): string {
  const method = (config.method ?? 'get').toUpperCase();
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${method} ${url} ${params}`;
}

http.interceptors.request.use((config) => {
  if ((config.method ?? 'get').toUpperCase() !== 'GET') return config;

  const cached = responseCache.get(cacheKey(config));
  if (cached) {
    config.headers.set('If-None-Match', cached.etag);
  }

  return config;
});

http.interceptors.response.use(
  (response) => {
    const key = cacheKey(response.config);

    if (response.status === 304) {
      const cached = responseCache.get(key);
      if (cached) {
        response.data = cached.body;
        response.status = 200;
        response.headers['x-cache'] = 'revalidated';
        return response;
      }
    }

    const etag = response.headers.etag;
    if (etag) {
      responseCache.delete(key);
      responseCache.set(key, { etag, body: response.data });

      while (responseCache.size > RESPONSE_CACHE_LIMIT) {
        const oldest = responseCache.keys().next().value;
        if (oldest === undefined) break;
        responseCache.delete(oldest);
      }
    }

    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const requestId = error.response.headers['x-request-id'];
      if (requestId) {
        (error as AxiosError & { requestId?: string }).requestId = requestId;
      }
    }
    return Promise.reject(error);
  },
);

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;

  constructor(code: string, message: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const axiosError = error as AxiosError<ApiErrorPayload> | undefined;
  const response = axiosError?.response;

  if (response) {
    const payload = response.data;
    const requestId = (axiosError as AxiosError & { requestId?: string })?.requestId;

    if (payload?.error) {
      return new ApiError(
        payload.error.code,
        payload.error.message,
        response.status,
        requestId,
      );
    }

    return new ApiError(
      'INTERNAL_ERROR',
      'Đã có lỗi xảy ra, vui lòng thử lại',
      response.status,
      requestId,
    );
  }

  if (axiosError?.code === 'ECONNABORTED') {
    return new ApiError('TIMEOUT', 'Yêu cầu quá thời gian chờ, vui lòng thử lại', 0);
  }

  if (axiosError && axiosError.request) {
    return new ApiError('NETWORK_ERROR', 'Không kết nối được tới máy chủ', 0);
  }

  return new ApiError('INTERNAL_ERROR', 'Đã có lỗi xảy ra, vui lòng thử lại', 500);
}
