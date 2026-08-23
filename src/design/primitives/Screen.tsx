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
};

export function Screen({
  children,
  style,
  topPadding = space.snug,
  applyBottomInset = true,
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
          paddingLeft: Math.max(insets.left, space.screenH),
          paddingRight: Math.max(insets.right, space.screenH),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
