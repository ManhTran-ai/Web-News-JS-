import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createApp } from './app.js';

type AppServer = ReturnType<ReturnType<typeof createApp>['listen']>;

let server: AppServer;
let baseUrl: string;

beforeAll(async () => {
  const app = createApp();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Không lấy được cổng server');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

/**
 * Mỗi file test tạo app riêng nên bộ đếm rate limit bắt đầu từ 0.
 */
describe('rate limit luồng quên mật khẩu', () => {
  it('chặn gửi mã bảo mật quá 5 lần/phút', async () => {
    const send = () =>
      fetch(`${baseUrl}/api/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'spam@example.com' }),
      });

    const statuses: number[] = [];
    for (let index = 0; index < 7; index += 1) {
      const response = await send();
      statuses.push(response.status);
    }

    expect(statuses.filter((status) => status === 429)).toHaveLength(2);
    expect(statuses.slice(0, 5).every((status) => status !== 429)).toBe(true);
  });

  it('trả đúng định dạng lỗi khi bị chặn', async () => {
    const response = await fetch(`${baseUrl}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'spam2@example.com' }),
    });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(body.error.message).toBeTruthy();
  });

  it('chặn kiểm tra mã bảo mật quá 10 lần/phút', async () => {
    const send = () =>
      fetch(`${baseUrl}/api/auth/password-reset/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'doan@example.com', code: '000000' }),
      });

    const statuses: number[] = [];
    for (let index = 0; index < 12; index += 1) {
      const response = await send();
      statuses.push(response.status);
    }

    expect(statuses.filter((status) => status === 429)).toHaveLength(2);
  });
});
