import { describe, expect, it } from 'vitest';
import { componentMap, getRecipe } from '@/data';
import type { Recipe } from '@/data/types';
import { computeDose } from './dose';
import { findExactVolume, landsExactly } from './exactVolume';
import { MAX_COMFORTABLE_DROPS } from './units';

const recipe = (id: string): Recipe => {
  const r = getRecipe(id);
  if (!r) throw new Error(`no recipe ${id}`);
  return r;
};

const dose = (id: string, volumeMl: number, unitPreference?: 'auto' | 'g' | 'drop') =>
  computeDose(recipe(id), volumeMl, componentMap, unitPreference ? { unitPreference } : {});

const delivered = (id: string, volumeMl: number) =>
  dose(id, volumeMl).lines.map((l) => l.delivered);

/** Mg / Ca / Na / K, filling zero for bottles the recipe omits. */
function lotusDrops(id: string, volumeMl: number): number[] {
  const d = dose(id, volumeMl);
  return ['magnesium', 'calcium', 'sodium', 'potassium'].map(
    (name) => d.lines.find((l) => l.component.id === `lotus-${name}`)?.delivered ?? 0,
  );
}

const pct = (n: number) => (n * 100).toFixed(1);

/**
 * The published quantisation table from `docs/water-schema-v0.md`, driven
 * through the whole engine. `data.test.ts` checks the same table against the
 * data layer alone.
 */
const PUBLISHED = [
  { id: 'lotus-light-and-bright', drops: [0, 7, 0, 6], gh: '-6.3', ka: '-3.6' },
  { id: 'lotus-simple-and-sweet', drops: [4, 7, 6, 4], gh: '-1.8', ka: '0.4' },
  { id: 'lotus-light-and-bright-espresso', drops: [2, 0, 0, 11], gh: '-19.6', ka: '-1.8' },
  { id: 'lotus-simple-and-sweet-espresso', drops: [2, 0, 14, 0], gh: '-19.6', ka: '2.3' },
  { id: 'lotus-bright-and-juicy', drops: [4, 4, 2, 2], gh: '-10.7', ka: '-10.7' },
  { id: 'lotus-raos-recipe', drops: [4, 5, 3, 2], gh: '0.0', ka: '-0.1' },
  { id: 'lotus-ultra-light', drops: [2, 2, 0, 2], gh: '-8.2', ka: '-19.6' },
] as const;

describe('the engine reproduces the vendor’s published table at 1 L', () => {
  it.each(PUBLISHED)('$id', (row) => {
    expect(lotusDrops(row.id, 1000)).toEqual([...row.drops]);
  });

  it.each(PUBLISHED)('$id — delivered profile', (row) => {
    const profile = dose(row.id, 1000).profile;
    expect(profile).not.toBeNull();
    expect(pct(profile!.hardnessError)).toBe(row.gh);
    expect(pct(profile!.alkalinityError)).toBe(row.ka);
  });
});

describe('honest rounding', () => {
  it('keeps the ideal alongside the achievable', () => {
    // Simple and Sweet's magnesium at 1 L is 3.733 drops. Four are delivered, and
    // the 7% gap is reported rather than hidden.
    const line = dose('lotus-simple-and-sweet', 1000).lines.find(
      (l) => l.component.id === 'lotus-magnesium',
    );
    expect(line?.exact).toBeCloseTo(3.733, 3);
    expect(line?.delivered).toBe(4);
    expect(line?.error).toBeCloseTo(0.267, 3);
    expect(line?.relativeError).toBeCloseTo(0.0714, 4);
  });

  it('reports the worst gap across the bottles, not an average', () => {
    // An average would hide exactly the case worth noticing: one bottle badly out
    // among three that are fine.
    const d = dose('lotus-ultra-light', 1000);
    expect(d.worstError).toBeCloseTo(Math.max(...d.lines.map((l) => l.relativeError)), 12);
    expect(d.worstError).toBeGreaterThan(0.19);
  });

  it('scales the error, not just the dose', () => {
    // Error grows as volume shrinks. This is the whole argument for the nudge.
    expect(dose('lotus-bright-and-juicy', 1000).worstError).toBeLessThan(
      dose('lotus-bright-and-juicy', 250).worstError,
    );
  });
});

