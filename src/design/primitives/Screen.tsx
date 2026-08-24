/**
 * Screen container.
 *
 * The handoff specifies a 60px top inset on iOS and 16dp on Android. Those are
 * measurements of one device each; the real inset is whatever the notch, Dynamic
 * Island or status bar leaves, so it is read from the platform and the handoff's
 * figures become the minimum rather than the value.
 */

import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useTheme } from '../theme';

export type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra breathing room above the first block, on top of the safe area. */
  topPadding?: number;
  /** Screens that scroll handle their own bottom inset. */
  applyBottomInset?: boolean;
  /**
   * Set to 0 when the screen's content lives in a ScrollView.
   *
   * A ScrollView clips to its own bounds, so a card sitting flush against the
   * padding edge has its shadow sliced off down both sides. Giving the scroller
   * the full width and moving the inset into its content container leaves the
   * shadows somewhere to fall.
   */
  horizontalPadding?: number;
};

export function Screen({
  children,
  style,
  topPadding = space.snug,
  applyBottomInset = true,
  horizontalPadding = space.screenH,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colour } = useTheme();

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colour.background,
          paddingTop: insets.top + topPadding,
          paddingBottom: applyBottomInset ? insets.bottom : 0,
          paddingLeft: Math.max(insets.left, horizontalPadding),
          paddingRight: Math.max(insets.right, horizontalPadding),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
