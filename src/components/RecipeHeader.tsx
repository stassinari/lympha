/**
 * The recipe being made, and the way to change it.
 *
 * The kit is named in the header above, so the card carries the recipe alone.
 * The colour cluster identifies the palette before the name is read and doubles
 * as a bottle count; because a bottle at zero is absent from the recipe data, it
 * is always the right length with no filtering.
 */
import { View } from 'react-native';
import { BarCluster, Card, CardTitle, Icon, space, useTheme } from '@/design';
import type { SchemeColour } from '@/design';

export type RecipeHeaderProps = {
  recipeName: string;
  bottleColours: (SchemeColour | undefined)[];
  onPress: () => void;
};

export function RecipeHeader({ recipeName, bottleColours, onPress }: RecipeHeaderProps) {
  const { colour } = useTheme();
  return (
    <Card
      onPress={onPress}
      paddingVertical={14}
      paddingHorizontal={16}
      accessibilityLabel={`Recipe, ${recipeName}`}
      accessibilityHint="Changes the recipe"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <BarCluster colours={bottleColours} />
        <CardTitle numberOfLines={1} style={{ flex: 1 }}>
          {recipeName}
        </CardTitle>
        <Icon name="chevronDown" colour={colour.textSecondary} />
      </View>
    </Card>
  );
}
