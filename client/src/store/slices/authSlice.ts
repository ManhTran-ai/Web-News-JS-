import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '@/lib/constants';
import { readStorage, writeStorage } from '@/lib/storage';
import type { User } from '@/types/article';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const storedUser = readStorage<User | null>(STORAGE_KEYS.auth, null);

const initialState: AuthState = {
  user: storedUser,
  isAuthenticated: storedUser !== null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: { payload: User | null }) {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
      writeStorage(STORAGE_KEYS.auth, action.payload);
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      writeStorage(STORAGE_KEYS.auth, null);
    },
  },
});

export const authReducer = authSlice.reducer;
export const { setUser, logout } = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthState }): User | null => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }): boolean =>
  state.auth.isAuthenticated;
