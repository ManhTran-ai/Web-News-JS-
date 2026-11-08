import { describe, expect, it } from 'vitest';
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import { http, toApiError } from './http';

interface AdapterCall {
  url: string;
  headers: Record<string, unknown>;
}

/**
 * Adapter giả lập: lần đầu trả 200 kèm ETag, các lần sau trả 304 nếu client
 * gửi đúng `If-None-Match`.
 */
function createAdapter(): { adapter: AxiosAdapter; calls: AdapterCall[] } {
  const calls: AdapterCall[] = [];
  const etags = new Map<string, string>();

  const adapter: AxiosAdapter = async (config: AxiosRequestConfig) => {
    const key = `${config.baseURL ?? ''}${config.url ?? ''}`;
    const headers = (config.headers ?? {}) as Record<string, unknown>;
    calls.push({ url: key, headers: { ...headers } });

    const stored = etags.get(key);
    const ifNoneMatch = headers['If-None-Match'] ?? headers['if-none-match'];

    if (stored && ifNoneMatch === stored) {
      return {
        data: '',
        status: 304,
        statusText: 'Not Modified',
        headers: { etag: stored },
        config,
      } as AxiosResponse;
    }

    const etag = 'W/"v1"';
    etags.set(key, etag);

    return {
      data: { data: [{ id: 'a1' }], meta: { total: 1 } },
      status: 200,
      statusText: 'OK',
      headers: { etag },
      config,
    } as AxiosResponse;
  };

  return { adapter, calls };
}

describe('http - ETag / 304', () => {
  it('gửi If-None-Match ở request thứ hai và dùng lại body khi server trả 304', async () => {
    const { adapter, calls } = createAdapter();
    http.defaults.adapter = adapter;

    const first = await http.get<{ data: unknown[] }>('/articles', { params: { limit: 20 } });
    expect(first.data).toEqual({ data: [{ id: 'a1' }], meta: { total: 1 } });
    expect(calls[0]?.headers['If-None-Match']).toBeUndefined();

    const second = await http.get<{ data: unknown[] }>('/articles', { params: { limit: 20 } });
    expect(calls[1]?.headers['If-None-Match']).toBe('W/"v1"');
    expect(second.data).toEqual({ data: [{ id: 'a1' }], meta: { total: 1 } });
    expect(second.status).toBe(200);
  });

  it('không dùng chung ETag giữa hai URL khác nhau', async () => {
    const { adapter, calls } = createAdapter();
    http.defaults.adapter = adapter;

    await http.get('/articles', { params: { limit: 20 } });
    await http.get('/articles', { params: { limit: 50 } });

    expect(calls[1]?.headers['If-None-Match']).toBeUndefined();
  });
});

describe('toApiError', () => {
  it('trả về lỗi mặc định khi không nhận được phản hồi', () => {
    const error = toApiError(new Error('boom'));
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).toBeTruthy();
  });

  it('giữ nguyên ApiError đã được chuẩn hoá', () => {
    const original = toApiError({
      response: {
        status: 404,
        data: { error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } },
      },
    });
    const again = toApiError(original);
    expect(again).toBe(original);
    expect(again.code).toBe('NOT_FOUND');
    expect(again.status).toBe(404);
  });

  it('đọc được mã lỗi từ payload của server', () => {
    const error = toApiError({
      response: {
        status: 400,
        data: { error: { code: 'VALIDATION_ERROR', message: 'Thiếu từ khoá' } },
      },
    });
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Thiếu từ khoá');
  });
});
