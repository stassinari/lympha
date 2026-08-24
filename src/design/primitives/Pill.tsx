/**
 * A pill button. Used for "Edit", volume presets and nudge actions.
 *
 * Height differs by platform: 44pt is Apple's minimum target, 48dp is Material's.
 * Both are floors, not preferences, so the larger one wins on each platform
 * rather than being averaged into one number.
 *
 * The outer view exists to clip the Android ripple to the pill's shape, and takes
 * the caller's layout styling — the presets pass `flex: 1` and it has to land on
 * the element that participates in the row, not on the pressable inside it.
 */

import { Platform, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { radius, useTheme } from '../theme';
import { CardTitle } from '../text';
import { Touchable } from './Touchable';

export const MIN_TARGET = Platform.select({ ios: 44, android: 48, default: 44 });

export type PillProps = {
  label: string;
  onPress: () => void;
  /** Inverts to the foreground colour, as a selected preset does. */
  selected?: boolean;
  /** The one emphasised action in a nudge card. */
  emphasis?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Pill({
  label,
  onPress,
  selected = false,
  emphasis = 'secondary',
  disabled,
  style,
  accessibilityHint,
}: PillProps) {
  const { colour } = useTheme();
  const inverted = selected || emphasis === 'primary';

  return (
    <View style={[{ borderRadius: radius.pill, overflow: 'hidden' }, style]}>
      <Touchable
        radius={radius.pill}
        onPress={onPress}
        disabled={disabled}
        accessibilityState={{ selected, disabled: !!disabled }}
        accessibilityHint={accessibilityHint}
        style={{
          // Stretches to whatever the wrapper's layout gives it, and sizes to its
          // own content when the wrapper has no opinion.
          alignSelf: 'stretch',
          minHeight: MIN_TARGET,
          paddingHorizontal: 18,
          backgroundColor: inverted ? colour.text : colour.control,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CardTitle style={{ color: inverted ? colour.background : colour.text }}>{label}</CardTitle>
      </Touchable>
    </View>
  );
}
