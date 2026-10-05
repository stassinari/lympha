import { View } from 'react-native';
import type { AccessibilityRole, StyleProp, ViewStyle } from 'react-native';
import { cardShadow, radius, space, useTheme } from '../theme';
import { Touchable } from './Touchable';

/** Always drawn, transparent when unselected, so geometry never changes. */
const SELECTION_BORDER = 2;

export type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  paddingVertical?: number;
  paddingHorizontal?: number;
  onPress?: () => void;
  /**
   * Draws the selection outline.
   *
   * Handled here rather than by the caller because the border must be present in
   * both states and only change colour. Adding 2px on selection moves the content
   * box, which reads as the card twitching — and on Android re-lays-out a clipped,
   * rippling view and can leave it blank.
   */
  selected?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** `radio` where the card is one of a mutually exclusive set. */
  accessibilityRole?: AccessibilityRole;
};

/**
 * The default surface. A whole card is often a single tap target — the recipe
 * header is one — so pressability is built in rather than wrapped around.
 *
 * Three layers, not two, and each is load-bearing:
 *
 *   shadow   — borderRadius + elevation, never clipped, or the shadow vanishes
 *   clip     — borderRadius + overflow hidden, which is what bounds the ripple
 *   pressable — the surface itself
 *
 * `overflow: 'hidden'` clips a view's *children*, not its own background, and on
 * Android the ripple is a background drawable. Put it on the pressable and the
 * ripple still paints square corners over the rounded card; put it on the layer
 * above and the ripple is clipped as a child. It cannot go on the shadow layer,
 * because clipping there would cut off the shadow it exists to cast.
 */
export function Card({
  children,
  style,
  paddingVertical = space.cardV,
  paddingHorizontal = space.cardH,
  onPress,
  selected = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
}: CardProps) {
  const { colour } = useTheme();

  const surface: ViewStyle = {
    backgroundColor: colour.card,
    borderRadius: radius.card,
    borderWidth: SELECTION_BORDER,
    borderColor: selected ? colour.text : 'transparent',
    // The border eats into the padding, so it is given back — a selected and an
    // unselected card must have identical interiors.
    paddingVertical: paddingVertical - SELECTION_BORDER,
    paddingHorizontal: paddingHorizontal - SELECTION_BORDER,
  };

  if (!onPress) return <View style={[surface, cardShadow, style]}>{children}</View>;

  return (
    <View style={[cardShadow, { borderRadius: radius.card }]}>
      <View style={{ borderRadius: radius.card, overflow: 'hidden' }}>
        <Touchable
          radius={radius.card}
          onPress={onPress}
          accessibilityRole={accessibilityRole}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ selected, checked: selected }}
          style={[surface, style]}
        >
          {children}
        </Touchable>
      </View>
    </View>
  );
}
