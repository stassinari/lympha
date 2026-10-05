/**
 * Choosing the unit to show a dose in.
 *
 * The same product needs different units at different volumes, and this is not
 * cosmetic. Apax at a litre is about sixty drops — nobody counts sixty drops
 * before coffee — while the same recipe at 200 ml is a dozen, which is easy.
 * Pull the other way and grams stop working: Apax's smallest dose, 0.5 g/L, is
 * 0.1 g at 200 ml, finer than most kitchen scales resolve.
 *
 * So the unit follows the magnitude of the dose rather than a stored preference,
 * with an override available. Lotus is unaffected — its bottles have exactly one
 * dispenser, so there is nothing to choose.
 */

import type { Component, DoseUnit } from '@/data/types';
import { toDispenserUnits } from './quantise';

/**
 * Above this many drops for a single bottle, counting stops being reasonable and
 * a scale is the better instrument. A judgement call between the two cases in
 * `docs/decisions.md` (Units follow magnitude): twelve drops is fine, sixty is not.
 */
export const MAX_COMFORTABLE_DROPS = 20;

export type UnitPreference = 'auto' | DoseUnit;

/**
 * Pick one unit for the whole recipe.
 *
 * Deliberately not per bottle: showing TONIK in grams beside JAMM in drops would
 * mean picking up two instruments for one jug.
 */
export function chooseUnit(
  amountsByComponent: { component: Component; amountInDoseUnits: number }[],
  preference: UnitPreference = 'auto',
): DoseUnit | undefined {
  const available = availableUnits(amountsByComponent.map((a) => a.component));
  if (available.length === 0) return undefined;

  if (preference !== 'auto' && available.includes(preference)) return preference;

  const fallback = available[0];
  if (available.length === 1 || !available.includes('drop')) return fallback;

  // A drop-based dispenser exists alongside something else. Use it only while the
  // counts stay manageable.
  const worstDropCount = Math.max(
    ...amountsByComponent.map(({ component, amountInDoseUnits }) => {
      const dropper = component.dispensers.find((d) => d.unit === 'drop');
      return dropper ? toDispenserUnits(amountInDoseUnits, dropper) : 0;
    }),
  );

  if (worstDropCount <= MAX_COMFORTABLE_DROPS) return 'drop';
  return available.find((u) => u !== 'drop') ?? fallback;
}

/** Units offered by every one of these components, so one choice covers them all. */
export function availableUnits(components: Component[]): DoseUnit[] {
  if (components.length === 0) return [];
  const [first, ...rest] = components;
  const units = first!.dispensers.map((d) => d.unit);
  return units.filter((unit) => rest.every((c) => c.dispensers.some((d) => d.unit === unit)));
}