describe('a bottle rounding away entirely', () => {
  it("drops potassium from Rao's Recipe at 250 ml", () => {
    const d = dose('lotus-raos-recipe', 250);
    expect(lotusDrops('lotus-raos-recipe', 250)).toEqual([1, 1, 1, 0]);
    expect(d.zeroed.map((l) => l.component.name)).toEqual(['Potassium']);
  });

  it('distinguishes rounding away from simply not being in the recipe', () => {
    // Light and Bright has no magnesium at all, which is not a failure — it must
    // not be reported as a bottle that vanished.
    const d = dose('lotus-light-and-bright', 1000);
    expect(d.lines.some((l) => l.component.id === 'lotus-magnesium')).toBe(false);
    expect(d.zeroed).toEqual([]);
  });
});

describe('unit choice follows magnitude', () => {
  it('uses grams for Apax at a litre, where drops would be unusable', () => {
    const d = dose('apax-lab-washed', 1000);
    expect(d.lines.every((l) => l.dispenser.unit === 'g')).toBe(true);
    // TONIK alone would be 30 drops.
    const tonik = d.lines.find((l) => l.component.name === 'TONIK');
    expect(tonik?.alternative?.delivered).toBe(30);
    expect(tonik?.delivered).toBe(2);
  });

  it('uses drops for Apax at 200 ml, where grams stop being weighable', () => {
    const d = dose('apax-lab-washed', 200);
    expect(d.lines.every((l) => l.dispenser.unit === 'drop')).toBe(true);
    // 0.5 g/L JAMM at 200 ml is 0.1 g — under most kitchen scales — but 2 drops.
    const jamm = d.lines.find((l) => l.component.name === 'JAMM');
    expect(jamm?.delivered).toBe(2);
  });

  it('switches at the stated comfort threshold', () => {
    const worstDrops = (volumeMl: number) =>
      Math.max(...dose('apax-lab-washed', volumeMl, 'drop').lines.map((l) => l.exact));
    expect(worstDrops(600)).toBeLessThanOrEqual(MAX_COMFORTABLE_DROPS);
    expect(dose('apax-lab-washed', 600).lines[0]?.dispenser.unit).toBe('drop');
    expect(worstDrops(700)).toBeGreaterThan(MAX_COMFORTABLE_DROPS);
    expect(dose('apax-lab-washed', 700).lines[0]?.dispenser.unit).toBe('g');
  });

  it('never mixes units within one recipe', () => {
    // Two instruments for one jug would be absurd.
    for (const volumeMl of [150, 250, 500, 1000, 2000]) {
      const units = new Set(dose('apax-lab-washed', volumeMl).lines.map((l) => l.dispenser.unit));
      expect(units.size).toBe(1);
    }
  });

  it('honours an explicit override', () => {
    expect(dose('apax-lab-washed', 1000, 'drop').lines[0]?.dispenser.unit).toBe('drop');
    expect(dose('apax-lab-washed', 200, 'g').lines[0]?.dispenser.unit).toBe('g');
  });

  it('has nothing to choose for Lotus, which ships one dropper', () => {
    for (const volumeMl of [200, 1000, 2000]) {
      expect(
        dose('lotus-simple-and-sweet', volumeMl).lines.every((l) => l.dispenser.unit === 'drop'),
      ).toBe(true);
    }
  });
});

describe('rounding messaging is suppressed where it would be a lie', () => {
  it('stays quiet in grams, where the step is only reading resolution', () => {
    const d = dose('apax-lab-washed', 1000);
    expect(d.showsRounding).toBe(false);
    expect(d.worstError).toBe(0);
  });

  it('speaks up in drops, where a drop cannot be halved', () => {
    expect(dose('apax-lab-washed', 200).showsRounding).toBe(true);
    expect(dose('lotus-simple-and-sweet', 1000).showsRounding).toBe(true);
  });

  it('does not invent a rounding error out of floating point', () => {
    // 2.7 / 0.01 is the classic case: naive arithmetic reports 2.7000000000000002
    // and a 1e-16 "error" in a display whose whole job is reporting error.
    for (const line of dose('apax-lab-original-standard-cupping', 1000).lines) {
      expect(line.relativeError).toBe(0);
      expect(Number.isInteger(line.delivered * 100)).toBe(true);
    }
  });
});

