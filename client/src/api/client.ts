import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { requestRefreshOnce } from './refreshQueue';

const RESPONSE_CACHE_LIMIT = 200;
const RETRIABLE_STATUSES = new Set([500, 502, 503, 504]);
const RETRY_AFTER_REFRESH_HEADER = 'X-Retry-After-Refresh';

interface CachedResponse {
  etag?: string;
  body: unknown;
}

const responseCache = new Map<string, CachedResponse>();

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
  validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
});

export function cacheKey(config: InternalAxiosRequestConfig): string {
  const method = (config.method ?? 'get').toUpperCase();
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${method} ${url} ${params}`;
}

export function isOfflineError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (error.response) return false;
  return error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
}

function shouldRefreshAndRetry(error: unknown, config: InternalAxiosRequestConfig): boolean {
  if ((config.method ?? 'get').toUpperCase() !== 'GET') return false;
  if (config.headers?.get(RETRY_AFTER_REFRESH_HEADER) === '1') return false;
  if (isOfflineError(error)) return false;

  const status = (error as AxiosError | undefined)?.response?.status;
  if (status === undefined) return true;
  return RETRIABLE_STATUSES.has(status);
}

http.interceptors.request.use((config) => {
  if ((config.method ?? 'get').toUpperCase() !== 'GET') return config;

  const cached = responseCache.get(cacheKey(config));
  if (cached?.etag) {
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

    if ((response.config.method ?? 'get').toUpperCase() === 'GET') {
      const etag = response.headers.etag;
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
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const requestId = error.response.headers['x-request-id'];
      if (requestId) {
        (error as AxiosError & { requestId?: string }).requestId = requestId;
      }
    }

    const config = (error as AxiosError | undefined)?.config;
    logApiError(error, config);

    if (config && isOfflineError(error)) {
      const cached = responseCache.get(cacheKey(config));
      if (cached) {
        return Promise.resolve({
          data: cached.body,
          status: 200,
          statusText: 'OK',
          headers: { 'x-cache': 'offline' },
          config,
        } as AxiosResponse);
      }
    }

    if (config && shouldRefreshAndRetry(error, config)) {
      config.headers = AxiosHeaders.from(config.headers);
      config.headers.set(RETRY_AFTER_REFRESH_HEADER, '1');
      try {
        await requestRefreshOnce();
      } catch {
        return Promise.reject(error);
      }
      return http.request(config);
    }

    return Promise.reject(error);
  },
);

export function clearResponseCache(): void {
  responseCache.clear();
}

export function logApiError(error: unknown, config?: InternalAxiosRequestConfig): void {
  const axiosError = error as AxiosError | undefined;
  const requestId = (axiosError as AxiosError & { requestId?: string })?.requestId;
  const status = axiosError?.response?.status;
  const method = (config?.method ?? 'get').toUpperCase();
  const url = `${config?.baseURL ?? ''}${config?.url ?? ''}`;

  if (requestId) {
    console.error(
      `[api] ${method} ${url} thất bại (${status ?? 'không có phản hồi'}) — X-Request-Id: ${requestId}`,
    );
    return;
  }

  console.error(`[api] ${method} ${url} thất bại (${status ?? 'không có phản hồi'})`);
}
