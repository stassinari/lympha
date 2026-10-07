/**
 * The app's persisted state, and the rules for making sense of what comes back
 * off disk.
 *
 * Kept free of React and of storage so it can be tested in plain Node. The store
 * wiring is next door in `store.ts`.
 *
 * Everything here survives a cold start, so the app *opens to the answer*
 * (`docs/decisions.md`): repeating yesterday's brew needs near-zero input.
 */

import {
  brands,
  getBrand,
  getComponent,
  getRecipe,
  recipesForBrand,
  unitGroupOf,
  unitGroups,
} from '@/data';
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
  /** Offer a nearby volume that is exact. */
  suggest: boolean;
  /**
   * The volume the app opens on. `null` means whatever you last brewed; someone
   * who always makes the same amount is better served by pinning it.
   */
  defaultVolumeMl: number | null;
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
  defaultVolumeMl: null,
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
  // Keyed by unit group, so Apax's two ranges answer as one.
  return state.units[unitGroupOf(brandId)] ?? 'auto';
}

/** Units a unit group can actually be dosed in, for validating a stored override. */
function unitsOfferedByGroup(groupId: string): Set<DoseUnit> {
  const offered = new Set<DoseUnit>();
  const group = unitGroups().find((g) => g.id === groupId);
  for (const brandId of group?.brandIds ?? []) {
    for (const recipe of recipesForBrand(brandId)) {
      for (const addition of recipe.additions) {
        for (const dispenser of getComponent(addition.component)?.dispensers ?? []) {
          offered.add(dispenser.unit);
        }
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
 * Persisted ids outlive the data they point at, and a renamed recipe would
 * otherwise reopen to a blank screen or a crash. Anything unrecognised is dropped
 * rather than trusted, and a dropped field falls back to its default.
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
    const known = new Set(unitGroups().map((g) => g.id));
    for (const [group, preference] of Object.entries(raw.units)) {
      // Keys are unit groups. An entry under any other id, such as a brand id, is
      // dropped rather than trusted.
      if (typeof preference !== 'string' || !known.has(group)) continue;
      if (preference === 'auto' || unitsOfferedByGroup(group).has(preference as DoseUnit)) {
        units[group] = preference as UnitPreference;
      }
    }
  }

  const flag = raw.flagAbove;
  const flagAbove =
    typeof flag === 'number' && Number.isFinite(flag) && flag > 0 && flag <= 1
      ? flag
      : DEFAULTS.flagAbove;

  const preferred = raw.defaultVolumeMl;
  const defaultVolumeMl =
    typeof preferred === 'number' && Number.isFinite(preferred)
      ? Math.min(VOLUME_MAX_ML, Math.max(VOLUME_MIN_ML, Math.round(preferred)))
      : null;

  return {
    mode,
    volumeMl,
    brandId,
    recipeIds,
    units,
    suggest: typeof raw.suggest === 'boolean' ? raw.suggest : DEFAULTS.suggest,
    defaultVolumeMl,
    flagAbove,
  };
}

/** Thresholds offered for flagging a rounding gap. */
export const FLAG_CHOICES = [0.05, 0.1, 0.15, 0.2] as const;

/** Guards against shipping a default that names data we do not have. */
export function defaultsAreValid(): boolean {
  return (
    brands.some((b) => b.id === DEFAULTS.brandId) && recipesForBrand(DEFAULTS.brandId).length > 0
  );
}
