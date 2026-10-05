/**
 * The whole calculation, end to end: recipe + volume → what to do at the counter.
 *
 *   scale → pick a unit → quantise → report
 *
 * Everything above is pure and takes its components as an argument, so the engine
 * never reaches into the registry and can be tested against fixtures.
 */

import type { Component, Dispenser, Recipe } from '@/data/types';
import { defaultDispenserFor, quantise, toDispenserUnits } from './quantise';
import type { Quantised } from './quantise';
import { scaleAdditions } from './scale';
import { chooseUnit } from './units';
import type { UnitPreference } from './units';
import { canComputeProfile, compareProfiles, deliveredProfile, targetProfile } from './profile';
import type { ProfileComparison } from './profile';

export type DoseLine = Quantised & {
  component: Component;
  dispenser: Dispenser;
  /** The same dose read on the other instrument, for the row subtitle. Absent
   *  when the component offers only one. */
  alternative?: { dispenser: Dispenser; exact: number; delivered: number };
};

export type Dose = {
  recipe: Recipe;
  volumeMl: number;
  lines: DoseLine[];
  /**
   * Whether rounding is worth mentioning.
   *
   * False when the active dispenser can deliver partial units — a scale reading
   * to 0.01 g rounds too, but saying so would be noise dressed up as honesty.
   * Keyed on the dispenser rather than on grams, so it stays correct for a brand
   * that ships something else.
   */
  showsRounding: boolean;
  /** Worst relative error across the bottles. Zero when rounding is suppressed. */
  worstError: number;
  /** Bottles the recipe calls for that would round away to nothing. */
  zeroed: DoseLine[];
  /** Null where the vendor publishes no ion quantities. */
  profile: ProfileComparison | null;
};

export type DoseOptions = {
  /** Per brand, from settings. `auto` lets magnitude decide. */
  unitPreference?: UnitPreference;
};

export function computeDose(
  recipe: Recipe,
  volumeMl: number,
  components: ReadonlyMap<string, Component>,
  options: DoseOptions = {},
): Dose {
  const scaled = scaleAdditions(recipe, volumeMl);

  const resolved = scaled.map((addition) => {
    const component = components.get(addition.component);
    if (!component) {
      throw new Error(`Recipe "${recipe.id}" names unknown component "${addition.component}"`);
    }
    return { component, amountInDoseUnits: addition.amount };
  });

  const unit = chooseUnit(resolved, options.unitPreference ?? 'auto');

  const lines: DoseLine[] = resolved.map(({ component, amountInDoseUnits }) => {
    const dispenser =
      component.dispensers.find((d) => d.unit === unit) ?? defaultDispenserFor(component);
    const other = component.dispensers.find((d) => d.id !== dispenser.id);
    const alternative = other
      ? {
          dispenser: other,
          exact: toDispenserUnits(amountInDoseUnits, other),
          delivered: quantise(amountInDoseUnits, other).delivered,
        }
      : undefined;

    return {
      component,
      dispenser,
      ...quantise(amountInDoseUnits, dispenser),
      ...(alternative ? { alternative } : {}),
    };
  });

  const showsRounding = lines.some((l) => !l.dispenser.allowPartial);
  const zeroed = lines.filter((l) => l.zeroed);

  return {
    recipe,
    volumeMl,
    lines,
    showsRounding,
    worstError: showsRounding ? Math.max(0, ...lines.map((l) => l.relativeError)) : 0,
    zeroed,
    profile: profileFor(recipe, lines, components, volumeMl),
  };
}

function profileFor(
  recipe: Recipe,
  lines: DoseLine[],
  components: ReadonlyMap<string, Component>,
  volumeMl: number,
): ProfileComparison | null {
  if (!canComputeProfile(recipe, components)) return null;

  const target = targetProfile(recipe, components);
  if (!target) return null;

  // Back into dose units: the profile is a property of what is in the jug, so it
  // has to be computed from the quantised reading rather than from the ideal.
  const delivered = deliveredProfile(
    lines.map((l) => ({
      component: l.component.id,
      amount: l.delivered * l.dispenser.equivalentInDoseUnit,
    })),
    components,
    volumeMl,
  );
  if (!delivered) return null;

  return compareProfiles(target, delivered);
}
