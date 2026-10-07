/**
 * Choose a brand and a recipe, in one place.
 *
 * One screen for both, because brand alone is never the goal — nobody opens this
 * wanting to "be on Apax". You come here to change what you are making.
 *
 * The vendor's own grouping is kept: Apax's range has fifteen recipes, and fifteen
 * unlabelled rows is not something to read at 6am.
 */

import { RecipeRow, ScreenHeader } from '@/components';
import { brands, componentMap, componentsForBrand, groupedRecipesForBrand } from '@/data';
import { BarCluster, Caption, Chip, Screen, SectionHeader, space } from '@/design';
import { computeDose } from '@/engine';
import { groupLabel, recipeSubtitle } from '@/format/recipeList';
import { unitPreferenceFor, useBrand, useRecipe, useStore } from '@/state';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

/** A brand's palette, so it is recognised before the name is read. Static data,
 *  so it needs no hook. */
const clusterFor = (brandId: string) => componentsForBrand(brandId).map((c) => c.colour);

export type RecipeScreenProps = { onClose: () => void };

export function RecipeScreen({ onClose }: RecipeScreenProps) {
  const brand = useBrand();
  const current = useRecipe();

  const volumeMl = useStore((s) => s.volumeMl);
  const preference = useStore((s) => unitPreferenceFor(s, s.brandId));
  const setBrand = useStore((s) => s.setBrand);
  const setRecipe = useStore((s) => s.setRecipe);

  // Every recipe is costed at the volume in the kettle, so a row can say up front
  // that it would lose a mineral before you pick it.
  const groups = useMemo(
    () =>
      groupedRecipesForBrand(brand.id).map(({ group, recipes }) => ({
        label: groupLabel(group),
        rows: recipes.map((recipe) => {
          const dose = computeDose(recipe, volumeMl, componentMap, {
            unitPreference: preference,
          });
          return {
            recipe,
            subtitle: recipeSubtitle(recipe, dose),
            colours: dose.lines.map((l) => l.component.colour),
          };
        }),
      })),
    [brand.id, volumeMl, preference],
  );

  return (
    <Screen horizontalPadding={0}>
      <ScreenHeader title="Recipe" onClose={onClose} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Three brands already, and two of them are the same vendor.
        contentContainerStyle={{
          gap: space.snug,
          paddingHorizontal: space.screenH,
          // Room for the chips' own press feedback to render without being sliced
          // by the scroller's bounds. The top is the shared start line under the
          // header, which is more than that room and so covers it.
          paddingTop: space.belowHeader,
          paddingBottom: 4,
        }}
        // Neither grows nor shrinks: a ScrollView in a flex column is shrinkable
        // by default, and the recipe list below can ask for far more height than
        // the screen has, so Apax's fifteen rows would squeeze this row noticeably
        // shorter than Lotus's seven.
        style={{ flexGrow: 0, flexShrink: 0 }}
      >
        {brands.map((b) => (
          <Chip
            key={b.id}
            label={b.shortName}
            accessibilityLabel={b.spokenShortName}
            selected={b.id === brand.id}
            onPress={() => setBrand(b.id)}
            leading={<BarCluster size="chip" colours={clusterFor(b.id)} />}
          />
        ))}
      </ScrollView>

      {brand.displayNote ? (
        <Caption
          tone="secondary"
          style={{ marginTop: space.snug, paddingHorizontal: space.screenH }}
        >
          {brand.displayNote}
        </Caption>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        // Takes exactly the space left over, rather than sizing to its content and
        // squeezing the row above.
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
                  setRecipe(brand.id, recipe.id);
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
