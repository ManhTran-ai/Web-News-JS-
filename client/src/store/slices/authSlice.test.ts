import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../index';
import { authReducer, setUser, logout, selectCurrentUser, selectIsAuthenticated } from './authSlice';
import type { User } from '@/types/article';

const user: User = {
  id: 'u1',
  fullName: 'Nguyễn Văn A',
  avatar: 'https://cdn.vn/a.jpg',
  email: 'a@example.com',
};

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

describe('authSlice', () => {
  it('trạng thái ban đầu là chưa đăng nhập', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('đăng nhập cập nhật user và trạng thái', () => {
    const store = makeStore();

    store.dispatch(setUser(user));

    expect(selectCurrentUser(store.getState())).toEqual(user);
    expect(selectIsAuthenticated(store.getState())).toBe(true);
  });

  it('đăng xuất xoá user', () => {
    const store = makeStore();

    store.dispatch(setUser(user));
    store.dispatch(logout());

    expect(selectCurrentUser(store.getState())).toBeNull();
    expect(selectIsAuthenticated(store.getState())).toBe(false);
  });

  it('setUser với null đăng xuất', () => {
    const store = makeStore();

    store.dispatch(setUser(user));
    store.dispatch(setUser(null));

    expect(selectIsAuthenticated(store.getState())).toBe(false);
  });
});
