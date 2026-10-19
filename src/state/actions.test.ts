import { describe, expect, it } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { recipesForRange } from '@/data';
import { storeState } from './actions';
import type { Store } from './actions';

const fresh = () => createStore<Store>()(storeState);

describe('chooseRange', () => {
  it('changes nothing on the dose screen for a kit not in use', () => {
    const store = fresh();
    expect(store.getState().chooseRange('apax', 'apax-lab')).toBe(false);
    expect(store.getState().rangeId).toBe('lotus');
    expect(store.getState().kitRanges.apax).toBe('apax-lab');
  });

  it('switches range on the kit in use, and asks for a recipe the first time', () => {
    const store = fresh();
    store.getState().chooseKit('apax');
    const original = store.getState().rangeId;
    expect(original).toBe('apax-lab-original');
    expect(store.getState().chooseRange('apax', 'apax-lab')).toBe(true);
    expect(store.getState().rangeId).toBe('apax-lab');
    expect(store.getState().recipeIds['apax-lab']).toBe(recipesForRange('apax-lab')[0]!.id);
    // Back to a range already used: its recipe is remembered.
    expect(store.getState().chooseRange('apax', original)).toBe(false);
  });
});

describe('chooseKit', () => {
  it('uses the range chosen on the fact sheet, and asks for a recipe the first time', () => {
    const store = fresh();
    store.getState().chooseRange('apax', 'apax-lab');
    expect(store.getState().chooseKit('apax')).toBe(true);
    expect(store.getState().rangeId).toBe('apax-lab');
    expect(store.getState().recipeIds['apax-lab']).toBe(recipesForRange('apax-lab')[0]!.id);
  });

  it('goes straight back to a kit used before, on its remembered recipe', () => {
    const store = fresh();
    store.getState().setRecipe('lotus', 'lotus-ultra-light');
    store.getState().chooseKit('apax');
    expect(store.getState().chooseKit('lotus')).toBe(false);
    expect(store.getState().rangeId).toBe('lotus');
    expect(store.getState().recipeIds.lotus).toBe('lotus-ultra-light');
  });

  it('does nothing for the kit already in use', () => {
    const store = fresh();
    store.getState().toggleDone('lotus-calcium');
    expect(store.getState().chooseKit('lotus')).toBe(false);
    expect(store.getState().done).toEqual({ 'lotus-calcium': true });
  });

  it('clears the pour, since the dose has changed', () => {
    const store = fresh();
    store.getState().toggleDone('lotus-calcium');
    store.getState().chooseKit('apax');
    expect(store.getState().done).toEqual({});
  });
});

describe('setStrength', () => {
  it('stores a whole percent in range, without snapping', () => {
    const store = fresh();
    store.getState().setStrength('apax', 49);
    expect(store.getState().strength.apax).toBe(49);
    store.getState().setStrength('apax', 140);
    expect(store.getState().strength.apax).toBe(100);
  });
});
