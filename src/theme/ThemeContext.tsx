import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import { fonts } from './typography';

export type AppTheme = {
  colors: typeof lightColors;
  fonts: typeof fonts;
  isDark: boolean;
};

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const theme = useMemo<AppTheme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      fonts,
      isDark,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

export function useThemeStyles<T>(factory: (theme: AppTheme) => T, deps: unknown[] = []): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, ...deps]);
}
