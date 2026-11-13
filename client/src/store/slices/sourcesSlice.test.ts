import { describe, expect, it, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../index';
import { sourcesReducer, fetchSources, selectSources, selectSourcesStatus } from './sourcesSlice';
import type { Source } from '@/types/article';

vi.mock('@/api/endpoints', () => ({
  getSources: vi.fn(),
}));

const { getSources } = await import('@/api/endpoints');

const source: Source = {
  id: 'vnexpress',
  name: 'VnExpress',
  homepage: 'https://vnexpress.net',
  enabled: true,
  count: 120,
  ok: true,
};

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

describe('sourcesSlice', () => {
  beforeEach(() => {
    vi.mocked(getSources).mockReset();
  });

  it('trạng thái ban đầu là idle và rỗng', () => {
    const state = sourcesReducer(undefined, { type: 'unknown' });
    expect(state.items).toHaveLength(0);
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  it('lưu danh sách nguồn tin khi tải thành công', async () => {
    vi.mocked(getSources).mockResolvedValue([source]);
    const store = makeStore();

    await store.dispatch(fetchSources());

    expect(selectSourcesStatus(store.getState())).toBe('succeeded');
    expect(selectSources(store.getState())).toHaveLength(1);
    expect(selectSources(store.getState())[0]?.id).toBe('vnexpress');
  });

  it('ghi lỗi khi tải thất bại', async () => {
    vi.mocked(getSources).mockRejectedValue(new Error('Mạng lỗi'));
    const store = makeStore();

    await store.dispatch(fetchSources());

    expect(selectSourcesStatus(store.getState())).toBe('failed');
    expect(selectSources(store.getState())).toHaveLength(0);
  });

  it('không gọi lại API khi đã có dữ liệu', async () => {
    vi.mocked(getSources).mockResolvedValue([source]);
    const store = makeStore();

    await store.dispatch(fetchSources());
    await store.dispatch(fetchSources());

    expect(getSources).toHaveBeenCalledTimes(2);
  });
});
