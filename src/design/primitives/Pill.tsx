/**
 * A pill button. Used for "Edit", volume presets and nudge actions.
 *
 * Height differs by platform: 44pt is Apple's minimum target, 48dp is Material's.
 * Both are floors, not preferences, so the larger one wins on each platform
 * rather than being averaged into one number.
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
    <Touchable
      radius={radius.pill}
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      style={[
        {
          minHeight: MIN_TARGET,
          paddingHorizontal: 18,
          borderRadius: radius.pill,
          backgroundColor: inverted ? colour.text : colour.control,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View pointerEvents="none">
        <CardTitle style={{ color: inverted ? colour.background : colour.text }}>{label}</CardTitle>
      </View>
    </Touchable>
  );
}
