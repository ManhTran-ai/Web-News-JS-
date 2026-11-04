import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '@/lib/constants';
import { readStorage, writeStorage } from '@/lib/storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface UiState {
  theme: ThemeMode;
}

const initialState: UiState = {
  theme: readStorage<ThemeMode>(STORAGE_KEYS.theme, 'system'),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
      writeStorage(STORAGE_KEYS.theme, state.theme);
    },
  },
});

export const uiReducer = uiSlice.reducer;
export const { setTheme } = uiSlice.actions;

export const selectTheme = (state: { ui: UiState }): ThemeMode => state.ui.theme;

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-bs-theme', resolveTheme(mode));
}
