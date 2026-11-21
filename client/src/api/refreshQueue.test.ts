import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import { http } from './http';
import {
  isRefreshInFlight,
  RefreshCooldownError,
  requestRefreshOnce,
  resetRefreshQueue,
} from './refreshQueue';

interface AdapterCall {
  method: string;
  url: string;
}

function createAdapter(
  handler: (call: AdapterCall, index: number) => AxiosResponse,
): { adapter: AxiosAdapter; calls: AdapterCall[] } {
  const calls: AdapterCall[] = [];

  const adapter: AxiosAdapter = async (config: AxiosRequestConfig) => {
    const call: AdapterCall = {
      method: (config.method ?? 'get').toUpperCase(),
      url: `${config.baseURL ?? ''}${config.url ?? ''}`,
    };
    calls.push(call);
    return handler(call, calls.length - 1);
  };

  return { adapter, calls };
}

function ok(config: AxiosRequestConfig, data: unknown = { data: {} }): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  } as AxiosResponse;
}

function status(config: AxiosRequestConfig, status: number): AxiosResponse {
  const response = {
    data: { error: { code: 'REFRESH_IN_PROGRESS', message: 'Đang làm mới dữ liệu' } },
    status,
    statusText: 'Error',
    headers: {},
    config,
  } as AxiosResponse;

  const error = Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    config,
    response,
    status,
  });

  return Promise.reject(error) as unknown as AxiosResponse;
}

describe('refreshQueue - hàng đợi gọi refresh', () => {
  beforeEach(() => {
    vi.useRealTimers();
    resetRefreshQueue();
  });

  it('gọi POST /refresh đúng một lần khi nhiều caller gọi đồng thời', async () => {
    const { adapter, calls } = createAdapter((_call, index) =>
      ok({} as AxiosRequestConfig, { data: { added: index } }),
    );
    http.defaults.adapter = adapter;

    const results = await Promise.all([
      requestRefreshOnce(),
      requestRefreshOnce(),
      requestRefreshOnce(),
    ]);

    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(results.every((result) => result.added !== undefined)).toBe(true);
  });

  it('trong khoảng thời gian chờ thì không gọi lại refresh', async () => {
    const { adapter, calls } = createAdapter((_call) => ok({} as AxiosRequestConfig));
    http.defaults.adapter = adapter;

    await requestRefreshOnce();
    const countAfterFirst = calls.length;

    await expect(requestRefreshOnce()).rejects.toBeInstanceOf(RefreshCooldownError);
    expect(calls).toHaveLength(countAfterFirst);
  });

  it('thử lại khi server trả 429 rồi mới báo lỗi', async () => {
    vi.useFakeTimers();
    try {
      const { adapter, calls } = createAdapter((_call, index) => {
        if (index === 0) return status({} as AxiosRequestConfig, 429);
        return ok({} as AxiosRequestConfig);
      });
      http.defaults.adapter = adapter;

      const promise = requestRefreshOnce();
      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(calls.filter((call) => call.method === 'POST')).toHaveLength(2);
      expect(result).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('báo lỗi khi server trả 429 liên tục', async () => {
    vi.useFakeTimers();
    try {
      const { adapter, calls } = createAdapter(() => status({} as AxiosRequestConfig, 429));
      http.defaults.adapter = adapter;

      const promise = requestRefreshOnce();
      const assertion = expect(promise).rejects.toBeTruthy();
      await vi.advanceTimersByTimeAsync(20000);
      await assertion;

      expect(calls.filter((call) => call.method === 'POST')).toHaveLength(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it('đánh dấu đang chạy trong lúc refresh', async () => {
    const { adapter } = createAdapter((_call) => ok({} as AxiosRequestConfig));
    http.defaults.adapter = adapter;

    const promise = requestRefreshOnce();
    expect(isRefreshInFlight()).toBe(true);
    await promise;
    expect(isRefreshInFlight()).toBe(false);
  });
});
