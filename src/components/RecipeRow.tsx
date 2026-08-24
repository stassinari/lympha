/**
 * One recipe in the picker.
 *
 * Unlike a dose row this has no flush leading bar — the bottle cluster sits on
 * the right, where it reads as "what this recipe uses" rather than as an identity
 * stripe. Apax's "Light Roast" shows three bars, "Dark Roast" three, Lotus's
 * "Light and Bright" two, and none of that needs a word.
 */

import { View } from 'react-native';
import { BarCluster, Caption, Card, CardTitle, space } from '@/design';
import type { SchemeColour } from '@/design';
import type { RecipeSubtitle } from '@/format/recipeList';

export type RecipeRowProps = {
  name: string;
  subtitle: RecipeSubtitle | null;
  bottleColours: (SchemeColour | undefined)[];
  selected: boolean;
  onPress: () => void;
};

export function RecipeRow({ name, subtitle, bottleColours, selected, onPress }: RecipeRowProps) {
  return (
    <Card
      onPress={onPress}
      paddingVertical={14}
      paddingHorizontal={16}
      accessibilityRole="radio"
      accessibilityLabel={subtitle ? `${name}. ${subtitle.text}` : name}
      // Outlined rather than filled: a filled row would fight the bottle colours
      // sitting inside it, and colour is never the only signal.
      selected={selected}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <View style={{ flex: 1 }}>
          <CardTitle numberOfLines={1}>{name}</CardTitle>
          {subtitle ? (
            <Caption tone={subtitle.tone} numberOfLines={1}>
              {subtitle.text}
            </Caption>
          ) : null}
        </View>
        <BarCluster size="row" colours={bottleColours} />
      </View>
    </Card>
  );
}
