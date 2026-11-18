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

describe('POST /api/auth/password-reset/request', () => {
  it('từ chối email sai định dạng', async () => {
    const response = await fetch(`${baseUrl}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'khong-phai-email' }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('báo chưa cấu hình SMTP khi thiếu thông tin mail', async () => {
    const response = await fetch(`${baseUrl}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@example.com' }),
    });
    const body = await response.json();

    // Mail có thể đã được cấu hình trong .env — khi đó endpoint sẽ thử gửi thật.
    if (response.status === 503) {
      expect(body.error.code).toBe('MAIL_NOT_CONFIGURED');
      return;
    }

    expect([200, 502]).toContain(response.status);
    // Không bao giờ trả về mã bảo mật cho client.
    expect(JSON.stringify(body)).not.toMatch(/"\d{6}"/);
  });
});

describe('POST /api/auth/password-reset/verify', () => {
  it('từ chối thiếu mã bảo mật', async () => {
    const response = await fetch(`${baseUrl}/api/auth/password-reset/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@example.com' }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('báo không có yêu cầu khi email chưa từng yêu cầu mã', async () => {
    const response = await fetch(`${baseUrl}/api/auth/password-reset/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'khong-ton-tai@example.com', code: '123456' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('RESET_NOT_FOUND');
  });
});
