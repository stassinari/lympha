/**
 * Turning a stated target into the amounts you actually add.
 *
 * Target-first vendors (Lotus) publish a profile in ppm as CaCO₃ and leave the
 * dose implied. Storing their published drop counts instead would throw away the
 * ideal — and without an ideal there is nothing to compare the rounded dose
 * against, which is the whole point of this app. So the profile is the authored
 * truth and the additions are derived here.
 */

import type { Addition, Component, TargetEntry } from '@/data/types';

/**
 * Total CaCO₃ a single dose unit of this component contributes to one litre.
 *
 * A component donates hardness or alkalinity; summing them is correct for the
 * degenerate case of one that donates both, and is simply the one value present
 * for every component modelled so far.
 */
export function caco3PerDoseUnitPerLitre(component: Component): number {
  const asCaCO3 = component.ions?.asCaCO3;
  if (!asCaCO3) return 0;
  return (asCaCO3.hardness ?? 0) + (asCaCO3.alkalinity ?? 0);
}

export class UnresolvableTargetError extends Error {}

/**
 * Convert a target profile into additions, in each component's dose unit, at the
 * given reference volume.
 *
 * Amounts are deliberately left unrounded. Quantising is a property of the
 * dispenser you happen to be holding, not of the recipe, and it happens at the
 * point of display.
 */
export function additionsFromTarget(
  target: readonly TargetEntry[],
  components: ReadonlyMap<string, Component>,
  referenceVolumeMl: number,
): Addition[] {
  const litres = referenceVolumeMl / 1000;

  return target.map(({ component: id, caco3Ppm }) => {
    const component = components.get(id);
    if (!component) {
      throw new UnresolvableTargetError(`Target names unknown component "${id}"`);
    }

    const perUnit = caco3PerDoseUnitPerLitre(component);
    if (perUnit <= 0) {
      throw new UnresolvableTargetError(
        `Component "${id}" publishes no CaCO₃ contribution, so a ppm target ` +
          `cannot be converted into a dose.`,
      );
    }

    return { component: id, amount: (caco3Ppm / perUnit) * litres };
  });
}
