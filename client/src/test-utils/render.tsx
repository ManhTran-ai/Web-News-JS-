import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { rootReducer, type RootState } from '@/store';

// `act` trong React 19 yêu cầu cờ này khi chạy ngoài môi trường test của React.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const testReducer = combineReducers(rootReducer);

export type TestStore = ReturnType<typeof makeTestStore>;

export interface RenderOptions {
  /** Đường dẫn ban đầu cho router (vd. `/tim-kiem?q=bong+da`). */
  initialEntries?: string[];
  /** State khởi tạo cho store. */
  preloadedState?: Partial<RootState>;
}

export interface RenderResult {
  container: HTMLElement;
  store: TestStore;
  rerender: (ui: ReactNode) => Promise<void>;
  unmount: () => Promise<void>;
}

/** Tạo store thật (dùng `rootReducer`) để test chạy đúng luồng Redux của ứng dụng. */
export function makeTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: testReducer,
    preloadedState,
  });
}

/**
 * Render một cây component kèm Provider (Redux) và MemoryRouter.
 * Dùng `vi.mock` của Vitest để chặn `api/endpoints` — repo không cài MSW.
 */
export async function renderWithProviders(
  ui: ReactNode,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const { initialEntries = ['/'], preloadedState } = options;

  const store = makeTestStore(preloadedState);
  const container = document.createElement('div');
  document.body.appendChild(container);

  let root: Root;
  await act(async () => {
    root = createRoot(container);
    root.render(
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </Provider>,
    );
  });

  return {
    container,
    store,
    rerender: async (next: ReactNode) => {
      await act(async () => {
        root.render(
          <Provider store={store}>
            <MemoryRouter initialEntries={initialEntries}>{next}</MemoryRouter>
          </Provider>,
        );
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

export interface RenderHookResult<T, P = undefined> {
  /** Giá trị trả về mới nhất của hook. */
  result: () => T;
  /** Đếm số lần hook đã render — dùng để kiểm tra memo/khác biệt. */
  renderCount: () => number;
  /** Render lại với props mới (hook nhận props làm tham số). */
  rerender: (props?: P) => Promise<void>;
  unmount: () => Promise<void>;
}

/** Render một hook độc lập và trả về giá trị của nó. */
export async function renderHook<T, P = undefined>(
  hook: (props: P) => T,
  options: { initialProps?: P } = {},
): Promise<RenderHookResult<T, P>> {
  const values: T[] = [];
  let currentProps = options.initialProps as P;

  function Probe(props: Record<string, unknown>): null {
    values.push(hook(props as unknown as P));
    return null;
  }

  const toProps = (props: P): Record<string, unknown> =>
    (props ?? {}) as unknown as Record<string, unknown>;

  const container = document.createElement('div');
  document.body.appendChild(container);

  let root: Root;
  await act(async () => {
    root = createRoot(container);
    root.render(<Probe {...toProps(currentProps)} />);
  });

  return {
    result: () => values[values.length - 1] as T,
    renderCount: () => values.length,
    rerender: async (props?: P) => {
      if (props !== undefined) currentProps = props;
      await act(async () => {
        root.render(<Probe {...toProps(currentProps)} />);
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/**
 * Chạy các timer đang được lên lịch trong khoảng `ms`.
 * Bọc trong `act` để React flush được các cập nhật state phát sinh từ timer.
 */
export async function tick(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/** Chờ các promise đã lên lịch (ví dụ trong effect) hoàn tất. */
export async function flushPromises(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}
