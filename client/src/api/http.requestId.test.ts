import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import { http, toApiError } from './http';
import { resetRefreshQueue } from './refreshQueue';

function createAdapter(
  handler: (index: number, config: AxiosRequestConfig) => AxiosResponse,
): AxiosAdapter {
  let index = 0;
  return async (config: AxiosRequestConfig) => handler(index++, config);
}

function errorWithRequestId(
  config: AxiosRequestConfig,
  status: number,
  requestId: string,
): AxiosResponse {
  const response = {
    data: { error: { code: 'CONTENT_UNAVAILABLE', message: 'Không lấy được nội dung' } },
    status,
    statusText: 'Error',
    headers: { 'x-request-id': requestId },
    config,
  } as AxiosResponse;

  return Promise.reject(
    Object.assign(new Error(`Request failed with status code ${status}`), {
      isAxiosError: true,
      config,
      response,
      status,
    }),
  ) as unknown as AxiosResponse;
}

describe('http - X-Request-Id khi lỗi', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetRefreshQueue();
    logSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('đọc X-Request-Id từ response lỗi và log kèm để đối chiếu log server', async () => {
    http.defaults.adapter = createAdapter((_index, config) =>
      errorWithRequestId(config, 502, 'req-abc-123'),
    );

    await expect(http.get('/articles/a1/content')).rejects.toBeTruthy();

    const logged = logSpy.mock.calls.map((call: unknown[]) => String(call[0]));
    expect(logged.some((line: string) => line.includes('req-abc-123'))).toBe(true);
    expect(logged.some((line: string) => line.includes('/articles/a1/content'))).toBe(true);
  });

  it('gắn requestId vào ApiError để hiển thị', async () => {
    http.defaults.adapter = createAdapter((_index, config) =>
      errorWithRequestId(config, 502, 'req-xyz'),
    );

    try {
      await http.get('/articles/a1/content');
      expect.unreachable('phải ném lỗi');
    } catch (error) {
      const apiError = toApiError(error);
      expect(apiError.requestId).toBe('req-xyz');
      expect(apiError.message).toContain('req-xyz');
      expect(apiError.code).toBe('CONTENT_UNAVAILABLE');
    }
  });

  it('không log khi request thành công', async () => {
    http.defaults.adapter = createAdapter((_index, config) => ({
      data: { data: [] },
      status: 200,
      statusText: 'OK',
      headers: { 'x-request-id': 'req-ok' },
      config,
    }) as AxiosResponse);

    await http.get('/articles');

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('vẫn log khi lỗi không có X-Request-Id', async () => {
    http.defaults.adapter = createAdapter((_index, config) => {
      const response = {
        data: { error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config,
      } as AxiosResponse;

      return Promise.reject(
        Object.assign(new Error('Request failed with status code 404'), {
          isAxiosError: true,
          config,
          response,
          status: 404,
        }),
      ) as unknown as AxiosResponse;
    });

    await expect(http.get('/articles/xyz')).rejects.toBeTruthy();

    const logged = logSpy.mock.calls.map((call: unknown[]) => String(call[0]));
    expect(logged.some((line: string) => line.includes('/articles/xyz'))).toBe(true);
  });
});
