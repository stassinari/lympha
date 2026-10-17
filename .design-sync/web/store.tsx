/**
 * `src/state/store.ts` for the Claude Design build: one store per `StoreProvider`,
 * seeded by the design, and nothing persisted.
 *
 * The app's store is a module-level singleton. On a design canvas every frame
 * would then share it, so two frames could never show two different brews. Here
 * `useStore` reads the nearest provider's store instead, with the same state and
 * actions (`src/state/actions.ts`), so a screen in a design is live: tapping a dose
 * row ticks it, choosing a recipe changes the dose.
 */

import { createContext, useContext, useMemo } from 'react';
import { createStore, useStore as useBoundStore } from 'zustand';
import { storeState } from '../../src/state/actions';
import type { Ephemeral, Store } from '../../src/state/actions';
import type { PersistedState } from '../../src/state/model';

export type { Store } from '../../src/state/actions';

/** Any part of what the app remembers, plus which bottles are already poured. */
export type DesignState = Partial<PersistedState & Ephemeral>;

const seeded = (state?: DesignState) =>
  createStore<Store>()((...args) => ({ ...storeState(...args), ...state }));

const StoreContext = createContext(seeded());

export function StoreProvider({
  state,
  children,
}: {
  state?: DesignState;
  children: React.ReactNode;
}) {
  // Keyed by content: a design passes a fresh literal on every render.
  const key = JSON.stringify(state ?? {});
  const store = useMemo(() => seeded(JSON.parse(key) as DesignState), [key]);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore<T>(selector: (state: Store) => T): T {
  return useBoundStore(useContext(StoreContext), selector);
}

/** Nothing is read from disk, so the store is ready immediately. */
export function useHydrated(): boolean {
  return true;
}
