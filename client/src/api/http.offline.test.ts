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

function ok(config: AxiosRequestConfig, data: unknown, etag?: string): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: etag ? { etag } : {},
    config,
  } as AxiosResponse;
}

function notModified(config: AxiosRequestConfig, etag: string): AxiosResponse {
  return {
    data: '',
    status: 304,
    statusText: 'Not Modified',
    headers: { etag },
    config,
  } as AxiosResponse;
}

function offline(config: AxiosRequestConfig): AxiosResponse {
  return Promise.reject(
    Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      config,
      request: {},
    }),
  ) as unknown as AxiosResponse;
}

describe('http - 304 và cache khi offline', () => {
  beforeEach(() => {
    resetRefreshQueue();
  });

  it('trả cache cũ khi server trả 304', async () => {
    const etag = 'W/"v1"';
    const body = { data: [{ id: 'a1' }] };
    const { adapter, calls } = createAdapter((_call, index, config) =>
      index === 0 ? ok(config, body, etag) : notModified(config, etag),
    );
    http.defaults.adapter = adapter;

    await http.get('/articles', { params: { limit: 20 } });
    const second = await http.get('/articles', { params: { limit: 20 } });

    expect(second.status).toBe(200);
    expect(second.data).toEqual(body);
    expect(second.headers['x-cache']).toBe('revalidated');
    expect(calls).toHaveLength(2);
  });

  it('trả cache cũ khi mất mạng', async () => {
    const body = { data: [{ id: 'a1' }] };
    const { adapter, calls } = createAdapter((_call, index, config) =>
      index === 0 ? ok(config, body, 'W/"v1"') : offline(config),
    );
    http.defaults.adapter = adapter;

    await http.get('/articles', { params: { limit: 20 } });
    const second = await http.get('/articles', { params: { limit: 20 } });

    expect(second.status).toBe(200);
    expect(second.data).toEqual(body);
    expect(second.headers['x-cache']).toBe('offline');
    expect(calls).toHaveLength(2);
  });

  it('báo lỗi mạng khi chưa có cache nào', async () => {
    const { adapter } = createAdapter((_call, _index, config) => offline(config));
    http.defaults.adapter = adapter;

    await expect(http.get('/articles/never-cached')).rejects.toBeTruthy();
  });

  it('cache theo từng URL riêng biệt', async () => {
    const { adapter } = createAdapter((call, index, config) => {
      if (index === 0) return ok(config, { data: [call.url] }, 'W/"v1"');
      return offline(config);
    });
    http.defaults.adapter = adapter;

    await http.get('/articles', { params: { limit: 20 } });

    await expect(http.get('/articles', { params: { limit: 50 } })).rejects.toBeTruthy();
  });
});
