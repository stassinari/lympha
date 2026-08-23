import { useColorScheme } from 'react-native';
import type { ReactNode } from 'react';
import { ThemeContext, resolveScheme, themes } from './theme';
import type { ThemeMode } from './theme';

/**
 * `useColorScheme` returns null before the platform reports one. The brief is
 * dark-first, so that gap resolves to dark rather than flashing light.
 */
export function ThemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  const system = useColorScheme() === 'light' ? 'light' : 'dark';
  const scheme = resolveScheme(mode, system);
  return <ThemeContext.Provider value={themes[scheme]}>{children}</ThemeContext.Provider>;
}
