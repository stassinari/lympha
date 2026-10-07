/**
 * What the screens actually ask for.
 *
 * Derived values are computed here rather than stored, so there is nothing to
 * keep in sync and nothing to invalidate. Each hook selects primitives out of the
 * store — selecting an object would return a fresh reference every render and
 * defeat the comparison that stops the re-render.
 */

import { useMemo } from 'react';
import { componentMap, getBrand, getRecipe } from '@/data';
import type { Brand, Recipe } from '@/data/types';
import { computeDose, findExactVolume } from '@/engine';
import type { Dose } from '@/engine';
import { roundingSummary } from '@/format/rounding';
import type { RoundingSummary } from '@/format/rounding';
import { DEFAULTS, recipeIdFor, unitPreferenceFor } from './model';
import { useStore } from './store';

export function useBrand(): Brand {
  const brandId = useStore((s) => s.brandId);
  // Repair keeps this true across launches; the fallback covers a brand removed
  // while the app is open, which only a developer will ever see.
  return getBrand(brandId) ?? getBrand(DEFAULTS.brandId)!;
}

export function useRecipe(): Recipe {
  const brandId = useStore((s) => s.brandId);
  const remembered = useStore((s) => s.recipeIds[s.brandId]);
  const recipeId =
    remembered && getRecipe(remembered)?.brand === brandId
      ? remembered
      : recipeIdFor({ ...DEFAULTS, brandId, recipeIds: {} }, brandId);
  const recipe = recipeId ? getRecipe(recipeId) : undefined;
  if (!recipe) throw new Error(`Brand "${brandId}" has no recipes`);
  return recipe;
}

export function useDose(): Dose {
  const recipe = useRecipe();
  const volumeMl = useStore((s) => s.volumeMl);
  const preference = useStore((s) => unitPreferenceFor(s, s.brandId));
  return useMemo(
    () => computeDose(recipe, volumeMl, componentMap, { unitPreference: preference }),
    [recipe, volumeMl, preference],
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
  const preference = useStore((s) => unitPreferenceFor(s, s.brandId));
  return useMemo(
    () =>
      suggest
        ? findExactVolume(recipe, componentMap, volumeMl, { unitPreference: preference })
        : null,
    [recipe, volumeMl, suggest, preference],
  );
}
