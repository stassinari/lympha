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
  );
}
