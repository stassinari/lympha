/**
 * Screen container.
 *
 * The handoff specifies a 60px top inset on iOS and 16dp on Android. Those are
 * measurements of one device each; the real inset is whatever the notch, Dynamic
 * Island or status bar leaves, so it is read from the platform and the handoff's
 * figures become the minimum rather than the value.
 *
 * Nothing is added above that inset here. Every screen's first child is a header
 * band of a fixed height — see `HEADER_BAND` — and top spacing is measured inside
 * it, against the header's cap height. A screen-level top padding on top of that
 * would be a second, invisible offset that each screen could get wrong, which is
 * exactly how the content start line drifted apart in the first place.
 */

import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useTheme } from '../theme';

export type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
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
          paddingTop: insets.top,
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
