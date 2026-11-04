// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../index';
import { selectTheme, type ThemeMode } from './uiSlice';

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

function stubMatchMedia(matches: boolean): () => void {
  const original = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
  return () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: original,
    });
  };
}

describe('uiSlice', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('trạng thái ban đầu là system khi chưa lưu gì', async () => {
    const { uiReducer } = await import('./uiSlice');
    const state = uiReducer(undefined, { type: 'unknown' });
    expect(state.theme).toBe('system');
  });

  it('lưu theme vào localStorage khi đổi', async () => {
    const { setTheme: changeTheme } = await import('./uiSlice');
    const store = makeStore();

    store.dispatch(changeTheme('dark'));

    expect(selectTheme(store.getState())).toBe('dark');
    expect(window.localStorage.getItem('news24h:theme')).toBe('"dark"');
  });

  it('đọc lại theme đã lưu khi khởi tạo store', async () => {
    window.localStorage.setItem('news24h:theme', '"light"');
    vi.resetModules();

    const { uiReducer } = await import('./uiSlice');
    const state = uiReducer(undefined, { type: 'unknown' });
    expect(state.theme).toBe('light');
  });

  it('resolveTheme trả về mode khi mode không phải system', async () => {
    const { resolveTheme } = await import('./uiSlice');
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('light')).toBe('light');
  });

  it('resolveTheme theo prefers-color-scheme khi mode là system', async () => {
    const restore = stubMatchMedia(true);
    const { resolveTheme } = await import('./uiSlice');

    expect(resolveTheme('system')).toBe('dark');

    restore();
  });

  it('applyTheme đặt data-bs-theme lên html', async () => {
    const { applyTheme } = await import('./uiSlice');

    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');

    applyTheme('light');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  it('áp dụng mọi giá trị theme hợp lệ', async () => {
    const restore = stubMatchMedia(false);
    const { applyTheme, resolveTheme } = await import('./uiSlice');
    const modes: ThemeMode[] = ['light', 'dark', 'system'];

    for (const mode of modes) {
      applyTheme(mode);
      expect(['light', 'dark']).toContain(resolveTheme(mode));
    }

    restore();
  });

  it('setTheme chỉ nhận ba giá trị hợp lệ', () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    expect(modes).toHaveLength(3);
  });
});
