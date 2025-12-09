import { useThemeStore } from '../store/theme.store';
import { colorSchemes, ColorTokens } from '../theme';

interface UseThemeResult {
  colors: ColorTokens;
  isDark: boolean;
  mode: 'light' | 'dark';
  toggleTheme: () => Promise<void>;
}

export function useTheme(): UseThemeResult {
  const { mode, toggleTheme } = useThemeStore();
  return {
    colors: colorSchemes[mode],
    isDark: mode === 'dark',
    mode,
    toggleTheme,
  };
}
