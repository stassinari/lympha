/**
 * What you are making, and the way to change it.
 *
 * The whole card is one tap target — brand and recipe are chosen together, since
 * brand alone is never the goal. The colour cluster identifies the palette before
 * the name is read and doubles as a bottle count; because a bottle at zero is
 * absent from the recipe data, it is always the right length with no filtering.
 */

import { View } from 'react-native';
import { BarCluster, Caption, Card, CardTitle, Icon, space, useTheme } from '@/design';
import type { SchemeColour } from '@/design';

export type RecipeHeaderProps = {
  recipeName: string;
  brandName: string;
  bottleColours: (SchemeColour | undefined)[];
  onPress: () => void;
};

export function RecipeHeader({ recipeName, brandName, bottleColours, onPress }: RecipeHeaderProps) {
  const { colour } = useTheme();

  return (
    <Card
      onPress={onPress}
      paddingVertical={14}
      paddingHorizontal={16}
      accessibilityLabel={`${recipeName}, ${brandName}`}
      accessibilityHint="Changes the brand or recipe"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <BarCluster colours={bottleColours} />
        <View style={{ flex: 1 }}>
          <CardTitle numberOfLines={1}>{recipeName}</CardTitle>
          <Caption tone="secondary" numberOfLines={1}>
            {brandName}
          </Caption>
        </View>
        <Icon name="chevronDown" colour={colour.textSecondary} />
      </View>
    </Card>
  );
}
