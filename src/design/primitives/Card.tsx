import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { cardShadow, radius, space, useTheme } from '../theme';
import { Touchable } from './Touchable';

export type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  paddingVertical?: number;
  paddingHorizontal?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
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
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const { colour } = useTheme();

  const surface: ViewStyle = {
    backgroundColor: colour.card,
    borderRadius: radius.card,
    paddingVertical,
    paddingHorizontal,
  };

  if (!onPress) return <View style={[surface, cardShadow, style]}>{children}</View>;

  return (
    <View style={[cardShadow, { borderRadius: radius.card }]}>
      <View style={{ borderRadius: radius.card, overflow: 'hidden' }}>
        <Touchable
          radius={radius.card}
          onPress={onPress}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={[surface, style]}
        >
          {children}
        </Touchable>
      </View>
    </View>
  );
}
