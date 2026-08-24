/**
 * The store.
 *
 * Everything the app remembers between mornings lives here; everything it
 * forgets — which bottles you have already poured — lives here too but is kept
 * out of storage. Derived values are never stored: the dose is recomputed from
 * recipe and volume, so there is one source of truth and nothing to invalidate.
 */

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { unitGroupOf } from '@/data';
import { DEFAULTS, repair } from './model';
import type { PersistedState, ThemeMode } from './model';
import type { UnitPreference } from '@/engine';

type Ephemeral = {
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

const STORAGE_KEY = 'lympha:state';

/** Bumping this discards everything persisted under the old shape. `repair`
 *  handles ordinary drift, so this is only for a change it cannot express. */
const STORAGE_VERSION = 1;

export const useStore = create<Store>()(
  persist(
    (set) => ({
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
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      // `done` is deliberately absent, and the actions are not state.
      partialize: (s): PersistedState => ({
        mode: s.mode,
        volumeMl: s.volumeMl,
        brandId: s.brandId,
        recipeIds: s.recipeIds,
        units: s.units,
        suggest: s.suggest,
        defaultVolumeMl: s.defaultVolumeMl,
        flagAbove: s.flagAbove,
      }),
      // Storage returns whatever was written by whatever build wrote it, so it is
      // treated as untrusted input rather than as our own type.
      merge: (persisted, current) => {
        const state = repair(persisted);
        // A pinned default overrides whatever was last brewed.
        return { ...current, ...state, volumeMl: state.defaultVolumeMl ?? state.volumeMl };
      },
    },
  ),
);

/**
 * Whether the store has finished reading from disk.
 *
 * Rendering before this is what produces the flash of default state on launch —
 * 1000 ml for a moment, then yesterday's 350. The splash screen is held until it
 * turns true, so the app genuinely opens to the answer.
 */
export function useHydrated(): boolean {
  // `useSyncExternalStore` reads the current value on every render rather than
  // caching it in state, so there is no window between the first read and the
  // subscription in which hydration could finish unobserved and strand the splash.
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
