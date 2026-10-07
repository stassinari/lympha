/**
 * What the water actually ends up like, in ppm as CaCO₃.
 *
 * Only available where the vendor publishes ion quantities. Lotus does; Apax
 * publishes ingredient lists but no amounts, so any brand-wide profile for Apax
 * would be invention. `null` here is a real answer, and screens are expected to
 * omit the section rather than show zeroes.
 */

import type { Component, Recipe } from '@/data/types';

export type Profile = {
  hardness: number;
  alkalinity: number;
};

export type ProfileComparison = {
  /** What the recipe asks for. Volume-independent — ppm is a concentration. */
  target: Profile;
  /** What the quantised dose actually delivers at this volume. */
  delivered: Profile;
  /** Signed and relative. Negative means the water is softer than the target. */
  hardnessError: number;
  alkalinityError: number;
};

const EMPTY: Profile = { hardness: 0, alkalinity: 0 };

/** Whether every component in this recipe publishes enough to compute a profile. */
export function canComputeProfile(
  recipe: Recipe,
  components: ReadonlyMap<string, Component>,
): boolean {
  if (!recipe.target) return false;
  return recipe.additions.every((a) => components.get(a.component)?.ions !== undefined);
}

export function targetProfile(
  recipe: Recipe,
  components: ReadonlyMap<string, Component>,
): Profile | null {
  if (!recipe.target) return null;

  let hardness = 0;
  let alkalinity = 0;
  for (const entry of recipe.target) {
    const asCaCO3 = components.get(entry.component)?.ions?.asCaCO3;
    if (!asCaCO3) return null;
    // A bottle donates hardness or alkalinity; which one is a property of the
    // component, not of the recipe.
    if (asCaCO3.hardness) hardness += entry.caco3Ppm;
    if (asCaCO3.alkalinity) alkalinity += entry.caco3Ppm;
  }
  return { hardness, alkalinity };
}

/**
 * The profile a set of delivered doses actually produces.
 *
 * `deliveredInDoseUnits` is post-quantisation — whole drops, not the ideal — which
 * is the entire point: this is what is in the jug, not the target.
 */
export function deliveredProfile(
  deliveredInDoseUnits: { component: string; amount: number }[],
  components: ReadonlyMap<string, Component>,
  volumeMl: number,
): Profile | null {
  const litres = volumeMl / 1000;
  if (litres <= 0) throw new RangeError(`Volume must be positive, got ${volumeMl}`);

  let hardness = 0;
  let alkalinity = 0;
  for (const { component: id, amount } of deliveredInDoseUnits) {
    const asCaCO3 = components.get(id)?.ions?.asCaCO3;
    if (!asCaCO3) return null;
    hardness += ((asCaCO3.hardness ?? 0) * amount) / litres;
    alkalinity += ((asCaCO3.alkalinity ?? 0) * amount) / litres;
  }
  return { hardness, alkalinity };
}

const relative = (delivered: number, target: number) =>
  target === 0 ? 0 : (delivered - target) / target;

export function compareProfiles(target: Profile, delivered: Profile): ProfileComparison {
  return {
    target,
    delivered,
    hardnessError: relative(delivered.hardness, target.hardness),
    alkalinityError: relative(delivered.alkalinity, target.alkalinity),
  };
}

export const emptyProfile = (): Profile => ({ ...EMPTY });
