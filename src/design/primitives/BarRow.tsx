/**
 * The row anatomy: a flush colour bar on the leading edge, then content.
 *
 * This is the single most reused shape in the app. Dose rows are made of it, and
 * so are the volume nudge, the unit-override callout and the rounding-detail hero
 * — a warning is deliberately the same family as a dose rather than a different
 * kind of object, which is how the app stays calm about rounding at 6am.
 *
 * The bar is exactly 12px, full height, and touches the card edge. An inset bar
 * was tested during design and reads too quietly. Every bar is flush and
 * unbordered, however pale the label — see `resolveBarColour` for why a pale one
 * needs no help.
 */

import { View } from 'react-native';
import type { AccessibilityRole, StyleProp, ViewStyle } from 'react-native';
import { COLOUR_BAR_WIDTH, cardShadow, radius, space, useTheme } from '../theme';
import { Touchable } from './Touchable';

export type BarRowProps = {
  children: React.ReactNode;
  /** Already resolved for the active scheme — see `resolveBarColour`. */
  barColour: string;
  onPress?: () => void;
  /** Overrides the card surface — used to drop a completed row to the sunken tone. */
  surfaceColour?: string;
  /** Opacity applied to the colour bar alone. Safe because the bar is a leaf with
   *  nothing behind it; group opacity over a whole row is not (see `DoseRow`). */
  barOpacity?: number;
  /** A row that has receded should not still be casting a shadow. */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  paddingVertical?: number;
  paddingHorizontal?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: { selected?: boolean; checked?: boolean };
};

export function BarRow({
  children,
  barColour,
  onPress,
  surfaceColour,
  barOpacity = 1,
  elevated = true,
  style,
  contentStyle,
  paddingVertical = space.cardV,
  paddingHorizontal = space.cardH,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
}: BarRowProps) {
  const { colour } = useTheme();

  const body = (
    <>
      <View style={{ width: COLOUR_BAR_WIDTH, backgroundColor: barColour, opacity: barOpacity }} />
      <View style={[{ flex: 1, paddingVertical, paddingHorizontal }, contentStyle]}>
        {children}
      </View>
    </>
  );

  // `overflow: hidden` is what clips the bar to the radius. Verified on both
  // platforms in the Slice 0 spike; Android needs no workaround.
  const shadow = elevated ? cardShadow : null;

  const surface: ViewStyle = {
    backgroundColor: surfaceColour ?? colour.card,
    borderRadius: radius.row,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
  };

  if (!onPress) return <View style={[surface, shadow, style]}>{body}</View>;

  // The clipping layer between shadow and pressable is what bounds the Android
  // ripple to the rounded corners — see `Card` for why it cannot be merged into
  // either neighbour.
  return (
    <View style={[shadow, { borderRadius: radius.row }]}>
      <View style={{ borderRadius: radius.row, overflow: 'hidden' }}>
        <Touchable
          radius={radius.row}
          onPress={onPress}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityRole={accessibilityRole}
          accessibilityState={accessibilityState}
          style={[surface, style]}
        >
          {body}
        </Touchable>
      </View>
    </View>
  );
}
