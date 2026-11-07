import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '@/lib/constants';
import { readStorage, writeStorage } from '@/lib/storage';
import type { User } from '@/types/article';

/**
 * Backend tuần 2 chưa có endpoint xác thực (`/api/auth/*`), nên tài khoản được
 * lưu cục bộ ở `localStorage`. Mật khẩu chỉ lưu dạng băm nhẹ (không phải
 * chuẩn bảo mật) và sẽ thay bằng API thật khi backend bổ sung.
 */

interface StoredAccount {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  fullName: string;
}

export interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Băm nhẹ, chỉ để không lưu mật khẩu dạng rõ ở `localStorage`. */
function hashPassword(password: string): string {
  let hash = 5381;
  for (let index = 0; index < password.length; index += 1) {
    hash = (hash * 33) ^ password.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function readAccounts(): StoredAccount[] {
  return readStorage<StoredAccount[]>(STORAGE_KEYS.accounts, []);
}

function findAccount(email: string): StoredAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return readAccounts().find((account) => account.email === normalized);
}

export function validateCredentials(payload: AuthCredentials): FieldErrors {
  const errors: FieldErrors = {};

  if (!payload.email.trim()) {
    errors.email = 'Vui lòng nhập email.';
  } else if (!EMAIL_PATTERN.test(payload.email.trim())) {
    errors.email = 'Email không đúng định dạng.';
  }

  if (!payload.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (payload.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }

  return errors;
}

export function validateRegister(payload: RegisterPayload): FieldErrors {
  const errors = validateCredentials(payload);

  if (!payload.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ tên.';
  }

  return errors;
}

const storedUser = readStorage<User | null>(STORAGE_KEYS.auth, null);

const initialState: AuthState = {
  user: storedUser,
  isAuthenticated: storedUser !== null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<AuthCredentials>) {
      const errors = validateCredentials(action.payload);
      if (errors.email || errors.password) {
        state.error = errors.email ?? errors.password ?? null;
        return;
      }

      const account = findAccount(action.payload.email);
      if (!account || account.passwordHash !== hashPassword(action.payload.password)) {
        state.error = 'Email hoặc mật khẩu không đúng.';
        return;
      }

      const user: User = { id: account.id, fullName: account.fullName, email: account.email };
      state.user = user;
      state.isAuthenticated = true;
      state.error = null;
      writeStorage(STORAGE_KEYS.auth, user);
    },
    register(state, action: PayloadAction<RegisterPayload>) {
      const errors = validateRegister(action.payload);
      if (errors.fullName || errors.email || errors.password) {
        state.error = errors.fullName ?? errors.email ?? errors.password ?? null;
        return;
      }

      const email = action.payload.email.trim().toLowerCase();
      if (findAccount(email)) {
        state.error = 'Email này đã được đăng ký.';
        return;
      }

      const accounts = readAccounts();
      const account: StoredAccount = {
        id: `u_${Date.now().toString(36)}`,
        fullName: action.payload.fullName.trim(),
        email,
        passwordHash: hashPassword(action.payload.password),
        createdAt: new Date().toISOString(),
      };
      accounts.push(account);
      writeStorage(STORAGE_KEYS.accounts, accounts);

      const user: User = { id: account.id, fullName: account.fullName, email: account.email };
      state.user = user;
      state.isAuthenticated = true;
      state.error = null;
      writeStorage(STORAGE_KEYS.auth, user);
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      writeStorage(STORAGE_KEYS.auth, null);
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
});

export const authReducer = authSlice.reducer;
export const { login, register, logout, clearAuthError } = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthState }): User | null => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }): boolean =>
  state.auth.isAuthenticated;
export const selectAuthError = (state: { auth: AuthState }): string | null => state.auth.error;
