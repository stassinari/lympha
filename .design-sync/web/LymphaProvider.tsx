import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../../src/design';
import type { ResolvedScheme } from '../../src/design';

export type LymphaProviderProps = {
  /** Light or dark. The app follows the device by default and is dark-first. */
  scheme?: ResolvedScheme;
  /**
   * The device's safe-area insets, for a full-screen design. Zero by default,
   * which suits a component on its own. An iPhone with a Dynamic Island is
   * `{ top: 59, bottom: 34 }`.
   */
  insets?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Paints the scheme's page background behind the children. On by default. */
  background?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const FRAME = { x: 0, y: 0, width: 390, height: 844 };

/**
 * The root every Lympha design renders inside: theme, safe area and page colour.
 *
 * Every component reads its colours from the theme. Outside this provider they
 * fall back to dark, and `Screen` has no insets to read.
 *
 * The insets go straight into the safe-area contexts. `SafeAreaProvider` on the
 * web measures the browser's own insets and replaces any it is given, and a
 * design describes a phone, not the browser it is viewed in.
 */
export function LymphaProvider({
  scheme = 'light',
  insets,
  background = true,
  style,
  children,
}: LymphaProviderProps) {
  const edges = { top: 0, bottom: 0, left: 0, right: 0, ...insets };
  return (
    <SafeAreaFrameContext.Provider value={FRAME}>
      <SafeAreaInsetsContext.Provider value={edges}>
        <ThemeProvider mode={scheme}>
          {background ? <Page style={style}>{children}</Page> : children}
        </ThemeProvider>
      </SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}

function Page({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const { colour } = useTheme();
  return <View style={[{ backgroundColor: colour.background }, style]}>{children}</View>;
}
