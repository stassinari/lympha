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
  getComponent,
  getKit,
  getRange,
  getRecipe,
  kitOf,
  kits,
  ranges,
  recipesForRange,
} from '@/data';
import type { DoseUnit } from '@/data/types';
import type { ThemeMode } from '@/design';
import { STRENGTH_MAX, STRENGTH_MIN } from '@/engine/strength';
import type { UnitPreference } from '@/engine';

export type PersistedState = {
  mode: ThemeMode;
  volumeMl: number;
  rangeId: string;
  /**
   * Last recipe per range, not one global recipe. Switching to Apax and back
   * should land on the Lotus recipe you were using, not reset it — and with two
   * Apax ranges in the list, a single slot would thrash.
   */
  recipeIds: Record<string, string>;
  /**
   * The range each kit last used, which choosing the kit returns to. The in-use
   * kit's entry is always `rangeId`.
   */
  kitRanges: Record<string, string>;
  /**
   * Units per kit. Lotus in drops while Apax is in grams is a legitimate pairing,
   * and one global switch would force a wrong answer on one of them. Water volume
   * stays global — that is the kettle, not the kit.
   */
  units: Record<string, UnitPreference>;
  /** Strength per kit, in whole percent, for kits that offer it. */
  strength: Record<string, number>;
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

export const DEFAULT_RANGE_ID = 'lotus';

export const DEFAULTS: PersistedState = {
  mode: 'system',
  volumeMl: 1000,
  rangeId: DEFAULT_RANGE_ID,
  recipeIds: {},
  kitRanges: { [kitOf(DEFAULT_RANGE_ID).id]: DEFAULT_RANGE_ID },
  units: {},
  strength: {},
  suggest: true,
  defaultVolumeMl: null,
  flagAbove: 0.1,
};

/** Below a cup nothing is reproducible; above this you are not brewing coffee. */
export const VOLUME_MIN_ML = 50;
export const VOLUME_MAX_ML = 5000;

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

/** The recipe to show for a range: the last one used, or the vendor's first. */
export function recipeIdFor(state: PersistedState, rangeId: string): string | undefined {
  const remembered = state.recipeIds[rangeId];
  if (remembered && getRecipe(remembered)?.range === rangeId) return remembered;
  return recipesForRange(rangeId)[0]?.id;
}

/** The range choosing a kit picks: the one in use, the one last chosen, or the default. */
export function rangeForKit(state: PersistedState, kitId: string): string {
  if (kitOf(state.rangeId)?.id === kitId) return state.rangeId;
  const chosen = state.kitRanges[kitId];
  if (chosen && getRange(chosen)?.kit === kitId) return chosen;
  const kit = getKit(kitId);
  return (
    kit?.rangeIds.find((id) => getRange(id)?.isDefault) ?? kit?.rangeIds[0] ?? DEFAULT_RANGE_ID
  );
}

/** Strength in whole percent: 100 unless the kit offers strength and one is stored. */
export function strengthFor(state: PersistedState, kitId: string): number {
  if (!getKit(kitId)?.strength) return 100;
  return state.strength[kitId] ?? 100;
}

export const clampStrength = (pct: number) =>
  Math.min(STRENGTH_MAX, Math.max(STRENGTH_MIN, Math.round(pct)));

export function unitPreferenceFor(state: PersistedState, rangeId: string): UnitPreference {
  // Keyed by kit, so Apax's two ranges answer as one.
  return state.units[kitOf(rangeId).id] ?? 'auto';
}

/** Units a kit can actually be dosed in, for validating a stored override. */
function unitsOfferedByKit(kitId: string): Set<DoseUnit> {
  const offered = new Set<DoseUnit>();
  for (const rangeId of getKit(kitId)?.rangeIds ?? []) {
    for (const recipe of recipesForRange(rangeId)) {
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

  // `brandId` is the same field under the name builds up to 1.0 stored it as.
  const storedRange = raw.rangeId ?? raw.brandId;
  const rangeId =
    typeof storedRange === 'string' && getRange(storedRange) ? storedRange : DEFAULTS.rangeId;

  const recipeIds: Record<string, string> = {};
  if (isRecord(raw.recipeIds)) {
    for (const [range, recipeId] of Object.entries(raw.recipeIds)) {
      // Both ends have to still exist, and the recipe has to belong to the range.
      if (typeof recipeId !== 'string' || !getRange(range)) continue;
      if (getRecipe(recipeId)?.range === range) recipeIds[range] = recipeId;
    }
  }

  const units: Record<string, UnitPreference> = {};
  if (isRecord(raw.units)) {
    const known = new Set(kits.map((k) => k.id));
    for (const [kitId, preference] of Object.entries(raw.units)) {
      // Keys are kit ids. An entry under any other id, such as a range id, is
      // dropped rather than trusted.
      if (typeof preference !== 'string' || !known.has(kitId)) continue;
      if (preference === 'auto' || unitsOfferedByKit(kitId).has(preference as DoseUnit)) {
        units[kitId] = preference as UnitPreference;
      }
    }
  }

  const kitRanges: Record<string, string> = {};
  if (isRecord(raw.kitRanges)) {
    for (const [kitId, stored] of Object.entries(raw.kitRanges)) {
      if (typeof stored === 'string' && getRange(stored)?.kit === kitId) kitRanges[kitId] = stored;
    }
  }
  // Builds before kits stored no range per kit. Where only one of a kit's ranges
  // has a remembered recipe, that is the one its owner uses.
  for (const kit of kits) {
    if (kitRanges[kit.id]) continue;
    const used = kit.rangeIds.filter((id) => recipeIds[id]);
    if (used.length === 1) kitRanges[kit.id] = used[0]!;
  }
  kitRanges[kitOf(rangeId).id] = rangeId;

  const strength: Record<string, number> = {};
  if (isRecord(raw.strength)) {
    for (const [kitId, pct] of Object.entries(raw.strength)) {
      if (getKit(kitId)?.strength && typeof pct === 'number' && Number.isFinite(pct)) {
        strength[kitId] = clampStrength(pct);
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
    rangeId,
    recipeIds,
    kitRanges,
    units,
    strength,
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
    ranges.some((b) => b.id === DEFAULTS.rangeId) && recipesForRange(DEFAULTS.rangeId).length > 0
  );
}