describe('profiles', () => {
  it('are unavailable for Apax, which publishes no ion quantities', () => {
    // Null is the honest answer. Zeroes would look like soft water.
    expect(dose('apax-lab-washed', 1000).profile).toBeNull();
  });

  it('compare the delivered water against the target, not against itself', () => {
    const { target, delivered } = dose('lotus-simple-and-sweet', 1000).profile!;
    expect(target).toEqual({ hardness: 90, alkalinity: 40 });
    expect(delivered.hardness).toBeCloseTo(88.39, 2);
    expect(delivered.alkalinity).toBeCloseTo(40.18, 2);
  });

  it('hold the target steady as volume changes, since ppm is a concentration', () => {
    for (const volumeMl of [250, 500, 1000, 1500]) {
      expect(dose('lotus-simple-and-sweet', volumeMl).profile!.target).toEqual({
        hardness: 90,
        alkalinity: 40,
      });
    }
  });
});

describe('the exact volume search', () => {
  it('finds an exact volume, and it really is exact', () => {
    const raos = recipe('lotus-raos-recipe');
    const found = findExactVolume(raos, componentMap, 1100);
    expect(found).not.toBeNull();
    const fixed = computeDose(raos, found!, componentMap);
    expect(fixed.zeroed).toEqual([]);
    expect(landsExactly(fixed)).toBe(true);
  });

  it('stays within a quarter of the requested volume', () => {
    // A flat allowance is sensible from a litre and absurd from a cup: 800 ml for
    // someone asking for 350 is a different drink, not a nudge.
    for (const recipeId of ['lotus-raos-recipe', 'lotus-simple-and-sweet', 'lotus-ultra-light']) {
      for (const volumeMl of [200, 250, 350, 500, 1000, 1500, 2000]) {
        const found = findExactVolume(recipe(recipeId), componentMap, volumeMl);
        if (found === null) continue;
        expect(Math.abs(found - volumeMl)).toBeLessThanOrEqual(volumeMl * 0.25);
      }
    }
  });

  it('says nothing rather than sending you to a different drink', () => {
    // Rao's at a cup has no exact volume nearby — the nearest is 1000 ml, four
    // times the requested volume. The nudge is required to admit that plainly.
    expect(findExactVolume(recipe('lotus-raos-recipe'), componentMap, 250)).toBeNull();
  });

  it('searches downward as well as upward', () => {
    // The handoff is explicit: a smaller honest volume is often the better answer,
    // and a search that only ever suggests "brew more" is a worse tool.
    const found = findExactVolume(recipe('lotus-raos-recipe'), componentMap, 1100);
    expect(found).toBe(1000);
  });

  it('prefers the nearest volume', () => {
    const found = findExactVolume(recipe('lotus-raos-recipe'), componentMap, 975);
    expect(found).toBe(1000);
  });

  it('never suggests below the floor', () => {
    const found = findExactVolume(recipe('lotus-raos-recipe'), componentMap, 200);
    expect(found === null || found >= 150).toBe(true);
  });

  it('returns null rather than inventing a suggestion', () => {
    // A recipe with a component whose dose is minute at any reachable volume has
    // no exact volume, and the nudge is required to say so plainly.
    const impossible: Recipe = {
      ...recipe('lotus-raos-recipe'),
      id: 'impossible',
      additions: [
        { component: 'lotus-magnesium', amount: 4 },
        // 0.0001 drops per litre stays under half a drop at every volume searched.
        { component: 'lotus-potassium', amount: 0.0001 },
      ],
      target: undefined,
    };
    expect(findExactVolume(impossible, componentMap, 500)).toBeNull();
  });

  it('declines to search in grams, where every volume would qualify', () => {
    expect(findExactVolume(recipe('apax-lab-washed'), componentMap, 1000)).toBeNull();
  });
});

describe('scaling', () => {
  it('is linear in volume', () => {
    const at1L = delivered('lotus-simple-and-sweet', 1000);
    const at2L = dose('lotus-simple-and-sweet', 2000).lines.map((l) => l.exact);
    const exact1L = dose('lotus-simple-and-sweet', 1000).lines.map((l) => l.exact);
    at2L.forEach((v, i) => expect(v).toBeCloseTo(exact1L[i]! * 2, 10));
    expect(at1L).toEqual([4, 7, 6, 4]);
  });

  it('refuses a non-positive volume', () => {
    expect(() => dose('lotus-simple-and-sweet', 0)).toThrow(RangeError);
    expect(() => dose('lotus-simple-and-sweet', -100)).toThrow(RangeError);
  });
});
