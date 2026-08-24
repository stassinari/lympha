/**
 * A segmented control. Used for appearance, where the options are few, fixed and
 * mutually exclusive, and seeing all three at once is the point.
 */

import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { radius, useTheme } from '../theme';
import { Caption } from '../text';
import { Touchable } from './Touchable';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

const INNER_RADIUS = radius.control - 3;

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedProps<T>) {
  const { colour } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colour.control,
          borderRadius: radius.control,
          padding: 3,
          gap: 3,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <View
            key={option.value}
            // Clips the Android ripple to the segment, as everywhere else.
            style={{ flex: 1, borderRadius: INNER_RADIUS, overflow: 'hidden' }}
          >
            <Touchable
              radius={INNER_RADIUS}
              onPress={() => onChange(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={{
                alignSelf: 'stretch',
                paddingVertical: 10,
                alignItems: 'center',
                backgroundColor: selected ? colour.controlSelected : 'transparent',
              }}
            >
              <Caption tone={selected ? 'primary' : 'secondary'}>{option.label}</Caption>
            </Touchable>
          </View>
        );
      })}
    </View>
  );
}
