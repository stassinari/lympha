import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ThemeContext, resolveScheme, themes, useTheme } from './theme';
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

/**
 * The status bar, following the app's theme rather than the system's.
 *
 * `expo-status-bar`'s `auto` reads the platform colour scheme, which is the right
 * default and the wrong answer here: the appearance setting can put the app in
 * light while the phone is in dark, and the bar would then draw white glyphs on
 * a white screen. It has to be told what the app resolved to, which means reading
 * it from inside the provider.
 */
export function ThemedStatusBar() {
  const { scheme } = useTheme();
  // `light` means light *content*, which is what a dark background wants.
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}
