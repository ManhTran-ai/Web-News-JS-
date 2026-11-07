// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../index';
import {
  authReducer,
  login,
  register,
  logout,
  clearAuthError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthError,
  validateCredentials,
  validateRegister,
} from './authSlice';

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

describe('authSlice', () => {
  it('trạng thái ban đầu là chưa đăng nhập', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('đăng ký tạo tài khoản và đăng nhập được', () => {
    const store = makeStore();
    const email = `user-${Date.now()}@example.com`;

    store.dispatch(register({ fullName: 'Nguyễn Văn A', email, password: 'matkhau123' }));

    expect(selectIsAuthenticated(store.getState())).toBe(true);
    expect(selectCurrentUser(store.getState())?.email).toBe(email);

    store.dispatch(logout());
    store.dispatch(login({ email, password: 'matkhau123' }));

    expect(selectIsAuthenticated(store.getState())).toBe(true);
    expect(selectCurrentUser(store.getState())?.fullName).toBe('Nguyễn Văn A');
  });

  it('đăng nhập sai mật khẩu báo lỗi', () => {
    const store = makeStore();
    const email = `wrong-${Date.now()}@example.com`;

    store.dispatch(register({ fullName: 'Nguyễn Văn B', email, password: 'matkhau123' }));
    store.dispatch(logout());
    store.dispatch(login({ email, password: 'saimatkhau' }));

    expect(selectIsAuthenticated(store.getState())).toBe(false);
    expect(selectAuthError(store.getState())).toBeTruthy();
  });

  it('đăng ký trùng email bị từ chối', () => {
    const store = makeStore();
    const email = `dup-${Date.now()}@example.com`;

    store.dispatch(register({ fullName: 'Nguyễn Văn C', email, password: 'matkhau123' }));
    store.dispatch(logout());
    store.dispatch(register({ fullName: 'Nguyễn Văn D', email, password: 'matkhau123' }));

    expect(selectIsAuthenticated(store.getState())).toBe(false);
    expect(selectAuthError(store.getState())).toBe('Email này đã được đăng ký.');
  });

  it('đăng xuất xoá user', () => {
    const store = makeStore();

    store.dispatch(logout());

    expect(selectCurrentUser(store.getState())).toBeNull();
    expect(selectIsAuthenticated(store.getState())).toBe(false);
  });

  it('xoá lỗi auth', () => {
    const store = makeStore();

    store.dispatch(login({ email: 'khong-ton-tai@example.com', password: 'matkhau123' }));
    expect(selectAuthError(store.getState())).toBeTruthy();

    store.dispatch(clearAuthError());
    expect(selectAuthError(store.getState())).toBeNull();
  });

  it('validate email và mật khẩu', () => {
    expect(validateCredentials({ email: 'sai-dinh-dang', password: '123456' }).email).toBeTruthy();
    expect(validateCredentials({ email: 'a@example.com', password: '123' }).password).toBeTruthy();
    expect(validateCredentials({ email: 'a@example.com', password: '123456' })).toEqual({});
  });

  it('validate đăng ký yêu cầu họ tên', () => {
    expect(
      validateRegister({ fullName: '  ', email: 'a@example.com', password: '123456' }).fullName,
    ).toBeTruthy();
  });
});
