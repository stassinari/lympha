/**
 * Scaling a recipe from its reference volume to the volume in the kettle.
 *
 * Trivial arithmetic, kept as its own step because it is the one place the
 * recipe's `scaling` mode is honoured — and because everything downstream
 * depends on the amount still being unrounded at this point.
 */

import type { Addition, Recipe } from '@/data/types';

export class UnsupportedScalingError extends Error {}

/**
 * `strength` is a share of every amount, for lighter water at the same volume:
 * the recipe keeps its ratio. See *Strength* in `docs/decisions.md`.
 */
export function scaleAdditions(recipe: Recipe, targetVolumeMl: number, strength = 1): Addition[] {
  if (recipe.scaling !== 'linear') {
    throw new UnsupportedScalingError(`Recipe "${recipe.id}" uses unsupported scaling`);
  }
  if (targetVolumeMl <= 0) {
    throw new RangeError(`Volume must be positive, got ${targetVolumeMl}`);
  }

  const factor = (targetVolumeMl / recipe.referenceVolumeMl) * strength;
  return recipe.additions.map((a) => ({ component: a.component, amount: a.amount * factor }));
}
