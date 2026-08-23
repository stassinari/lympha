/**
 * Finding a nearby volume where the recipe lands on whole units.
 *
 * At cup scale these recipes are not really reproducible: Rao's at 250 ml rounds
 * potassium to zero and the mineral disappears. The fix is almost always to brew
 * a slightly different amount, and that is a far better thing to offer than an
 * apology.
 *
 * Search rules come from the design handoff: step ±25 ml outward, up to 900 ml
 * away, never below 150 ml, and accept the first volume where every bottle lands
 * within 0.06 of a whole unit and none is under half a unit. Both directions are
 * searched at each distance, nearer first — a smaller honest volume is often the
 * better answer, and the design is explicit that the search must not prefer
 * "brew more".
 */

import type { Component, Recipe } from '@/data/types';
import { computeDose } from './dose';
import type { Dose, DoseOptions } from './dose';

export type CleanVolumeOptions = DoseOptions & {
  stepMl?: number;
  maxDistanceMl?: number;
  minVolumeMl?: number;
  /** How close to a whole unit counts as landing on it, as a fraction of the
   *  dispenser's step. */
  tolerance?: number;
};

const DEFAULTS = {
  stepMl: 25,
  maxDistanceMl: 900,
  minVolumeMl: 150,
  tolerance: 0.06,
};

/** Every bottle lands essentially on a whole unit, and none is so small it
 *  rounds away or sits under half a unit. */
export function landsCleanly(dose: Dose, tolerance = DEFAULTS.tolerance): boolean {
  if (dose.lines.length === 0) return false;
  return dose.lines.every((line) => {
    const { step } = line.dispenser;
    return Math.abs(line.error) < tolerance * step && line.exact >= 0.5 * step;
  });
}

/**
 * The nearest volume that divides evenly, or null if there isn't one.
 *
 * Returning null matters as much as returning a number: the design requires the
 * nudge to say so plainly rather than invent a suggestion.
 */
export function findCleanVolume(
  recipe: Recipe,
  components: ReadonlyMap<string, Component>,
  currentVolumeMl: number,
  options: CleanVolumeOptions = {},
): number | null {
  const { stepMl, maxDistanceMl, minVolumeMl, tolerance } = { ...DEFAULTS, ...options };

  const current = computeDose(recipe, currentVolumeMl, components, options);

  // Nothing to fix. Someone weighing grams has no rounding problem, and offering
  // them a different volume would be advice in search of a complaint.
  if (!current.showsRounding) return null;

  // Pin the search to the unit in use. Left free, the search drifts into whatever
  // regime happens to divide evenly — it would answer "brew 400 ml" to someone
  // holding a scale at a litre, which is not the same recipe experience at all.
  const pinned: CleanVolumeOptions = {
    ...options,
    unitPreference: current.lines[0]?.dispenser.unit ?? options.unitPreference ?? 'auto',
  };

  for (let distance = stepMl; distance <= maxDistanceMl; distance += stepMl) {
    // Smaller first at each distance: brewing less is usually the easier change.
    for (const candidate of [currentVolumeMl - distance, currentVolumeMl + distance]) {
      if (candidate < minVolumeMl) continue;
      const dose = computeDose(recipe, candidate, components, pinned);
      if (!dose.showsRounding) continue;
      if (landsCleanly(dose, tolerance)) return candidate;
    }
  }
  return null;
}
