/**
 * Choose a brand and a recipe, in one place.
 *
 * These were separate screens early in the design and were merged, because brand
 * alone is never the goal — nobody opens this wanting to "be on Apax". You come
 * here to change what you are making.
 *
 * The vendor's own grouping is kept. Apax's current range has fifteen recipes
 * against the flat list of five to seven the handoff drew, and fifteen unlabelled
 * rows is not something to read at 6am.
 */

import { useMemo } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import {
  BarCluster,
  Body,
  Caption,
  Chevron,
  Chip,
  Screen,
  ScreenTitle,
  SectionHeader,
  Touchable,
  resolveAccent,
  space,
  useTheme,
} from '@/design';
import { RecipeRow } from '@/components';
import { brands, componentMap, componentsForBrand, groupedRecipesForBrand } from '@/data';
import { computeDose } from '@/engine';
import { groupLabel, recipeSubtitle } from '@/format/recipeList';
import { unitPreferenceFor, useBrand, useRecipe, useStore } from '@/state';

/** A brand's palette, so it is recognised before the name is read. Static data,
 *  so it needs no hook. */
const clusterFor = (brandId: string) => componentsForBrand(brandId).map((c) => c.colour);

export type RecipeScreenProps = { onClose: () => void };

export function RecipeScreen({ onClose }: RecipeScreenProps) {
  const { colour, scheme } = useTheme();
  const brand = useBrand();
  const current = useRecipe();
  const accent = resolveAccent(brand.accent, scheme);

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: space.blocks,
          paddingHorizontal: space.screenH,
        }}
      >
        {Platform.OS === 'android' ? (
          <Touchable onPress={onClose} hitSlop={14} accessibilityLabel="Back">
            <Chevron direction="left" size={12} colour={colour.text} />
          </Touchable>
        ) : null}
        <ScreenTitle style={{ flex: 1, marginLeft: Platform.OS === 'android' ? 10 : 0 }}>
          Recipe
        </ScreenTitle>
        {Platform.OS === 'ios' ? (
          <Touchable onPress={onClose} hitSlop={14} accessibilityLabel="Done">
            <Body style={{ color: accent }}>Done</Body>
          </Touchable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Three brands already, and two of them are the same vendor.
        contentContainerStyle={{
          gap: space.snug,
          paddingHorizontal: space.screenH,
          // Room for the chips' own press feedback to render without being sliced
          // by the scroller's bounds.
          paddingVertical: 4,
        }}
        // Neither grows nor shrinks: a ScrollView in a flex column is shrinkable
        // by default, and the recipe list below can ask for far more height than
        // the screen has. Left alone, Apax's fifteen rows squeeze this row
        // noticeably shorter than Lotus's seven do.
        // Neither grows nor shrinks. A ScrollView sized to its content in a flex
        // column can squeeze its siblings, and this row sits above a list that is
        // fifteen rows long for Apax against seven for Lotus — which is exactly
        // when the chips were measured 18% shorter.
        style={{ flexGrow: 0, flexShrink: 0 }}
      >
        {brands.map((b) => (
          <Chip
            key={b.id}
            label={b.shortName}
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
        // pushing against the row above — which is what did the squeezing.
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

      <Caption
        tone="secondary"
        style={{ paddingVertical: space.snug, paddingHorizontal: space.screenH + 8 }}
      >
        Switching brand keeps your volume.
      </Caption>
    </Screen>
  );
}
