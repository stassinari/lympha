import { describe, expect, it } from 'vitest';
import {
  DEFAULTS,
  VOLUME_MAX_ML,
  VOLUME_MIN_ML,
  defaultsAreValid,
  rangeForKit,
  recipeIdFor,
  repair,
  strengthFor,
  unitPreferenceFor,
} from './model';
import type { PersistedState } from './model';
import { kitOf, ranges } from '@/data';

const state = (patch: Partial<PersistedState> = {}): PersistedState => ({ ...DEFAULTS, ...patch });

describe('defaults', () => {
  it('name data that actually ships', () => {
    expect(defaultsAreValid()).toBe(true);
  });

  it('open on a recipe rather than an empty screen', () => {
    expect(recipeIdFor(DEFAULTS, DEFAULTS.rangeId)).toBeDefined();
  });
});

describe('recipeIdFor', () => {
  it('remembers a recipe per range rather than globally', () => {
    // Switching to Apax and back should land where you left Lotus.
    const s = state({
      recipeIds: { lotus: 'lotus-ultra-light', 'apax-lab': 'apax-lab-espresso' },
    });
    expect(recipeIdFor(s, 'lotus')).toBe('lotus-ultra-light');
    expect(recipeIdFor(s, 'apax-lab')).toBe('apax-lab-espresso');
  });

  it("falls back to the vendor's first recipe for a range never used", () => {
    expect(recipeIdFor(state(), 'apax-lab-original')).toBe('apax-lab-original-standard-cupping');
  });

  it('ignores a remembered recipe that belongs to a different range', () => {
    const s = state({ recipeIds: { lotus: 'apax-lab-washed' } });
    expect(recipeIdFor(s, 'lotus')).toBe('lotus-light-and-bright');
  });
});

describe('unitPreferenceFor', () => {
  it('lets magnitude decide until told otherwise', () => {
    expect(unitPreferenceFor(state(), 'apax-lab')).toBe('auto');
  });

  it('is per range, because one global switch would be wrong for one of them', () => {
    const s = state({ units: { lotus: 'drop', apax: 'g' } });
    expect(unitPreferenceFor(s, 'lotus')).toBe('drop');
    expect(unitPreferenceFor(s, 'apax-lab')).toBe('g');
  });

  it('round-trips with the key the store writes, for every range', () => {
    // The store writes `units[kitOf(rangeId).id]`. Reading any other key makes
    // every option but the default look unselected, though the change was made.
    for (const range of ranges) {
      const written = { ...DEFAULTS, units: { [kitOf(range.id).id]: 'drop' as const } };
      expect(unitPreferenceFor(written, range.id), range.id).toBe('drop');
    }
  });

  it("answers the same for Apax's two ranges, which are the same jars", () => {
    const s = state({ units: { apax: 'g' } });
    expect(unitPreferenceFor(s, 'apax-lab')).toBe('g');
    expect(unitPreferenceFor(s, 'apax-lab-original')).toBe('g');
  });
});

describe('defaultVolumeMl', () => {
  it('is unset by default, so the app opens on whatever was last brewed', () => {
    expect(DEFAULTS.defaultVolumeMl).toBeNull();
  });

  it('is clamped to something brewable when pinned', () => {
    expect(repair({ ...DEFAULTS, defaultVolumeMl: 0 }).defaultVolumeMl).toBe(VOLUME_MIN_ML);
    expect(repair({ ...DEFAULTS, defaultVolumeMl: 99999 }).defaultVolumeMl).toBe(VOLUME_MAX_ML);
    expect(repair({ ...DEFAULTS, defaultVolumeMl: 500 }).defaultVolumeMl).toBe(500);
  });

  it('falls back to last-used for anything that is not a number', () => {
    expect(repair({ ...DEFAULTS, defaultVolumeMl: 'always' }).defaultVolumeMl).toBeNull();
    expect(repair({ ...DEFAULTS, defaultVolumeMl: NaN }).defaultVolumeMl).toBeNull();
  });
});

