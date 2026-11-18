import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { requestPasswordResetCode, verifyPasswordResetCode } from '@/api/endpoints';
import { toApiError } from '@/api/http';
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
  /** Email đang chờ nhập mã bảo mật. */
  resetEmail: string | null;
  /** Đang gửi mã bảo mật qua email. */
  isSendingResetCode: boolean;
  /** Đang kiểm tra mã bảo mật người dùng nhập. */
  isVerifyingResetCode: boolean;
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
  code?: string;
  oldPassword?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetPayload {
  email: string;
  code: string;
  password: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  password: string;
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

export function validatePasswordResetRequest(payload: PasswordResetRequest): FieldErrors {
  const errors: FieldErrors = {};

  if (!payload.email.trim()) {
    errors.email = 'Vui lòng nhập email.';
  } else if (!EMAIL_PATTERN.test(payload.email.trim())) {
    errors.email = 'Email không đúng định dạng.';
  }

  return errors;
}

export function validatePasswordReset(payload: PasswordResetPayload): FieldErrors {
  const errors: FieldErrors = {};

  if (!payload.code.trim()) {
    errors.code = 'Vui lòng nhập mã bảo mật.';
  }

  if (!payload.password) {
    errors.password = 'Vui lòng nhập mật khẩu mới.';
  } else if (payload.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }

  return errors;
}
export function validateChangePassword(payload: ChangePasswordPayload): FieldErrors {
  const errors: FieldErrors = {};

  if (!payload.oldPassword) {
    errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại.';
  }

  if (!payload.password) {
    errors.password = 'Vui lòng nhập mật khẩu mới.';
  } else if (payload.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  } else if (payload.oldPassword && payload.password === payload.oldPassword) {
    errors.password = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  }

  return errors;
}

const storedUser = readStorage<User | null>(STORAGE_KEYS.auth, null);

const initialState: AuthState = {
  user: storedUser,
  isAuthenticated: storedUser !== null,
  error: null,
  resetEmail: null,
  isSendingResetCode: false,
  isVerifyingResetCode: false,
};

/**
 * Bước 1 của luồng quên mật khẩu: server sinh mã bảo mật rồi gửi qua email.
 * Mã không bao giờ trả về client.
 */
export const sendResetCode = createAsyncThunk<
  { email: string },
  PasswordResetRequest,
  { rejectValue: string }
>('auth/sendResetCode', async (payload, { rejectWithValue }) => {
  const errors = validatePasswordResetRequest(payload);
  if (errors.email) {
    return rejectWithValue(errors.email);
  }

  const email = payload.email.trim().toLowerCase();
  try {
    await requestPasswordResetCode(email);
    return { email };
  } catch (error) {
    return rejectWithValue(toApiError(error).message);
  }
});

/**
 * Bước 2: kiểm tra mã bảo mật với server rồi đặt lại mật khẩu trong
 * `localStorage` (tài khoản vẫn lưu cục bộ vì backend chưa có database).
 */
export const submitResetPassword = createAsyncThunk<
  { email: string },
  PasswordResetPayload,
  { rejectValue: string }
>('auth/submitResetPassword', async (payload, { rejectWithValue }) => {
  const errors = validatePasswordReset(payload);
  if (errors.code || errors.password) {
    return rejectWithValue(errors.code ?? errors.password ?? 'Dữ liệu không hợp lệ.');
  }

  const email = payload.email.trim().toLowerCase();
  try {
    await verifyPasswordResetCode(email, payload.code.trim());
  } catch (error) {
    return rejectWithValue(toApiError(error).message);
  }

  const accounts = readAccounts();
  const account = accounts.find((item) => item.email === email);
  if (!account) {
    return rejectWithValue('Không tìm thấy tài khoản với email này.');
  }

  account.passwordHash = hashPassword(payload.password);
  writeStorage(STORAGE_KEYS.accounts, accounts);

  return { email };
});

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
    /** Người dùng đang đăng nhập tự đổi mật khẩu. */
    changePassword(state, action: PayloadAction<ChangePasswordPayload>) {
      const errors = validateChangePassword(action.payload);
      if (errors.oldPassword || errors.password) {
        state.error = errors.oldPassword ?? errors.password ?? null;
        return;
      }

      const email = state.user?.email;
      if (!email) {
        state.error = 'Bạn cần đăng nhập để đổi mật khẩu.';
        return;
      }

      const accounts = readAccounts();
      const account = accounts.find((item) => item.email === email);
      if (!account || account.passwordHash !== hashPassword(action.payload.oldPassword)) {
        state.error = 'Mật khẩu hiện tại không đúng.';
        return;
      }

      account.passwordHash = hashPassword(action.payload.password);
      writeStorage(STORAGE_KEYS.accounts, accounts);
      state.error = null;
    },
    clearPasswordReset(state) {
      state.resetEmail = null;
      state.isSendingResetCode = false;
      state.isVerifyingResetCode = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendResetCode.pending, (state) => {
        state.isSendingResetCode = true;
        state.error = null;
      })
      .addCase(sendResetCode.fulfilled, (state, action) => {
        state.isSendingResetCode = false;
        state.resetEmail = action.payload.email;
        state.error = null;
      })
      .addCase(sendResetCode.rejected, (state, action) => {
        state.isSendingResetCode = false;
        state.error = action.payload ?? 'Không gửi được mã bảo mật. Vui lòng thử lại.';
      })
      .addCase(submitResetPassword.pending, (state) => {
        state.isVerifyingResetCode = true;
        state.error = null;
      })
      .addCase(submitResetPassword.fulfilled, (state) => {
        state.isVerifyingResetCode = false;
        state.resetEmail = null;
        state.error = null;
      })
      .addCase(submitResetPassword.rejected, (state, action) => {
        state.isVerifyingResetCode = false;
        state.error = action.payload ?? 'Mã bảo mật không đúng.';
      });
  },
});

/**
 * Bước 1 của luồng quên mật khẩu: server sinh mã bảo mật rồi gửi qua email.
 * Mã không bao giờ trả về client.
 */
export const authReducer = authSlice.reducer;
export const {
  login,
  register,
  logout,
  changePassword,
  clearPasswordReset,
  clearAuthError,
} = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthState }): User | null => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }): boolean =>
  state.auth.isAuthenticated;
export const selectAuthError = (state: { auth: AuthState }): string | null => state.auth.error;
export const selectResetEmail = (state: { auth: AuthState }): string | null => state.auth.resetEmail;
export const selectIsSendingResetCode = (state: { auth: AuthState }): boolean =>
  state.auth.isSendingResetCode;
