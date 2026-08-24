/**
 * Apax Lab.
 *
 * Dose-first, and the mirror image of Lotus: the dose *is* the recipe and any
 * resulting profile is a side effect. Apax publishes ingredient lists but not
 * quantities, so no component here carries ion data — Apax cannot join a
 * cross-brand comparison and cannot show a hardness/alkalinity breakdown. That
 * is a limitation of what the vendor publishes, not a gap to fill in.
 *
 * ---
 *
 * Two brands, not one with a toggle
 *
 * Apax ships as two separate ranges. The current range has four concentrates;
 * the pre-KONFLUX range has three. Modelling this as one brand with an optional
 * fourth bottle would be wrong on the facts: Apax re-balanced the other recipes
 * when KONFLUX arrived rather than simply adding it, Light and Dark Roast
 * effectively swapped character between versions, and six of the current rows
 * have no legacy equivalent at all. A toggle would imply the new range is the
 * old one plus a splash, which would hand someone a wrong cup.
 *
 * ---
 *
 * Values are mapped from `sources/apax-lab.json` rather than transcribed, so
 * twenty-three recipes across two ranges cannot pick up a typo on the way in.
 * `docs/apax-lab-brief.md` is the research behind that file.
 */

import source from './sources/apax-lab.json';
import type { Anomaly, Brand, Component, Recipe, RecipeGroup } from './types';

/** 1.000 g of concentrate = 15 drops, from Apax's own table. This is a property
 *  of *their* dropper and has nothing to do with a Lotus drop. */
const DROPS_PER_GRAM = source.units.gram_to_drops;
const GRAMS_PER_DROP = 1 / DROPS_PER_GRAM;

export const APAX_TOTAL_G_PER_L = source.validation.expected_total_g_per_litre;

/**
 * Whole drops for a gram dose. Half-up, per the brief.
 *
 * Note this is *not* how the recipe is validated. A 4.0 g/L recipe containing
 * 0.5 g and 2.5 g doses rounds up twice and totals 61 or 62 drops, so a drop
 * total is not a meaningful invariant — grams are.
 */
export const dropsForGrams = (grams: number, litres = 1) =>
  Math.round(grams * litres * DROPS_PER_GRAM);

/**
 * Label colours. The design handoff samples three bottles; KONFLUX post-dates it
 * and has no published value here, so it takes the handoff's documented fallback
 * of neutral slate. Replace when the real label colour is known — nothing else
 * needs to change.
 */
const COLOURS: Record<string, { light: string; dark: string }> = {
  tonik: { light: '#6FB87F', dark: '#93CFA0' },
  jamm: { light: '#E86A58', dark: '#FA8B7C' },
  lylac: { light: '#B9A3D6', dark: '#D6C7E8' },
  konflux: { light: '#7E8A8C', dark: '#9DAAAC' },
};

/** Bar colours may be too light to use as text — Apax's mint fails AA on white —
 *  so the text-safe accent is always a separate token. */
const ACCENT = { light: '#2F7A45', dark: '#93CFA0' };

/**
 * The two published exceptions to the 4.0 g/L envelope, and the only ones
 * allowed. The brief asks for a warning rather than a hard constraint on vendor
 * data, so the test does not assert that every recipe totals 4.0 — it asserts
 * that nothing deviates *except these*. A new deviation therefore fails loudly
 * and has to be looked at and documented, while these two ship untouched.
 */
export const APAX_ANOMALIES: Record<string, Anomaly> = {
  'apax-lab-original-natural': {
    kind: 'total-mismatch',
    detail:
      'JAMM 2.6 g/L gives a 4.1 g/L total, the only legacy row that breaks the 4.0 ' +
      'invariant. The supplied card says 2.7 and the surrounding pattern would suggest ' +
      '2.5. Shipped as published.',
    userFacing: false,
  },
  'apax-lab-nemo-pop': {
    kind: 'total-mismatch',
    detail:
      'Totals 3.5 g/L, the only exception in the current range. Plausibly a deliberate ' +
      'lighter dilution for a personal recipe. Shipped as published.',
    userFacing: false,
  },
};

type SourceBrand = (typeof source.brands)[number];

const dispensersFor = () => [
  {
    id: 'apax-scale',
    label: 'Scale',
    unit: 'g' as const,
    // Reading resolution, not a physical limit, so partials are meaningful and
    // rounding messaging stays quiet.
    step: 0.01,
    allowPartial: true,
    equivalentInDoseUnit: 1,
    isDefault: true,
  },
  {
    id: 'apax-dropper',
    label: 'Dropper',
    unit: 'drop' as const,
    // A drop cannot be halved, so this quantises for real. At a litre a recipe
    // is around 60 drops, which is why the scale is the default.
    step: 1,
    allowPartial: false,
    equivalentInDoseUnit: GRAMS_PER_DROP,
  },
];

function buildBrand(sb: SourceBrand): Brand {
  return {
    id: sb.id,
    name: sb.name,
    shortName: sb.id === 'apax-lab' ? 'Apax' : 'Apax 3',
    subtitle: sb.subtitle,
    source: {
      url: 'https://apaxlab.com',
      verifiedOn: source.generated,
      confidence: 'high',
      notes: sb.source,
    },
    ...('display_note' in sb && sb.display_note ? { displayNote: sb.display_note } : {}),
    ...(sb.default ? { isDefault: true } : {}),
    // Both ranges are the same physical concentrates on the same scale, so they
    // share one unit preference.
    unitGroup: 'apax',
    accent: ACCENT,
  };
}

/**
 * Components are namespaced per range rather than shared. The two ranges are
 * modelled as separate brands, and a component belonging to exactly one brand is
 * an invariant worth keeping — the duplication is three records, generated, not
 * transcribed.
 */
function buildComponents(sb: SourceBrand): Component[] {
  return sb.concentrates.map((c) => ({
    id: `${sb.id}-${c.id}`,
    brand: sb.id,
    name: c.name,
    kind: 'product' as const,
    doseUnit: 'g' as const,
    dispensers: dispensersFor(),
    ...(COLOURS[c.id] ? { colour: COLOURS[c.id] } : {}),
    order: c.order,
  }));
}

function buildRecipes(sb: SourceBrand): Recipe[] {
  return sb.recipes.map((r) => {
    const id = `${sb.id}-${r.id}`;
    const doses: Record<string, number> = r.doses;

    return {
      id,
      brand: sb.id,
      name: r.name,
      referenceVolumeMl: source.units.base_volume_ml,
      statedAs: 'dose' as const,
      // A concentrate at zero is left out entirely, so it drops out of the dose
      // list and the colour cluster without anything downstream special-casing it.
      additions: Object.entries(doses)
        .filter(([, grams]) => grams > 0)
        .map(([concentrate, grams]) => ({
          component: `${sb.id}-${concentrate}`,
          amount: grams,
        })),
      scaling: 'linear' as const,
      group: r.group as RecipeGroup,
      ...('note' in r && r.note ? { notes: r.note } : {}),
      ...(APAX_ANOMALIES[id] ? { anomaly: APAX_ANOMALIES[id] } : {}),
    };
  });
}

export const apaxBrands: Brand[] = source.brands.map(buildBrand);
export const apaxComponents: Component[] = source.brands.flatMap(buildComponents);
export const apaxRecipes: Recipe[] = source.brands.flatMap(buildRecipes);
