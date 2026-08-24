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
import type { AccessibilityRole, StyleProp, ViewStyle } from 'react-native';
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
  /**
   * Set to 0 where the caller sizes the pill itself — a row of four equal
   * presets, say. The default 18 is right for a pill that sizes to its label and
   * wrong for one stretched to a fixed column, where it is 36 points the label
   * cannot use: at large system text "1000" no longer fits a quarter of the
   * screen and wraps to two lines.
   */
  paddingHorizontal?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  /**
   * `radio` where the pill is one of a mutually exclusive set — the volume
   * presets, the rounding thresholds — so it is announced as a choice rather
   * than as a button that happens to look different from its neighbours.
   */
  accessibilityRole?: AccessibilityRole;
  /** Where the visible label needs the setting's name to make sense on its own. */
  accessibilityLabel?: string;
};

export function Pill({
  label,
  onPress,
  selected = false,
  emphasis = 'secondary',
  paddingHorizontal = 18,
  disabled,
  style,
  accessibilityHint,
  accessibilityRole,
  accessibilityLabel,
}: PillProps) {
  const { colour } = useTheme();
  const inverted = selected || emphasis === 'primary';

  return (
    <View style={[{ borderRadius: radius.pill, overflow: 'hidden' }, style]}>
      <Touchable
        radius={radius.pill}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected, checked: selected, disabled: !!disabled }}
        accessibilityHint={accessibilityHint}
        style={{
          // Stretches to whatever the wrapper's layout gives it, and sizes to its
          // own content when the wrapper has no opinion.
          alignSelf: 'stretch',
          minHeight: MIN_TARGET,
          paddingHorizontal,
          backgroundColor: inverted ? colour.text : colour.control,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* One line, always. A pill in a fixed grid that wraps is taller than its
            neighbours and stops reading as one of a set. */}
        <CardTitle numberOfLines={1} style={{ color: inverted ? colour.background : colour.text }}>
          {label}
        </CardTitle>
      </Touchable>
    </View>
  );
}
