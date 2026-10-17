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
import { repair } from './model';
import type { PersistedState } from './model';
import { storeState } from './actions';
import type { Store } from './actions';

export type { Store } from './actions';

const STORAGE_KEY = 'lympha:state';

/** Bumping this discards everything persisted under the old shape. `repair`
 *  handles ordinary drift, so this is only for a change it cannot express. */
const STORAGE_VERSION = 1;

export const useStore = create<Store>()(
  persist(storeState, {
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
  }),
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
