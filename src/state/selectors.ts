/**
 * What the screens actually ask for.
 *
 * Derived values are computed here rather than stored, so there is nothing to
 * keep in sync and nothing to invalidate. Each hook selects primitives out of the
 * store — selecting an object would return a fresh reference every render and
 * defeat the comparison that stops the re-render.
 */

import { useMemo } from 'react';
import { componentMap, getRange, getRecipe, kitOf } from '@/data';
import type { Kit, Range, Recipe } from '@/data/types';
import { computeDose, findExactVolume } from '@/engine';
import type { Dose, DoseOptions } from '@/engine';
import { roundingSummary } from '@/format/rounding';
import type { RoundingSummary } from '@/format/rounding';
import { DEFAULTS, recipeIdFor, strengthFor, unitPreferenceFor } from './model';
import { useStore } from './store';

export function useRange(): Range {
  const rangeId = useStore((s) => s.rangeId);
  // Repair keeps this true across launches; the fallback covers a range removed
  // while the app is open, which only a developer will ever see.
  return getRange(rangeId) ?? getRange(DEFAULTS.rangeId)!;
}

export function useKit(): Kit {
  return kitOf(useRange().id);
}

/** The current kit's strength, in whole percent. */
export function useStrength(): number {
  return useStore((s) => strengthFor(s, kitOf(s.rangeId).id));
}

/**
 * Everything the engine needs besides recipe and volume, for `rangeId` or the
 * range in use. Every dose a screen shows goes through this, so strength and the
 * unit setting reach all of them.
 */
export function useDoseOptions(rangeId?: string): DoseOptions {
  const unitPreference = useStore((s) => unitPreferenceFor(s, rangeId ?? s.rangeId));
  const pct = useStore((s) => strengthFor(s, kitOf(rangeId ?? s.rangeId).id));
  return useMemo(() => ({ unitPreference, strength: pct / 100 }), [unitPreference, pct]);
}

export function useRecipe(): Recipe {
  const rangeId = useStore((s) => s.rangeId);
  const remembered = useStore((s) => s.recipeIds[s.rangeId]);
  const recipeId =
    remembered && getRecipe(remembered)?.range === rangeId
      ? remembered
      : recipeIdFor({ ...DEFAULTS, rangeId, recipeIds: {} }, rangeId);
  const recipe = recipeId ? getRecipe(recipeId) : undefined;
  if (!recipe) throw new Error(`Range "${rangeId}" has no recipes`);
  return recipe;
}

export function useDose(): Dose {
  const recipe = useRecipe();
  const volumeMl = useStore((s) => s.volumeMl);
  const options = useDoseOptions();
  return useMemo(
    () => computeDose(recipe, volumeMl, componentMap, options),
    [recipe, volumeMl, options],
  );
}

export function useRoundingSummary(dose: Dose): RoundingSummary {
  const flagAbove = useStore((s) => s.flagAbove);
  return useMemo(() => roundingSummary(dose, flagAbove), [dose, flagAbove]);
}

/** The nearest volume that is exact, or null. Off when the user has said
 *  they do not want suggestions. */
export function useExactVolume(): number | null {
  const recipe = useRecipe();
  const volumeMl = useStore((s) => s.volumeMl);
  const suggest = useStore((s) => s.suggest);
  const options = useDoseOptions();
  return useMemo(
    () => (suggest ? findExactVolume(recipe, componentMap, volumeMl, options) : null),
    [recipe, volumeMl, suggest, options],
  );
}
