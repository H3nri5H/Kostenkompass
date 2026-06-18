import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import {
  createContext,
  createElement,
  type PropsWithChildren,
  useCallback,
  useColorScheme,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { darkTheme, lightTheme, type AppTheme } from '@/theme/tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const STORAGE_KEY = 'spendfox.theme-mode';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export { darkTheme, lightTheme, type AppTheme } from '@/theme/tokens';

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((storedMode) => {
      if (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark') {
        setModeState(storedMode);
      }
    });
  }, []);

  const resolvedMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(STORAGE_KEY, nextMode);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme, mode, setMode }), [mode, setMode, theme]);

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useAppTheme(): AppTheme {
  const context = useContext(ThemeContext);
  const fallbackScheme = useColorScheme();
  return context?.theme ?? (fallbackScheme === 'dark' ? darkTheme : lightTheme);
}

export function useThemePreference() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('Theme provider missing.');
  }

  return { mode: context.mode, setMode: context.setMode };
}

export function createNavigationTheme(appTheme: AppTheme): Theme {
  const base = appTheme.dark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: appTheme.dark,
    colors: {
      ...base.colors,
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.surface,
      text: appTheme.colors.text,
      border: appTheme.colors.border,
      notification: appTheme.colors.danger,
    },
  };
}