describe('repair', () => {
  it('reads the range from the key earlier builds wrote', () => {
    expect(repair({ brandId: 'apax-lab' }).rangeId).toBe('apax-lab');
    expect(repair({ rangeId: 'apax-lab-original', brandId: 'lotus' }).rangeId).toBe(
      'apax-lab-original',
    );
  });

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
      rangeId: 'apax-lab',
      recipeIds: { 'apax-lab': 'apax-lab-natural' },
      kitRanges: { lotus: 'lotus', apax: 'apax-lab' },
      units: { apax: 'drop' },
      strength: { apax: 60 },
      suggest: false,
      flagAbove: 0.05,
    });
    expect(repair(s)).toEqual(s);
  });

  it('drops a recipe id the data no longer has', () => {
    // Recipe ids change with the data, as `apax-washed` → `apax-lab-washed` does
    // here. Without this the app would reopen on a recipe that does not exist.
    const repaired = repair(state({ recipeIds: { lotus: 'apax-washed' } }));
    expect(repaired.recipeIds).toEqual({});
    expect(recipeIdFor(repaired, 'lotus')).toBeDefined();
  });

  it('drops a recipe id that no longer belongs to its range', () => {
    expect(repair(state({ recipeIds: { lotus: 'apax-lab-washed' } })).recipeIds).toEqual({});
  });

  it('drops entries for a range that no longer ships', () => {
    expect(
      repair({ ...DEFAULTS, recipeIds: { 'apax-lab-v0': 'x' }, units: { 'apax-lab-v0': 'g' } }),
    ).toMatchObject({ recipeIds: {}, units: {} });
  });

  it('falls back when the remembered range is gone', () => {
    expect(repair(state({ rangeId: 'blossom' })).rangeId).toBe(DEFAULTS.rangeId);
  });

  it('rejects a unit the range cannot be dosed in', () => {
    // Lotus ships one dropper and no scale; grams is not an option for it.
    expect(repair(state({ units: { lotus: 'g' } })).units).toEqual({});
    expect(repair(state({ units: { lotus: 'drop' } })).units).toEqual({ lotus: 'drop' });
    expect(repair(state({ units: { apax: 'g' } })).units).toEqual({ apax: 'g' });
  });

  it('drops a unit stored under a range rather than a kit', () => {
    // Keys are kit ids. A range id is not one, so its entry is discarded
    // rather than half-applied to one Apax range.
    expect(repair(state({ units: { 'apax-lab': 'g' } })).units).toEqual({});
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
    const once = repair({ rangeId: 'nope', volumeMl: -1, units: { lotus: 'g' } });
    expect(repair(once)).toEqual(once);
  });
});

describe('kits in stored state', () => {
  it('remember the range of the kit in use, including from the key earlier builds wrote', () => {
    expect(repair({ brandId: 'apax-lab' }).kitRanges).toEqual({ apax: 'apax-lab' });
    expect(
      repair({ rangeId: 'apax-lab', kitRanges: { apax: 'apax-lab-original' } }).kitRanges,
    ).toEqual({ apax: 'apax-lab' });
  });

  it('drop a range stored under a kit it does not belong to', () => {
    expect(repair({ kitRanges: { apax: 'lotus', lotus: 'apax-lab' } }).kitRanges).toEqual({
      lotus: 'lotus',
    });
  });

  it('answer with the default range for a kit never chosen', () => {
    expect(rangeForKit(state(), 'apax')).toBe('apax-lab-original');
    expect(rangeForKit(state({ kitRanges: { apax: 'apax-lab' } }), 'apax')).toBe('apax-lab');
  });
});

describe('strength in stored state', () => {
  it('is kept only for kits that offer it', () => {
    expect(repair({ strength: { lotus: 50, apax: 75 } }).strength).toEqual({ apax: 75 });
  });

  it('is a whole percent from 25 to 100', () => {
    expect(repair({ strength: { apax: 73.6 } }).strength).toEqual({ apax: 74 });
    expect(repair({ strength: { apax: 300 } }).strength).toEqual({ apax: 100 });
    expect(repair({ strength: { apax: 5 } }).strength).toEqual({ apax: 25 });
    expect(repair({ strength: { apax: 'half' } }).strength).toEqual({});
  });

  it('is full for a kit without it, whatever is stored', () => {
    expect(strengthFor(state({ strength: { lotus: 50 } }), 'lotus')).toBe(100);
    expect(strengthFor(state(), 'apax')).toBe(100);
    expect(strengthFor(state({ strength: { apax: 60 } }), 'apax')).toBe(60);
  });
});

describe('kit ranges from builds before kits', () => {
  it('come from the one range of a kit with a remembered recipe', () => {
    const s = repair({ brandId: 'lotus', recipeIds: { 'apax-lab': 'apax-lab-washed' } });
    expect(rangeForKit(s, 'apax')).toBe('apax-lab');
  });

  it('stay the default where history does not say which', () => {
    const s = repair({
      brandId: 'lotus',
      recipeIds: { 'apax-lab': 'apax-lab-washed', 'apax-lab-original': 'apax-lab-original-washed' },
    });
    expect(rangeForKit(s, 'apax')).toBe('apax-lab-original');
  });
});
