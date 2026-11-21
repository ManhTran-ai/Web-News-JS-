import { describe, expect, it, beforeEach } from 'vitest';
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import { http } from './http';
import { resetRefreshQueue } from './refreshQueue';

interface AdapterCall {
  method: string;
  url: string;
}

function createAdapter(
  handler: (call: AdapterCall, index: number, config: AxiosRequestConfig) => AxiosResponse,
): { adapter: AxiosAdapter; calls: AdapterCall[] } {
  const calls: AdapterCall[] = [];

  const adapter: AxiosAdapter = async (config: AxiosRequestConfig) => {
    const call: AdapterCall = {
      method: (config.method ?? 'get').toUpperCase(),
      url: `${config.baseURL ?? ''}${config.url ?? ''}`,
    };
    calls.push(call);
    return handler(call, calls.length - 1, config);
  };

  return { adapter, calls };
}

function ok(config: AxiosRequestConfig, data: unknown = { data: [] }): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  } as AxiosResponse;
}

function fail(config: AxiosRequestConfig, status: number): AxiosResponse {
  const response = {
    data: { error: { code: 'INTERNAL_ERROR', message: 'Lỗi' } },
    status,
    statusText: 'Error',
    headers: {},
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

describe('http - gọi refresh rồi thử lại khi request lỗi', () => {
  beforeEach(() => {
    resetRefreshQueue();
  });

  it('gọi POST /refresh rồi thử lại request GET bị lỗi 503', async () => {
    const { adapter, calls } = createAdapter((call, index, config) => {
      if (call.method === 'POST') return ok(config, { data: { added: 1 } });
      if (index === 0) return fail(config, 503);
      return ok(config);
    });
    http.defaults.adapter = adapter;

    const response = await http.get('/articles');

    expect(response.status).toBe(200);
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(calls.filter((call) => call.method === 'GET')).toHaveLength(2);
  });

  it('không thử lại quá một lần khi server tiếp tục lỗi', async () => {
    const { adapter, calls } = createAdapter((call, _index, config) => {
      if (call.method === 'POST') return ok(config, { data: { added: 1 } });
      return fail(config, 503);
    });
    http.defaults.adapter = adapter;

    await expect(http.get('/articles')).rejects.toBeTruthy();
    expect(calls.filter((call) => call.method === 'GET')).toHaveLength(2);
  });

  it('không gọi refresh khi request lỗi 404', async () => {
    const { adapter, calls } = createAdapter((call, _index, config) => {
      if (call.method === 'POST') return ok(config, { data: { added: 1 } });
      return fail(config, 404);
    });
    http.defaults.adapter = adapter;

    await expect(http.get('/articles/a1')).rejects.toBeTruthy();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
    expect(calls.filter((call) => call.method === 'GET')).toHaveLength(1);
  });

  it('không gọi refresh cho request không phải GET', async () => {
    const { adapter, calls } = createAdapter((call, _index, config) => {
      if (call.url.endsWith('/refresh')) return ok(config, { data: { added: 1 } });
      return fail(config, 503);
    });
    http.defaults.adapter = adapter;

    await expect(http.post('/auth/password-reset/request')).rejects.toBeTruthy();
    expect(calls.filter((call) => call.url.endsWith('/refresh'))).toHaveLength(0);
  });

  it('báo lỗi gốc khi refresh không thành công', async () => {
    const { adapter, calls } = createAdapter((call, _index, config) => {
      if (call.method === 'POST') return fail(config, 500);
      return fail(config, 503);
    });
    http.defaults.adapter = adapter;

    await expect(http.get('/articles')).rejects.toBeTruthy();
    expect(calls.filter((call) => call.method === 'GET')).toHaveLength(1);
  });

  it('nhiều request lỗi cùng lúc chỉ gọi refresh một lần', async () => {
    const { adapter, calls } = createAdapter((call, index, config) => {
      if (call.method === 'POST') return ok(config, { data: { added: 1 } });
      if (index < 2) return fail(config, 503);
      return ok(config);
    });
    http.defaults.adapter = adapter;

    await Promise.all([http.get('/articles/a'), http.get('/articles/b'), http.get('/articles/c')]);

    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
  });
});
