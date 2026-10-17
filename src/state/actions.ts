/**
 * The store's shape and behaviour, without its persistence.
 *
 * `store.ts` binds this to AsyncStorage for the app. The Claude Design build binds
 * it to a store per design instead (`.design-sync/web/store.tsx`), so both run the
 * same actions.
 */

import type { StateCreator } from 'zustand';
import { unitGroupOf } from '@/data';
import { DEFAULTS } from './model';
import type { PersistedState } from './model';
import type { ThemeMode } from '@/design';
import type { UnitPreference } from '@/engine';

export type Ephemeral = {
  /** Bottles marked as poured. Never persisted — yesterday's progress is noise. */
  done: Record<string, boolean>;
};

type Actions = {
  setVolume: (ml: number) => void;
  setBrand: (brandId: string) => void;
  setRecipe: (brandId: string, recipeId: string) => void;
  /** Keyed by unit group, so brands sharing bottles stay in step. */
  setUnitPreference: (brandOrGroupId: string, preference: UnitPreference) => void;
  setMode: (mode: ThemeMode) => void;
  setSuggest: (suggest: boolean) => void;
  setDefaultVolume: (ml: number | null) => void;
  setFlagAbove: (flagAbove: number) => void;
  toggleDone: (componentId: string) => void;
  clearDone: () => void;
};

export type Store = PersistedState & Ephemeral & Actions;

export const storeState: StateCreator<Store> = (set) => ({
  ...DEFAULTS,
  done: {},

  // Anything that changes what you are supposed to be pouring invalidates
  // where you had got to. Clearing it silently is right: a half-ticked list
  // against a dose that has moved is worse than no list.
  setVolume: (ml) => set({ volumeMl: ml, done: {} }),
  setBrand: (brandId) => set({ brandId, done: {} }),
  setRecipe: (brandId, recipeId) =>
    set((s) => ({ recipeIds: { ...s.recipeIds, [brandId]: recipeId }, done: {} })),
  setUnitPreference: (brandOrGroupId, preference) =>
    set((s) => ({
      units: { ...s.units, [unitGroupOf(brandOrGroupId)]: preference },
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
