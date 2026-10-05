/**
 * Theme: colours resolved for the active scheme, plus the platform-bound shape
 * tokens. Screens read everything through `useTheme()`.
 *
 * The spacing, radius and fixed-size tokens live in `layout.ts`, which imports no
 * React Native and can therefore be tested in Node. They are re-exported here so
 * a call site still asks one module for "the design tokens".
 */

import { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { dark, light, semantic } from './palette';
import type { ColourTokens, SemanticTokens } from './palette';

export * from './layout';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

/**
 * Card elevation. iOS and Android express this differently and the handoff
 * specifies a different value for each, so there is no shared token.
 * `shadowColor` must be opaque — RN ignores alpha there, it comes from
 * `shadowOpacity`.
 */
export const cardShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#462D1E',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
  },
  android: { elevation: 2 },
  default: {},
});

export type Theme = {
  scheme: ResolvedScheme;
  colour: ColourTokens & SemanticTokens;
};

export function buildTheme(scheme: ResolvedScheme): Theme {
  return {
    scheme,
    colour: { ...(scheme === 'dark' ? dark : light), ...semantic },
  };
}

export const themes: Record<ResolvedScheme, Theme> = {
  light: buildTheme('light'),
  dark: buildTheme('dark'),
};

/** Dark when the scheme is unresolved: the app is built for a dark kitchen at 6am. */
export const ThemeContext = createContext<Theme>(themes.dark);

export const useTheme = () => useContext(ThemeContext);

export function resolveScheme(mode: ThemeMode, system: ResolvedScheme): ResolvedScheme {
  return mode === 'system' ? system : mode;
}
