/**
 * How a brand's concentrate is measured.
 *
 * Each option previews the *same dose* in that unit, so the choice is made against
 * real numbers rather than against the words "drops" and "grams". At a litre Apax
 * is 2 g or 30 drops of TONIK, and seeing both is the entire argument.
 *
 * Automatic is offered alongside them, and is the default. The brief asks for the
 * unit to follow the magnitude of the dose with an override available — so there
 * has to be a way back to letting it decide.
 */

import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import {
  BarRow,
  Body,
  Caption,
  Card,
  CardTitle,
  Screen,
  SectionHeader,
  resolveAccent,
  space,
  useTheme,
} from '@/design';
import { ScreenHeader } from '@/components';
import { componentMap, componentsForBrand, getBrand, getRecipe, recipesForBrand } from '@/data';
import type { DoseUnit } from '@/data/types';
import { availableUnits, computeDose } from '@/engine';
import type { UnitPreference } from '@/engine';
import { formatDoseAmount, formatUnit } from '@/format/units';
import { unitPreferenceFor, useStore } from '@/state';

const UNIT_NAME: Record<string, string> = {
  drop: 'Drops',
  g: 'Grams',
  ml: 'Millilitres',
  sachet: 'Sachets',
};

export type UnitScreenProps = { brandId: string; onClose: () => void };

export function UnitScreen({ brandId, onClose }: UnitScreenProps) {
  const { colour, scheme } = useTheme();
  const brand = getBrand(brandId);
  const volumeMl = useStore((s) => s.volumeMl);
  const rememberedId = useStore((s) => s.recipeIds[brandId]);

  /**
   * Previewed against a recipe from *this* brand, not the one currently selected.
   * Reached from settings while Lotus is active, the currently-selected recipe
   * would put Lotus bottles on Apax's screen and price grams for a brand that has
   * no scale.
   */
  const recipe = useMemo(() => {
    const remembered = rememberedId ? getRecipe(rememberedId) : undefined;
    return remembered?.brand === brandId ? remembered : recipesForBrand(brandId)[0];
  }, [brandId, rememberedId]);
  // Read through `unitPreferenceFor`, which resolves the unit group. Reading the
  // map by brand id misses — the key is the group ("apax", not "apax-lab") — so
  // every option but Automatic looked unselected while the write landed correctly.
  const preference = useStore((s) => unitPreferenceFor(s, brandId));
  const setUnitPreference = useStore((s) => s.setUnitPreference);

  const offered = useMemo(() => availableUnits(componentsForBrand(brandId)), [brandId]);
  const accent = brand ? resolveAccent(brand.accent, scheme) : colour.text;

  /** The same dose, read on each instrument. */
  const previews = useMemo(() => {
    const options: { key: UnitPreference; label: string; preview: string }[] = [
      { key: 'auto', label: 'Automatic', preview: 'Whichever suits the volume' },
    ];
    if (!recipe) return options;
    for (const unit of offered) {
      const dose = computeDose(recipe, volumeMl, componentMap, { unitPreference: unit });
      const line = dose.lines[0];
      options.push({
        key: unit,
        label: UNIT_NAME[unit] ?? unit,
        preview: line
          ? `${line.component.name} — ${formatDoseAmount(line.delivered, line.dispenser.step)} ${formatUnit(line.dispenser.unit, line.delivered)} at ${volumeMl} ml`
          : '',
      });
    }
    return options;
  }, [offered, recipe, volumeMl]);

  return (
    <Screen horizontalPadding={0}>
      <ScreenHeader title={brand?.shortName ?? 'Concentrate'} onClose={onClose} accent={accent} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.screenH,
          paddingTop: space.belowHeader,
          paddingBottom: space.loose,
          gap: space.rows,
        }}
      >
        <SectionHeader tone="secondary">Measure in</SectionHeader>
        <View accessibilityRole="radiogroup" style={{ gap: space.rows }}>
          {previews.map((option) => (
            <Card
              key={option.key}
              paddingVertical={14}
              paddingHorizontal={16}
              onPress={() => setUnitPreference(brandId, option.key)}
              accessibilityRole="radio"
              accessibilityLabel={`${option.label}. ${option.preview}`}
              selected={option.key === preference}
            >
              <CardTitle>{option.label}</CardTitle>
              <Caption tone="secondary" style={{ marginTop: 2 }}>
                {option.preview}
              </Caption>
            </Card>
          ))}
        </View>

        {offered.includes('drop' as DoseUnit) && offered.length > 1 ? (
          // Kept in the dose-row anatomy so a caution reads as the same family of
          // object as a dose, not as an error.
          <BarRow barColour={colour.warning} style={{ marginTop: space.snug }}>
            <CardTitle>Drops are the least precise</CardTitle>
            <Body tone="onCard" style={{ marginTop: 4 }}>
              Dropper size varies between bottles. If you own a scale, grams will get you closer to
              the recipe than counting will.
            </Body>
          </BarRow>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
