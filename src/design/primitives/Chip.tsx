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

  const unselected: ViewStyle =
    Platform.OS === 'android'
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: colour.divider }
      : { backgroundColor: colour.control };

  return (
    <Touchable
      radius={CHIP_RADIUS}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        {
          minHeight: MIN_TARGET,
          paddingHorizontal: 16,
          borderRadius: CHIP_RADIUS,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        selected ? { backgroundColor: colour.text } : unselected,
        style,
      ]}
    >
      {leading ? <View pointerEvents="none">{leading}</View> : null}
      <CardTitle
        style={{ color: selected ? colour.background : colour.textSecondary }}
        pointerEvents="none"
      >
        {label}
      </CardTitle>
    </Touchable>
  );
}
