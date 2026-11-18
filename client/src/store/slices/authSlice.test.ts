// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { ApiError } from '@/api/http';
import { rootReducer } from '../index';
import {
  authReducer,
  login,
  register,
  logout,
  changePassword,
  clearAuthError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthError,
  selectResetEmail,
  sendResetCode,
  submitResetPassword,
  validateCredentials,
  validateRegister,
} from './authSlice';

vi.mock('@/api/endpoints', () => ({
  requestPasswordResetCode: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
}));

const endpoints = await import('@/api/endpoints');

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

  it('quên mật khẩu: gửi mã qua email rồi đặt lại được mật khẩu mới', async () => {
    const store = makeStore();
    const email = `reset-${Date.now()}@example.com`;

    store.dispatch(register({ fullName: 'Nguyễn Văn E', email, password: 'matkhau123' }));
    store.dispatch(logout());

    vi.mocked(endpoints.requestPasswordResetCode).mockResolvedValue(undefined);
    await store.dispatch(sendResetCode({ email }));
    expect(selectAuthError(store.getState())).toBeNull();
    expect(selectResetEmail(store.getState())).toBe(email);

    vi.mocked(endpoints.verifyPasswordResetCode).mockResolvedValue(undefined);
    await store.dispatch(
      submitResetPassword({ email, code: '123456', password: 'matkhaumoi123' }),
    );
    expect(selectAuthError(store.getState())).toBeNull();

    store.dispatch(login({ email, password: 'matkhaumoi123' }));
    expect(selectIsAuthenticated(store.getState())).toBe(true);
  });

  it('quên mật khẩu: server báo mã không đúng thì báo lỗi', async () => {
    const store = makeStore();
    const email = `reset-sai-${Date.now()}@example.com`;

    store.dispatch(register({ fullName: 'Nguyễn Văn F', email, password: 'matkhau123' }));
    store.dispatch(logout());

    vi.mocked(endpoints.requestPasswordResetCode).mockResolvedValue(undefined);
    await store.dispatch(sendResetCode({ email }));

    vi.mocked(endpoints.verifyPasswordResetCode).mockRejectedValue(
      new ApiError('INVALID_CODE', 'Mã bảo mật không đúng.', 400),
    );
    await store.dispatch(
      submitResetPassword({ email, code: '000000', password: 'matkhaumoi123' }),
    );
    expect(selectAuthError(store.getState())).toBe('Mã bảo mật không đúng.');

    store.dispatch(login({ email, password: 'matkhaumoi123' }));
    expect(selectIsAuthenticated(store.getState())).toBe(false);
  });

  it('quên mật khẩu: server chưa cấu hình SMTP thì báo lỗi', async () => {
    const store = makeStore();

    vi.mocked(endpoints.requestPasswordResetCode).mockRejectedValue(
      new ApiError('MAIL_NOT_CONFIGURED', 'Chưa cấu hình SMTP nên chưa thể gửi mã bảo mật qua email.', 503),
    );
    await store.dispatch(sendResetCode({ email: 'a@example.com' }));

    expect(selectAuthError(store.getState())).toContain('Chưa cấu hình SMTP');
    expect(selectResetEmail(store.getState())).toBeNull();
  });

  it('đổi mật khẩu khi đã đăng nhập', () => {
    const store = makeStore();
    const email = `change-${Date.now()}@example.com`;

    store.dispatch(register({ fullName: 'Nguyễn Văn G', email, password: 'matkhau123' }));
    store.dispatch(changePassword({ oldPassword: 'matkhau123', password: 'matkhaumoi123' }));
    expect(selectAuthError(store.getState())).toBeNull();

    store.dispatch(logout());
    store.dispatch(login({ email, password: 'matkhaumoi123' }));
    expect(selectIsAuthenticated(store.getState())).toBe(true);
  });

  it('đổi mật khẩu: sai mật khẩu hiện tại thì bị từ chối', () => {
    const store = makeStore();
    const email = `change-sai-${Date.now()}@example.com`;

    store.dispatch(register({ fullName: 'Nguyễn Văn H', email, password: 'matkhau123' }));
    store.dispatch(changePassword({ oldPassword: 'saimatkhau', password: 'matkhaumoi123' }));

    expect(selectAuthError(store.getState())).toBe('Mật khẩu hiện tại không đúng.');
  });
});
