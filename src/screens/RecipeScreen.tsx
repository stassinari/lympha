/**
 * Choose a recipe from the range in use.
 *
 * The range is named for context, not as a way to change it: kits and their ranges
 * are chosen on the Kits screen. Every recipe is costed at the strength and volume
 * in use, so its subtitle describes what would actually be poured.
 *
 * The vendor's own grouping is kept: Apax's range has fifteen recipes, and fifteen
 * unlabelled rows is not something to read at 6am.
 */

import { RecipeRow, ScreenHeader } from '@/components';
import { componentMap, groupedRecipesForRange } from '@/data';
import { Caption, Screen, SectionHeader, space } from '@/design';
import { computeDose } from '@/engine';
import { groupLabel, recipeSubtitle } from '@/format/recipeList';
import { useDoseOptions, useRange, useRecipe, useStore, useStrength } from '@/state';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

export type RecipeScreenProps = { onClose: () => void };

export function RecipeScreen({ onClose }: RecipeScreenProps) {
  const range = useRange();
  const current = useRecipe();

  const volumeMl = useStore((s) => s.volumeMl);
  const options = useDoseOptions();
  const strength = useStrength();
  const setRecipe = useStore((s) => s.setRecipe);

  // Every recipe is costed at the volume in the kettle, so a row can say up front
  // that it would lose a mineral before you pick it.
  const groups = useMemo(
    () =>
      groupedRecipesForRange(range.id).map(({ group, recipes }) => ({
        label: groupLabel(group),
        rows: recipes.map((recipe) => {
          const dose = computeDose(recipe, volumeMl, componentMap, options);
          return {
            recipe,
            subtitle: recipeSubtitle(recipe, dose),
            colours: dose.lines.map((l) => l.component.colour),
          };
        }),
      })),
    [range.id, volumeMl, options],
  );

  return (
    <Screen horizontalPadding={0}>
      <ScreenHeader title="Recipe" onClose={onClose} />

      <View style={{ paddingTop: space.belowHeader, paddingHorizontal: space.screenH, gap: 2 }}>
        <Caption tone="secondary">
          {strength === 100 ? range.name : `${range.name} · ${strength}% strength`}
        </Caption>
        {range.displayNote ? <Caption tone="secondary">{range.displayNote}</Caption> : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: space.blocks,
          paddingBottom: space.loose,
          paddingHorizontal: space.screenH,
          gap: space.rows,
        }}
      >
        {groups.map(({ label, rows }, i) => (
          <View key={label ?? i} style={{ gap: space.rows }}>
            {label ? (
              <SectionHeader tone="secondary" style={{ marginTop: i === 0 ? 0 : space.snug }}>
                {label}
              </SectionHeader>
            ) : null}
            {rows.map(({ recipe, subtitle, colours }) => (
              <RecipeRow
                key={recipe.id}
                name={recipe.name}
                subtitle={subtitle}
                bottleColours={colours}
                selected={recipe.id === current.id}
                onPress={() => {
                  setRecipe(range.id, recipe.id);
                  onClose();
                }}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
