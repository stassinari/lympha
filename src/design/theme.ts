/**
 * Theme: colours resolved for the active scheme, plus the shape and spacing
 * tokens. Screens read everything through `useTheme()`.
 */

import { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { dark, light, semantic } from './palette';
import type { ColourTokens, SemanticTokens } from './palette';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

/**
 * Spacing. The handoff's values are deliberately irregular, so they are named
 * for what they separate rather than fitted to a scale that would distort them.
 */
export const space = {
  /** Between dose rows in the list. */
  rows: 9,
  /** Between the major blocks of a screen. */
  blocks: 14,
  /** Screen edge inset, horizontal. */
  screenH: 18,
  /** Inside a card. */
  cardV: 18,
  cardH: 20,
  /**
   * Gap between a row's edge and the *visible marks* inside it, as opposed to the
   * invisible text box. Fed through `opticalPadding`, which is what keeps a dose
   * row from looking top-heavy: a 40px numeral carries ~14px of descent slack
   * below its digits, and padding both sides equally would push the ink upwards.
   */
  rowInk: 20,
  /** Between a field label and the large value beneath it. Chosen to clear the
   *  intrinsic slack both platforms leave above a display numeral — see
   *  `VolumeCard` — so the two render the same gap. */
  labelGap: 10,
  /** Small internal gaps. */
  tight: 6,
  snug: 8,
  loose: 20,
} as const;

export const radius = {
  /** Keypad keys. */
  key: 6,
  /** Material selection chips; iOS uses `pill`. */
  chipAndroid: 12,
  /** Segmented controls, preset pills. */
  control: 16,
  /** Dose rows. */
  row: 20,
  /** Cards. */
  card: 22,
  pill: 999,
} as const;

/** The colour bar on the leading edge of a dose row. Flush, never inset. */
export const COLOUR_BAR_WIDTH = 12;

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

/** Dark-first: the brief calls for it, and it is what an unresolved scheme gets. */
export const ThemeContext = createContext<Theme>(themes.dark);

export const useTheme = () => useContext(ThemeContext);

export function resolveScheme(mode: ThemeMode, system: ResolvedScheme): ResolvedScheme {
  return mode === 'system' ? system : mode;
}
