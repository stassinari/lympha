/**
 * A selection chip, for brand switching.
 *
 * The one place the two platforms genuinely diverge in appearance, because the
 * unselected state means different things in each idiom: iOS shows a filled pill
 * tinted down, Material shows an outlined chip at a 12dp radius. Selected is the
 * same on both — inverted to the foreground colour.
 */

import { Platform, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { radius, useTheme } from '../theme';
import { CardTitle } from '../text';
import { Touchable } from './Touchable';
import { MIN_TARGET } from './Pill';

export type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Rendered before the label — a bar cluster, usually. */
  leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const CHIP_RADIUS = Platform.select({ android: radius.chipAndroid, default: radius.pill });

export function Chip({ label, selected, onPress, leading, style }: ChipProps) {
  const { colour } = useTheme();

  // The border is always present and only changes colour. Adding or removing it
  // with the selection would change the box geometry on every tap, and on Android
  // that re-lays-out a clipped view mid-ripple.
  const border: ViewStyle =
    Platform.OS === 'android'
      ? { borderWidth: 1, borderColor: selected ? 'transparent' : colour.divider }
      : {};

  const unselected: ViewStyle =
    Platform.OS === 'android'
      ? { backgroundColor: 'transparent' }
      : { backgroundColor: colour.control };

  return (
    // The wrapper clips the Android ripple to the chip's shape; see `Touchable`.
    <View style={[{ borderRadius: CHIP_RADIUS, overflow: 'hidden' }, style]}>
      <Touchable
        radius={CHIP_RADIUS}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[
          {
            alignSelf: 'stretch',
            minHeight: MIN_TARGET,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          },
          border,
          selected ? { backgroundColor: colour.text } : unselected,
        ]}
      >
        {leading}
        <CardTitle style={{ color: selected ? colour.background : colour.textSecondary }}>
          {label}
        </CardTitle>
      </Touchable>
    </View>
  );
}
