/**
 * One recipe in the picker.
 *
 * Mark, then name, then the selection check — the same order as the brand chips
 * above it and the recipe card on Home, both of which lead with the cluster. It
 * reads as "what this recipe uses" in the position where the eye already expects
 * to find that answer.
 *
 * Unlike a dose row the cluster is not a flush leading stripe: it sits inside the
 * card's padding, in a reserved column, as an identifier rather than an edge.
 * Apax's "Light Roast" shows three bars, "Dark Roast" three, Lotus's "Light and
 * Bright" two, and none of that needs a word.
 */

import { View } from 'react-native';
import {
  BarCluster,
  Caption,
  Card,
  CardTitle,
  Icon,
  clusterWidth,
  space,
  useTheme,
} from '@/design';
import type { SchemeColour } from '@/design';
import type { RecipeSubtitle } from '@/format/recipeList';

/**
 * The mark's column, fixed at the width of the longest cluster rather than sized
 * to each row's own.
 *
 * A column that shrank to fit would give every row a different title indent, and
 * a list whose names start at seven different x is exactly the ragged left edge
 * the fixed column exists to prevent. Four is the most bottles either range
 * ships, so it is the width every row reserves; the bars sit left-aligned inside
 * it, so a two-bottle recipe is short rather than centred and floating.
 *
 * React Native's `flexShrink` defaults to 0, so the column holds its width
 * against a long title without being told to.
 */
const MOST_BOTTLES = 4;
const CLUSTER_COLUMN = clusterWidth('row', MOST_BOTTLES);

/**
 * The selection mark, on the trailing edge.
 *
 * A 2pt outline alone is too weak a signal: it sits directly under the brand
 * chips, whose selected state is an unmistakable dark fill, and loses the
 * comparison. A check says the same thing in a shape, and says it to anyone who
 * cannot resolve a hairline against a card edge. The outline is kept; selection
 * is one signal stated twice, not two competing ones, which is also why the check
 * is ink rather than the accent.
 *
 * Its slot is reserved on every row, but that costs nothing here: it is the
 * trailing edge, and nothing in the row aligns to it. The same slot at the
 * leading edge would indent every title to make room for a mark that appears on
 * one.
 */
const CHECK = 20;

export type RecipeRowProps = {
  name: string;
  subtitle: RecipeSubtitle | null;
  bottleColours: (SchemeColour | undefined)[];
  selected: boolean;
  onPress: () => void;
};

export function RecipeRow({ name, subtitle, bottleColours, selected, onPress }: RecipeRowProps) {
  const { colour } = useTheme();

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
      {/* Centred, like the Home card: the cluster and the check both sit on the
          middle of the two-line name-and-author block rather than on either line. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
        <BarCluster size="row" colours={bottleColours} style={{ width: CLUSTER_COLUMN }} />
        <View style={{ flex: 1 }}>
          <CardTitle numberOfLines={1}>{name}</CardTitle>
          {subtitle ? (
            <Caption tone={subtitle.tone} numberOfLines={1}>
              {subtitle.text}
            </Caption>
          ) : null}
        </View>
        <View style={{ width: CHECK }}>
          {selected ? <Icon name="check" size={CHECK} colour={colour.text} /> : null}
        </View>
      </View>
    </Card>
  );
}
