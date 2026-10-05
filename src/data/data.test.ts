import { describe, expect, it } from 'vitest';
import { APAX_ANOMALIES, APAX_TOTAL_G_PER_L, apaxBrands, apaxRecipes, dropsForGrams } from './apax';
import { lotusConstants, lotusRecipes } from './lotus';
import {
  brands,
  componentMap,
  components,
  componentsForBrand,
  defaultDispenser,
  getComponent,
  groupedRecipesForBrand,
  recipes,
  recipesForBrand,
} from './index';
import { caco3PerDoseUnitPerLitre } from '@/engine/resolve';

describe('registry integrity', () => {
  it('has unique ids within each collection', () => {
    for (const collection of [brands, components, recipes]) {
      const ids = collection.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('names a brand that exists, from every component and recipe', () => {
    const brandIds = new Set(brands.map((b) => b.id));
    for (const c of components) expect(brandIds).toContain(c.brand);
    for (const r of recipes) expect(brandIds).toContain(r.brand);
  });

  it('names a component that exists, from every addition and target', () => {
    for (const recipe of recipes) {
      for (const addition of recipe.additions) {
        expect(getComponent(addition.component), addition.component).toBeDefined();
      }
      for (const entry of recipe.target ?? []) {
        expect(getComponent(entry.component), entry.component).toBeDefined();
      }
    }
  });

  it('keeps a recipe’s components within its own brand', () => {
    for (const recipe of recipes) {
      for (const addition of recipe.additions) {
        expect(getComponent(addition.component)?.brand).toBe(recipe.brand);
      }
    }
  });

  it('gives every component a dispenser, and never more than one default', () => {
    for (const c of components) {
      expect(c.dispensers.length).toBeGreaterThan(0);
      expect(c.dispensers.filter((d) => d.isDefault).length).toBeLessThanOrEqual(1);
      expect(defaultDispenser(c)).toBeDefined();
    }
  });

  it('ships nothing unverified', () => {
    // The schema marks the Barista Hustle stock "do not ship" until its numbers
    // are checked. This is the guard that keeps that true.
    for (const c of components) expect(c.unverified).toBeUndefined();
  });

  it('omits zero-dose components rather than storing them as zero', () => {
    // A bottle at zero must drop out of the dose list and the colour cluster,
    // and the cleanest way to guarantee that is for it never to be in the data.
    for (const recipe of recipes) {
      for (const addition of recipe.additions) expect(addition.amount).toBeGreaterThan(0);
      for (const entry of recipe.target ?? []) expect(entry.caco3Ppm).toBeGreaterThan(0);
    }
  });

  it('gives every component with ion data a CaCO₃ contribution', () => {
    for (const c of components) {
      if (!c.ions) continue;
      expect(caco3PerDoseUnitPerLitre(c)).toBeGreaterThan(0);
    }
  });
});

describe('Lotus constants', () => {
  const { HARDNESS_PER_DROP_PER_LITRE: H, ALKALINITY_PER_DROP_PER_LITRE: A } = lotusConstants;

  it('rounds to the values quoted in water-schema-v0', () => {
    expect(H.toFixed(2)).toBe('8.04');
    expect(A.toFixed(2)).toBe('4.02');
  });

  it('halves the CaCO₃ per drop for monovalent bottles', () => {
    expect(A).toBeCloseTo(H / 2, 12);
  });

  it('agrees with the vendor’s own formula at any volume', () => {
    // Lotus publish:
    //   drops = ppm × (volume_ml / 4500) × 0.56 × (2 if monovalent else 1)
    // We store ppm-per-drop instead. The two must be the same arithmetic, or the
    // whole data model is quietly wrong.
    const vendorDrops = (ppm: number, volumeMl: number, monovalent: boolean) =>
      ppm *
      (volumeMl / lotusConstants.BASE_ML) *
      lotusConstants.ROUND_DROPPER_FACTOR *
      (monovalent ? 2 : 1);

    const ourDrops = (ppm: number, volumeMl: number, monovalent: boolean) =>
      (ppm / (monovalent ? A : H)) * (volumeMl / 1000);

    for (const volumeMl of [150, 250, 300, 500, 1000, 1500]) {
      for (const ppm of [8, 15, 32.1, 50, 60]) {
        expect(ourDrops(ppm, volumeMl, false)).toBeCloseTo(vendorDrops(ppm, volumeMl, false), 10);
        expect(ourDrops(ppm, volumeMl, true)).toBeCloseTo(vendorDrops(ppm, volumeMl, true), 10);
      }
    }
  });
});

/**
 * The published quantisation table from water-schema-v0, used as a golden
 * fixture. Drop counts and error figures are the vendor's own, so reproducing
 * them proves the stored data and the derivation agree with the source.
 */
const LOTUS_AT_ONE_LITRE = [
  {
    id: 'lotus-light-and-bright',
    drops: [0, 7, 0, 6],
    gh: 60,
    ka: 25,
    ghErr: '-6.3',
    kaErr: '-3.6',
  },
  {
    id: 'lotus-simple-and-sweet',
    drops: [4, 7, 6, 4],
    gh: 90,
    ka: 40,
    ghErr: '-1.8',
    kaErr: '0.4',
  },
  {
    id: 'lotus-light-and-bright-espresso',
    drops: [2, 0, 0, 11],
    gh: 20,
    ka: 45,
    ghErr: '-19.6',
    kaErr: '-1.8',
  },
  {
    id: 'lotus-simple-and-sweet-espresso',
    drops: [2, 0, 14, 0],
    gh: 20,
    ka: 55,
    ghErr: '-19.6',
    kaErr: '2.3',
  },
  {
    id: 'lotus-bright-and-juicy',
    drops: [4, 4, 2, 2],
    gh: 72,
    ka: 18,
    ghErr: '-10.7',
    kaErr: '-10.7',
  },
  { id: 'lotus-raos-recipe', drops: [4, 5, 3, 2], gh: 72.3, ka: 20.1, ghErr: '0.0', kaErr: '-0.1' },
  { id: 'lotus-ultra-light', drops: [2, 2, 0, 2], gh: 35, ka: 10, ghErr: '-8.2', kaErr: '-19.6' },
] as const;

const ORDER = ['lotus-magnesium', 'lotus-calcium', 'lotus-sodium', 'lotus-potassium'] as const;

/** Whole drops per bottle at a given volume, in Mg/Ca/Na/K order. */
function dropsAt(recipeId: string, volumeMl: number): number[] {
  const recipe = lotusRecipes.find((r) => r.id === recipeId);
  if (!recipe) throw new Error(`no recipe ${recipeId}`);
  const scale = volumeMl / recipe.referenceVolumeMl;
  return ORDER.map((componentId) => {
    const addition = recipe.additions.find((a) => a.component === componentId);
    return addition ? Math.round(addition.amount * scale) : 0;
  });
}

/** Hardness and alkalinity actually delivered, once the drops are whole. */
function deliveredAt(recipeId: string, volumeMl: number) {
  const drops = dropsAt(recipeId, volumeMl);
  const litres = volumeMl / 1000;
  let hardness = 0;
  let alkalinity = 0;
  ORDER.forEach((componentId, i) => {
    const component = componentMap.get(componentId);
    const count = drops[i] ?? 0;
    if (!component?.ions || count === 0) return;
    const perDrop = component.ions.asCaCO3;
    hardness += ((perDrop.hardness ?? 0) * count) / litres;
    alkalinity += ((perDrop.alkalinity ?? 0) * count) / litres;
  });
  return { hardness, alkalinity };
}

const errorPct = (delivered: number, target: number) =>
  (((delivered - target) / target) * 100).toFixed(1);

describe('Lotus recipes reproduce the published quantisation table at 1 L', () => {
  it.each(LOTUS_AT_ONE_LITRE)('$id', (row) => {
    expect(dropsAt(row.id, 1000)).toEqual([...row.drops]);
  });

  it.each(LOTUS_AT_ONE_LITRE)('$id — hardness and alkalinity targets', (row) => {
    const recipe = lotusRecipes.find((r) => r.id === row.id);
    const sum = (ids: readonly string[]) =>
      (recipe?.target ?? [])
        .filter((t) => ids.includes(t.component))
        .reduce((acc, t) => acc + t.caco3Ppm, 0);
    expect(sum(['lotus-magnesium', 'lotus-calcium'])).toBeCloseTo(row.gh, 6);
    expect(sum(['lotus-sodium', 'lotus-potassium'])).toBeCloseTo(row.ka, 6);
  });

  it.each(LOTUS_AT_ONE_LITRE)('$id — rounding error the vendor never shows', (row) => {
    const { hardness, alkalinity } = deliveredAt(row.id, 1000);
    expect(errorPct(hardness, row.gh)).toBe(row.ghErr);
    expect(errorPct(alkalinity, row.ka)).toBe(row.kaErr);
  });
});

describe('the case that justifies the app', () => {
  it("drops potassium entirely from Rao's Recipe at 250 ml", () => {
    // The vendor's calculator rounds this to zero and still reports the target
    // profile. A mineral silently vanishes from the recipe.
    const [mg, ca, na, k] = dropsAt('lotus-raos-recipe', 250);
    expect(k).toBe(0);
    expect([mg, ca, na]).toEqual([1, 1, 1]);
  });

  it('is exactly reproducible at one litre, and only there', () => {
    // Rao's is the only recipe whose targets were reverse-engineered onto whole
    // drops, so it is the control: near-zero error at 1 L, real error below it.
    const clean = deliveredAt('lotus-raos-recipe', 1000);
    expect(Math.abs(Number(errorPct(clean.hardness, 72.3)))).toBeLessThan(0.1);

    const cup = deliveredAt('lotus-raos-recipe', 250);
    expect(Math.abs(Number(errorPct(cup.alkalinity, 20.1)))).toBeGreaterThan(15);
  });
});

describe('Apax', () => {
  const APAX_BRAND_IDS = ['apax-lab', 'apax-lab-original'];
  const totalGPerLitre = (recipeId: string) => {
    const recipe = apaxRecipes.find((r) => r.id === recipeId);
    if (!recipe) throw new Error(`no recipe ${recipeId}`);
    const total = recipe.additions.reduce((acc, a) => acc + a.amount, 0);
    return total / (recipe.referenceVolumeMl / 1000);
  };

  it('ships as two ranges, not one brand with an optional bottle', () => {
    // KONFLUX did not simply get added to the old recipes — Apax rebalanced the
    // rest — so the ranges are not derivable from one another.
    expect(apaxBrands.map((b) => b.id)).toEqual(APAX_BRAND_IDS);
    expect(apaxBrands.find((b) => b.id === 'apax-lab')?.isDefault).toBe(true);
    expect(componentsForBrand('apax-lab')).toHaveLength(4);
    expect(componentsForBrand('apax-lab-original')).toHaveLength(3);
    expect(recipesForBrand('apax-lab')).toHaveLength(15);
    expect(recipesForBrand('apax-lab-original')).toHaveLength(8);
  });

  it('namespaces concentrates per range so a component belongs to one brand', () => {
    expect(getComponent('apax-lab-tonik')?.brand).toBe('apax-lab');
    expect(getComponent('apax-lab-original-tonik')?.brand).toBe('apax-lab-original');
    expect(getComponent('apax-lab-original-konflux')).toBeUndefined();
  });

  it('tells the user the original range came from the calculator, not the card', () => {
    const original = apaxBrands.find((b) => b.id === 'apax-lab-original');
    expect(original?.displayNote).toMatch(/differs slightly from supplied card/i);
  });

  it('holds the 4.0 g/L envelope except where the vendor published otherwise', () => {
    // The brief asks for a warning rather than a hard constraint, because this
    // must never reject or auto-correct vendor data. Encoding the two known
    // exceptions gets both: these ship untouched, and any *new* deviation fails
    // loudly and has to be looked at and documented rather than slipping through.
    const deviating = apaxRecipes
      .filter((r) => Math.abs(totalGPerLitre(r.id) - APAX_TOTAL_G_PER_L) > 1e-9)
      .map((r) => r.id);
    expect(deviating.sort()).toEqual(Object.keys(APAX_ANOMALIES).sort());
  });

  it('records each deviation on the recipe itself, traceably', () => {
    expect(totalGPerLitre('apax-lab-nemo-pop')).toBeCloseTo(3.5, 9);
    expect(totalGPerLitre('apax-lab-original-natural')).toBeCloseTo(4.1, 9);
    for (const id of Object.keys(APAX_ANOMALIES)) {
      const recipe = apaxRecipes.find((r) => r.id === id);
      expect(recipe?.anomaly?.kind).toBe('total-mismatch');
      // Neither is worth alarming a user about at 6am.
      expect(recipe?.anomaly?.userFacing).toBe(false);
    }
  });

  it('converts grams to drops half-up, and does not treat drop totals as an invariant', () => {
    expect(dropsForGrams(1)).toBe(15);
    expect(dropsForGrams(0.5)).toBe(8); // 7.5 rounds up
    expect(dropsForGrams(2.5)).toBe(38); // 37.5 rounds up

    // Washed is a valid 4.0 g/L recipe that totals 61 drops, not 60, because two
    // of its doses round up. Validating on drops would flag a correct recipe.
    const washed = apaxRecipes.find((r) => r.id === 'apax-lab-washed');
    const drops = washed?.additions.reduce((acc, a) => acc + dropsForGrams(a.amount), 0);
    expect(totalGPerLitre('apax-lab-washed')).toBeCloseTo(4.0, 9);
    expect(drops).toBe(61);
  });

  it("keeps Martin Wölfl's recipe identical across both ranges, using no KONFLUX", () => {
    const doses = (brandId: string) =>
      apaxRecipes
        .find((r) => r.id === `${brandId}-martin-wolfl-2024`)
        ?.additions.map((a) => [a.component.replace(`${brandId}-`, ''), a.amount]);

    expect(doses('apax-lab')).toEqual([
      ['tonik', 1.0],
      ['jamm', 1.0],
      ['lylac', 2.0],
    ]);
    expect(doses('apax-lab-original')).toEqual(doses('apax-lab'));
  });

  it('preserves the roast inversion between the two ranges rather than fixing it', () => {
    const has = (recipeId: string, concentrate: string) =>
      apaxRecipes
        .find((r) => r.id === recipeId)
        ?.additions.some((a) => a.component.endsWith(`-${concentrate}`)) ?? false;

    // Legacy Light Roast is JAMM-dominant; the current one has no JAMM at all.
    expect(has('apax-lab-original-light-roast', 'jamm')).toBe(true);
    expect(has('apax-lab-light-roast', 'jamm')).toBe(false);
    // Legacy Dark Roast is TONIK-dominant; the current one has no TONIK.
    expect(has('apax-lab-original-dark-roast', 'tonik')).toBe(true);
    expect(has('apax-lab-dark-roast', 'tonik')).toBe(false);
  });

  it('doses in grams, with the dropper as the alternative', () => {
    for (const c of components.filter((x) => APAX_BRAND_IDS.includes(x.brand))) {
      expect(c.doseUnit).toBe('g');
      expect(defaultDispenser(c)?.unit).toBe('g');
      const dropper = c.dispensers.find((d) => d.unit === 'drop');
      expect(dropper?.equivalentInDoseUnit).toBeCloseTo(1 / 15, 10);
      expect(dropper?.allowPartial).toBe(false);
    }
  });

  it('publishes no ion data, so cannot join a cross-brand comparison', () => {
    for (const c of components.filter((x) => APAX_BRAND_IDS.includes(x.brand))) {
      expect(c.ions).toBeUndefined();
    }
  });

  it('groups its recipes, because fifteen is too many to read as a flat list', () => {
    const groups = groupedRecipesForBrand('apax-lab').map((g) => g.group);
    expect(groups).toEqual(['process', 'roast', 'brew-method', 'varietal', 'signature']);
  });
});
