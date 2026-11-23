import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import type { Server } from 'node:http';

describe('request context middleware', () => {
  it('gán X-Request-Id và log thời gian xử lý', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const app = createApp();

    const server: Server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('No port');
      const base = `http://127.0.0.1:${address.port}`;

      const response = await fetch(`${base}/api/health`);
      const requestId = response.headers.get('x-request-id');

      expect(requestId).toBeTruthy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const logged = logSpy.mock.calls.some(
        (call) => typeof call[0] === 'string' && call[0].includes('[request]'),
      );
      expect(logged).toBe(true);
    } finally {
      logSpy.mockRestore();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('giữ nguyên X-Request-Id do client gửi lên', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const app = createApp();

    const server: Server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('No port');
      const base = `http://127.0.0.1:${address.port}`;

      const response = await fetch(`${base}/api/health`, {
        headers: { 'x-request-id': 'abc-123' },
      });

      expect(response.headers.get('x-request-id')).toBe('abc-123');
    } finally {
      vi.restoreAllMocks();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
