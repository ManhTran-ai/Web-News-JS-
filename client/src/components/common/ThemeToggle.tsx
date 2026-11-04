import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { applyTheme, resolveTheme, setTheme, selectTheme, type ThemeMode } from '@/store/slices/uiSlice';

const NEXT: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const LABEL: Record<ThemeMode, string> = {
  light: 'Sáng',
  dark: 'Tối',
  system: 'Theo hệ thống',
};

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const resolved = resolveTheme(theme);

  useEffect(() => {
    applyTheme(theme);

    if (theme !== 'system' || !window.matchMedia) return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const icon = theme === 'system' ? 'bi-circle-half' : resolved === 'dark' ? 'bi-moon-stars' : 'bi-sun';

  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm"
      onClick={() => dispatch(setTheme(NEXT[theme]))}
      aria-label={`Giao diện hiện tại: ${LABEL[theme]}. Bấm để đổi.`}
      title={`Giao diện: ${LABEL[theme]}`}
    >
      <i className={`bi ${icon}`} aria-hidden="true" />
    </button>
  );
}
