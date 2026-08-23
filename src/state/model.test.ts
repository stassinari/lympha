import { describe, expect, it } from 'vitest';
import {
  DEFAULTS,
  VOLUME_MAX_ML,
  VOLUME_MIN_ML,
  defaultsAreValid,
  recipeIdFor,
  repair,
  unitPreferenceFor,
} from './model';
import type { PersistedState } from './model';

const state = (patch: Partial<PersistedState> = {}): PersistedState => ({ ...DEFAULTS, ...patch });

describe('defaults', () => {
  it('name data that actually ships', () => {
    expect(defaultsAreValid()).toBe(true);
  });

  it('open on a recipe rather than an empty screen', () => {
    expect(recipeIdFor(DEFAULTS, DEFAULTS.brandId)).toBeDefined();
  });
});

describe('recipeIdFor', () => {
  it('remembers a recipe per brand rather than globally', () => {
    // Switching to Apax and back should land where you left Lotus.
    const s = state({
      recipeIds: { lotus: 'lotus-ultra-light', 'apax-lab': 'apax-lab-espresso' },
    });
    expect(recipeIdFor(s, 'lotus')).toBe('lotus-ultra-light');
    expect(recipeIdFor(s, 'apax-lab')).toBe('apax-lab-espresso');
  });

  it("falls back to the vendor's first recipe for a brand never used", () => {
    expect(recipeIdFor(state(), 'apax-lab-original')).toBe('apax-lab-original-standard-cupping');
  });

  it('ignores a remembered recipe that belongs to a different brand', () => {
    const s = state({ recipeIds: { lotus: 'apax-lab-washed' } });
    expect(recipeIdFor(s, 'lotus')).toBe('lotus-light-and-bright');
  });
});

describe('unitPreferenceFor', () => {
  it('lets magnitude decide until told otherwise', () => {
    expect(unitPreferenceFor(state(), 'apax-lab')).toBe('auto');
  });

  it('is per brand, because one global switch would be wrong for one of them', () => {
    const s = state({ units: { lotus: 'drop', 'apax-lab': 'g' } });
    expect(unitPreferenceFor(s, 'lotus')).toBe('drop');
    expect(unitPreferenceFor(s, 'apax-lab')).toBe('g');
  });
});

describe('repair', () => {
  it('accepts nothing at all', () => {
    expect(repair(undefined)).toEqual(DEFAULTS);
    expect(repair(null)).toEqual(DEFAULTS);
    expect(repair('nonsense')).toEqual(DEFAULTS);
    expect(repair([])).toEqual(DEFAULTS);
  });

  it('keeps a valid state untouched', () => {
    const s = state({
      mode: 'dark',
      volumeMl: 350,
      brandId: 'apax-lab',
      recipeIds: { 'apax-lab': 'apax-lab-natural' },
      units: { 'apax-lab': 'drop' },
      suggest: false,
      flagAbove: 0.05,
    });
    expect(repair(s)).toEqual(s);
  });

  it('drops a recipe id the data no longer has', () => {
    // This has already happened once: Apax's card values were replaced by the
    // calculator's, and `apax-washed` became `apax-lab-washed`. Without this the
    // app would reopen on a recipe that does not exist.
    const repaired = repair(state({ recipeIds: { lotus: 'apax-washed' } }));
    expect(repaired.recipeIds).toEqual({});
    expect(recipeIdFor(repaired, 'lotus')).toBeDefined();
  });

  it('drops a recipe id that no longer belongs to its brand', () => {
    expect(repair(state({ recipeIds: { lotus: 'apax-lab-washed' } })).recipeIds).toEqual({});
  });

  it('drops entries for a brand that no longer ships', () => {
    expect(
      repair({ ...DEFAULTS, recipeIds: { 'apax-lab-v0': 'x' }, units: { 'apax-lab-v0': 'g' } }),
    ).toMatchObject({ recipeIds: {}, units: {} });
  });

  it('falls back when the remembered brand is gone', () => {
    expect(repair(state({ brandId: 'blossom' })).brandId).toBe(DEFAULTS.brandId);
  });

  it('rejects a unit the brand cannot be dosed in', () => {
    // Lotus ships one dropper and no scale; grams is not an option for it.
    expect(repair(state({ units: { lotus: 'g' } })).units).toEqual({});
    expect(repair(state({ units: { lotus: 'drop' } })).units).toEqual({ lotus: 'drop' });
    expect(repair(state({ units: { 'apax-lab': 'g' } })).units).toEqual({ 'apax-lab': 'g' });
  });

  it('always allows auto', () => {
    expect(repair(state({ units: { lotus: 'auto' } })).units).toEqual({ lotus: 'auto' });
  });

  it('clamps a volume outside anything brewable', () => {
    expect(repair(state({ volumeMl: 0 })).volumeMl).toBe(VOLUME_MIN_ML);
    expect(repair(state({ volumeMl: -5 })).volumeMl).toBe(VOLUME_MIN_ML);
    expect(repair(state({ volumeMl: 999999 })).volumeMl).toBe(VOLUME_MAX_ML);
    expect(repair(state({ volumeMl: 350.4 })).volumeMl).toBe(350);
  });

  it('replaces a volume that is not a number at all', () => {
    expect(repair({ ...DEFAULTS, volumeMl: NaN }).volumeMl).toBe(DEFAULTS.volumeMl);
    expect(repair({ ...DEFAULTS, volumeMl: 'lots' }).volumeMl).toBe(DEFAULTS.volumeMl);
  });

  it('rejects a nonsense theme or threshold', () => {
    expect(repair({ ...DEFAULTS, mode: 'sepia' }).mode).toBe('system');
    expect(repair({ ...DEFAULTS, flagAbove: 0 }).flagAbove).toBe(DEFAULTS.flagAbove);
    expect(repair({ ...DEFAULTS, flagAbove: 2 }).flagAbove).toBe(DEFAULTS.flagAbove);
    expect(repair({ ...DEFAULTS, suggest: 'yes' }).suggest).toBe(DEFAULTS.suggest);
  });

  it('is idempotent', () => {
    const once = repair({ brandId: 'nope', volumeMl: -1, units: { lotus: 'g' } });
    expect(repair(once)).toEqual(once);
  });
});
