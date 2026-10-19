/**
 * How a kit's bottles are measured, on its fact sheet.
 *
 * Each option previews the *same dose* in that unit, so the choice is made against
 * real numbers rather than against the words "drops" and "grams". At a litre Apax
 * is 2 g or 30 drops of TONIK, and seeing both is the entire argument. The preview
 * is at the kit's strength, so it shows what will actually be weighed.
 *
 * Automatic is offered alongside them, and is the default: the unit follows the
 * magnitude of the dose unless overridden, so there has to be a way back to
 * letting it decide.
 */

import { useMemo } from 'react';
import { View } from 'react-native';
import { Caption, Card, CardTitle, SectionHeader, space } from '@/design';
import { componentMap, componentsForRange, getRecipe, kitOf, recipesForRange } from '@/data';
import { availableUnits, computeDose } from '@/engine';
import type { DoseLine, UnitPreference } from '@/engine';
import { ON_TARGET } from '@/format/rounding';
import { formatDoseAmount, formatUnit } from '@/format/units';
import { useDoseOptions, useStore } from '@/state';

const UNIT_NAME: Record<string, string> = {
  drop: 'Drops',
  g: 'Grams',
  ml: 'Millilitres',
  sachet: 'Sachets',
};

/** Whether a range's bottles can be measured more than one way. */
export const offersUnitChoice = (rangeId: string) =>
  availableUnits(componentsForRange(rangeId)).length > 1;

export type MeasureSectionProps = { rangeId: string };

export function MeasureSection({ rangeId }: MeasureSectionProps) {
  const volumeMl = useStore((s) => s.volumeMl);
  const rememberedId = useStore((s) => s.recipeIds[rangeId]);
  const { unitPreference, strength } = useDoseOptions(rangeId);
  const setUnitPreference = useStore((s) => s.setUnitPreference);
  const kitId = kitOf(rangeId).id;

  /**
   * Previewed against a recipe from *this* range, not the one currently in use.
   * Shown for Apax while Lotus is in use, the current recipe would put Lotus
   * bottles on Apax's sheet and price grams for a kit that has no scale.
   */
  const recipe = useMemo(() => {
    const remembered = rememberedId ? getRecipe(rememberedId) : undefined;
    return remembered?.range === rangeId ? remembered : recipesForRange(rangeId)[0];
  }, [rangeId, rememberedId]);

  const offered = useMemo(() => availableUnits(componentsForRange(rangeId)), [rangeId]);

  /** The same dose, read on each instrument. */
  const options = useMemo(() => {
    const out: { key: UnitPreference; label: string; preview: string }[] = [
      { key: 'auto', label: 'Automatic', preview: 'Drops for small batches, grams for large ones' },
    ];
    if (!recipe) return out;
    for (const unit of offered) {
      const line = computeDose(recipe, volumeMl, componentMap, { unitPreference: unit, strength })
        .lines[0];
      out.push({
        key: unit,
        label: UNIT_NAME[unit] ?? unit,
        preview: line
          ? `${formatDoseAmount(line.delivered, line.dispenser.step)} ${formatUnit(line.dispenser.unit, line.delivered)} of ${line.component.name} for ${volumeMl} ml${missSuffix(line)}`
          : '',
      });
    }
    return out;
  }, [offered, recipe, volumeMl, strength]);

  return (
    <>
      <SectionHeader tone="secondary" style={{ marginTop: space.snug }}>
        Measure in
      </SectionHeader>
      <View accessibilityRole="radiogroup" style={{ gap: space.rows }}>
        {options.map((option) => (
          <Card
            key={option.key}
            paddingVertical={14}
            paddingHorizontal={16}
            onPress={() => setUnitPreference(kitId, option.key)}
            accessibilityRole="radio"
            accessibilityLabel={`${option.label}. ${option.preview}`}
            selected={option.key === unitPreference}
          >
            <CardTitle>{option.label}</CardTitle>
            <Caption tone="secondary" style={{ marginTop: 2 }}>
              {option.preview}
            </Caption>
          </Card>
        ))}
      </View>
    </>
  );
}

/**
 * How far the previewed bottle misses, in drops only. Grams are read to 0.01 g,
 * which is exact for any practical purpose, so a gram preview never has one.
 */
function missSuffix(line: DoseLine): string {
  if (line.dispenser.allowPartial || line.exact <= 0) return '';
  const gap = line.error / line.exact;
  if (Math.abs(gap) < ON_TARGET) return '';
  return `, ${Math.round(Math.abs(gap) * 100)}% ${gap < 0 ? 'under' : 'over'}`;
}
