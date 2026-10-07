/**
 * How a brand's concentrate is measured.
 *
 * Each option previews the *same dose* in that unit, so the choice is made against
 * real numbers rather than against the words "drops" and "grams". At a litre Apax
 * is 2 g or 30 drops of TONIK, and seeing both is the entire argument.
 *
 * Automatic is offered alongside them, and is the default: the unit follows the
 * magnitude of the dose unless overridden, so there has to be a way back to
 * letting it decide.
 */

import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import {
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
import {
  componentMap,
  componentsForBrand,
  getBrand,
  getRecipe,
  recipesForBrand,
  unitGroupOf,
  unitGroups,
} from '@/data';
import { availableUnits, computeDose } from '@/engine';
import type { DoseLine, UnitPreference } from '@/engine';
import { EXACT } from '@/format/rounding';
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
  // Both Apax ranges share this screen, as they share the setting, so it carries
  // the setting's name rather than either range's.
  const groupName =
    unitGroups().find((g) => g.id === unitGroupOf(brandId))?.label ?? brand?.name ?? '';
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
  // Read through `unitPreferenceFor`, which resolves the unit group. The map is
  // keyed by group ("apax", not "apax-lab"), so reading it by brand id misses and
  // every option but Automatic shows as unselected.
  const preference = useStore((s) => unitPreferenceFor(s, brandId));
  const setUnitPreference = useStore((s) => s.setUnitPreference);

  const offered = useMemo(() => availableUnits(componentsForBrand(brandId)), [brandId]);
  const accent = brand ? resolveAccent(brand.accent, scheme) : colour.text;

  /** The same dose, read on each instrument. */
  const previews = useMemo(() => {
    const options: { key: UnitPreference; label: string; preview: string }[] = [
      { key: 'auto', label: 'Automatic', preview: 'Drops for small batches, grams for large ones' },
    ];
    if (!recipe) return options;
    for (const unit of offered) {
      const dose = computeDose(recipe, volumeMl, componentMap, { unitPreference: unit });
      const line = dose.lines[0];
      options.push({
        key: unit,
        label: UNIT_NAME[unit] ?? unit,
        preview: line
          ? `${formatDoseAmount(line.delivered, line.dispenser.step)} ${formatUnit(line.dispenser.unit, line.delivered)} of ${line.component.name} for ${volumeMl} ml${missSuffix(line)}`
          : '',
      });
    }
    return options;
  }, [offered, recipe, volumeMl]);

  return (
    <Screen horizontalPadding={0}>
      <ScreenHeader title={groupName} onClose={onClose} accent={accent} />

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
      </ScrollView>
    </Screen>
  );
}

/**
 * How far the previewed bottle misses, in drops only. Grams are read to 0.01 g,
 * which is exact for any practical purpose, so a gram preview never has one.
 */
function missSuffix(line: DoseLine): string {
  if (line.dispenser.allowPartial || line.exact <= 0) return '';
  const gap = line.error / line.exact;
  if (Math.abs(gap) < EXACT) return '';
  return `, ${Math.round(Math.abs(gap) * 100)}% ${gap < 0 ? 'under' : 'over'}`;
}
