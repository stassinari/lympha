/**
 * The store's shape and behaviour, without its persistence.
 *
 * `store.ts` binds this to AsyncStorage for the app. The Claude Design build binds
 * it to a store per design instead (`.design-sync/web/store.tsx`), so both run the
 * same actions.
 */

import type { StateCreator } from 'zustand';
import { kitOf, recipesForRange } from '@/data';
import { DEFAULTS, clampStrength, rangeForKit } from './model';
import type { PersistedState } from './model';
import type { ThemeMode } from '@/design';
import type { UnitPreference } from '@/engine';

export type Ephemeral = {
  /** Bottles marked as poured. Never persisted — yesterday's progress is noise. */
  done: Record<string, boolean>;
};

type Actions = {
  setVolume: (ml: number) => void;
  setRange: (rangeId: string) => void;
  /**
   * Puts a kit in use, on the range its fact sheet last chose. True when that range
   * has never been used: its first recipe is set, and Recipe should open so the
   * choice is seen. False, and nothing changes, for the kit already in use.
   */
  chooseKit: (kitId: string) => boolean;
  /**
   * Chooses the range a kit uses. On the kit in use this switches range, with the
   * same first-recipe rule and return value as `chooseKit`; on any other kit it is
   * stored for when that kit is chosen, and returns false.
   */
  chooseRange: (kitId: string, rangeId: string) => boolean;
  /** Whole percent, clamped to 25–100. Snapping to steps is the control's job. */
  setStrength: (kitId: string, pct: number) => void;
  setRecipe: (rangeId: string, recipeId: string) => void;
  /** Keyed by kit, so ranges sharing bottles stay in step. */
  setUnitPreference: (kitId: string, preference: UnitPreference) => void;
  setMode: (mode: ThemeMode) => void;
  setSuggest: (suggest: boolean) => void;
  setDefaultVolume: (ml: number | null) => void;
  setFlagAbove: (flagAbove: number) => void;
  toggleDone: (componentId: string) => void;
  clearDone: () => void;
};

export type Store = PersistedState & Ephemeral & Actions;

/**
 * The state change that puts `rangeId` in use, and whether it had to pick a recipe
 * because the range has never been used.
 */
function switchTo(s: Store, rangeId: string): { patch: Partial<Store>; pickedRecipe: boolean } {
  const first = recipesForRange(rangeId)[0];
  const pickedRecipe = !s.recipeIds[rangeId] && first !== undefined;
  return {
    pickedRecipe,
    patch: {
      rangeId,
      kitRanges: { ...s.kitRanges, [kitOf(rangeId).id]: rangeId },
      ...(pickedRecipe ? { recipeIds: { ...s.recipeIds, [rangeId]: first.id } } : {}),
      done: {},
    },
  };
}

export const storeState: StateCreator<Store> = (set, get) => ({
  ...DEFAULTS,
  done: {},

  // Anything that changes what you are supposed to be pouring invalidates
  // where you had got to. Clearing it silently is right: a half-ticked list
  // against a dose that has moved is worse than no list.
  setVolume: (ml) => set({ volumeMl: ml, done: {} }),
  setRange: (rangeId) => set((s) => switchTo(s, rangeId).patch),
  chooseKit: (kitId) => {
    const s = get();
    if (kitOf(s.rangeId).id === kitId) return false;
    const { patch, pickedRecipe } = switchTo(s, rangeForKit(s, kitId));
    set(patch);
    return pickedRecipe;
  },
  chooseRange: (kitId, rangeId) => {
    const s = get();
    if (kitOf(s.rangeId).id !== kitId) {
      set({ kitRanges: { ...s.kitRanges, [kitId]: rangeId } });
      return false;
    }
    if (s.rangeId === rangeId) return false;
    const { patch, pickedRecipe } = switchTo(s, rangeId);
    set(patch);
    return pickedRecipe;
  },
  setStrength: (kitId, pct) =>
    set((s) => ({ strength: { ...s.strength, [kitId]: clampStrength(pct) }, done: {} })),
  setRecipe: (rangeId, recipeId) =>
    set((s) => ({ recipeIds: { ...s.recipeIds, [rangeId]: recipeId }, done: {} })),
  setUnitPreference: (kitId, preference) =>
    set((s) => ({
      units: { ...s.units, [kitId]: preference },
      done: {},
    })),

  // Presentation and thresholds leave the pour alone.
  setMode: (mode) => set({ mode }),
  setSuggest: (suggest) => set({ suggest }),
  setDefaultVolume: (defaultVolumeMl) => set({ defaultVolumeMl }),
  setFlagAbove: (flagAbove) => set({ flagAbove }),

  toggleDone: (componentId) =>
    set((s) => ({ done: { ...s.done, [componentId]: !s.done[componentId] } })),
  clearDone: () => set({ done: {} }),
});
