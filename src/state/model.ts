/**
 * The app's persisted state, and the rules for making sense of what comes back
 * off disk.
 *
 * Kept free of React and of storage so it can be tested in plain Node. The store
 * wiring is next door in `store.ts`.
 *
 * The brief's hardest requirement lives here: *opens to the answer*. Reopening
 * the app the next morning should need near-zero input to repeat yesterday's
 * brew, which means everything below survives a cold start.
 */

import { brands, getBrand, getComponent, getRecipe, recipesForBrand } from '@/data';
import type { DoseUnit } from '@/data/types';
import type { UnitPreference } from '@/engine';

export type ThemeMode = 'system' | 'light' | 'dark';

export type PersistedState = {
  mode: ThemeMode;
  volumeMl: number;
  brandId: string;
  /**
   * Last recipe per brand, not one global recipe. Switching to Apax and back
   * should land on the Lotus recipe you were using, not reset it — and with two
   * Apax ranges in the list, a single slot would thrash.
   */
  recipeIds: Record<string, string>;
  /**
   * Concentrate units per brand. Lotus in drops while Apax is in grams is a
   * legitimate pairing, and one global switch would force a wrong answer on one
   * of them. Water volume stays global — that is the kettle, not the brand.
   */
  units: Record<string, UnitPreference>;
  /** Offer a nearby volume that divides evenly. */
  suggest: boolean;
  /** Rounding gap above which the line turns amber. */
  flagAbove: number;
};

export const DEFAULT_BRAND_ID = 'lotus';

export const DEFAULTS: PersistedState = {
  mode: 'system',
  volumeMl: 1000,
  brandId: DEFAULT_BRAND_ID,
  recipeIds: {},
  units: {},
  suggest: true,
  flagAbove: 0.1,
};

/** Below a cup nothing is reproducible; above this you are not brewing coffee. */
export const VOLUME_MIN_ML = 50;
export const VOLUME_MAX_ML = 5000;

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

/** The recipe to show for a brand: the last one used, or the vendor's first. */
export function recipeIdFor(state: PersistedState, brandId: string): string | undefined {
  const remembered = state.recipeIds[brandId];
  if (remembered && getRecipe(remembered)?.brand === brandId) return remembered;
  return recipesForBrand(brandId)[0]?.id;
}

export function unitPreferenceFor(state: PersistedState, brandId: string): UnitPreference {
  return state.units[brandId] ?? 'auto';
}

/** Units a brand can actually be dosed in, for validating a stored override. */
function unitsOfferedBy(brandId: string): Set<DoseUnit> {
  const offered = new Set<DoseUnit>();
  for (const recipe of recipesForBrand(brandId)) {
    for (const addition of recipe.additions) {
      for (const dispenser of getComponent(addition.component)?.dispensers ?? []) {
        offered.add(dispenser.unit);
      }
    }
  }
  return offered;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Rebuild valid state from whatever was on disk.
 *
 * Persisted ids outlive the data they point at. A build that renames a recipe —
 * as this one already has, when Apax's card values were replaced by the
 * calculator's and `apax-washed` became `apax-lab-washed` — would otherwise
 * reopen to a blank screen or a crash. Anything unrecognised is dropped rather
 * than trusted, and a dropped field falls back to its default.
 */
export function repair(raw: unknown): PersistedState {
  if (!isRecord(raw)) return { ...DEFAULTS };

  const mode = THEME_MODES.includes(raw.mode as ThemeMode)
    ? (raw.mode as ThemeMode)
    : DEFAULTS.mode;

  const volume = raw.volumeMl;
  const volumeMl =
    typeof volume === 'number' && Number.isFinite(volume)
      ? Math.min(VOLUME_MAX_ML, Math.max(VOLUME_MIN_ML, Math.round(volume)))
      : DEFAULTS.volumeMl;

  const brandId =
    typeof raw.brandId === 'string' && getBrand(raw.brandId) ? raw.brandId : DEFAULTS.brandId;

  const recipeIds: Record<string, string> = {};
  if (isRecord(raw.recipeIds)) {
    for (const [brand, recipeId] of Object.entries(raw.recipeIds)) {
      // Both ends have to still exist, and the recipe has to belong to the brand.
      if (typeof recipeId !== 'string' || !getBrand(brand)) continue;
      if (getRecipe(recipeId)?.brand === brand) recipeIds[brand] = recipeId;
    }
  }

  const units: Record<string, UnitPreference> = {};
  if (isRecord(raw.units)) {
    for (const [brand, preference] of Object.entries(raw.units)) {
      if (typeof preference !== 'string' || !getBrand(brand)) continue;
      if (preference === 'auto' || unitsOfferedBy(brand).has(preference as DoseUnit)) {
        units[brand] = preference as UnitPreference;
      }
    }
  }

  const flag = raw.flagAbove;
  const flagAbove =
    typeof flag === 'number' && Number.isFinite(flag) && flag > 0 && flag <= 1
      ? flag
      : DEFAULTS.flagAbove;

  return {
    mode,
    volumeMl,
    brandId,
    recipeIds,
    units,
    suggest: typeof raw.suggest === 'boolean' ? raw.suggest : DEFAULTS.suggest,
    flagAbove,
  };
}

/** Guards against shipping a default that names data we do not have. */
export function defaultsAreValid(): boolean {
  return (
    brands.some((b) => b.id === DEFAULTS.brandId) && recipesForBrand(DEFAULTS.brandId).length > 0
  );
}
