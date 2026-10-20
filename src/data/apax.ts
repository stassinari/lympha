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
 * Two ranges, not one with a toggle
 *
 * Apax ships as two separate ranges. The current range has four concentrates;
 * the pre-KONFLUX range has three. Modelling this as one range with an optional
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
import type { Anomaly, Range, Component, Recipe, RecipeGroup } from './types';

/** 1.000 g of concentrate = 15 drops, from Apax's own table. This is a property
 *  of *their* dropper and has nothing to do with a Lotus drop. */
const DROPS_PER_GRAM = source.units.gram_to_drops;
const GRAMS_PER_DROP = 1 / DROPS_PER_GRAM;

export const APAX_TOTAL_G_PER_L = source.validation.expected_total_g_per_litre;

/**
 * Whole drops for a gram dose, rounded half-up as Apax does.
 *
 * Note this is *not* how the recipe is validated. A 4.0 g/L recipe containing
 * 0.5 g and 2.5 g doses rounds up twice and totals 61 or 62 drops, so a drop
 * total is not a meaningful invariant — grams are.
 */
export const dropsForGrams = (grams: number, litres = 1) =>
  Math.round(grams * litres * DROPS_PER_GRAM);

/**
 * Label colours, agreed with the designer, superseding the design handoff's Apax
 * table (which predates KONFLUX). TONIK and JAMM match the handoff; LYLAC is
 * warmed slightly to sit beside KONFLUX. See `docs/decisions.md`.
 */
const COLOURS: Record<string, { light: string; dark: string }> = {
  tonik: { light: '#6FB87F', dark: '#93CFA0' },
  jamm: { light: '#E86A58', dark: '#FA8B7C' },
  lylac: { light: '#B098D8', dark: '#CBB6EA' },
  konflux: { light: '#BE4C7C', dark: '#DA6FA6' },
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

type SourceRange = (typeof source.brands)[number];

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

/**
 * How the ranges are named and ordered on screen. The source keeps the research's
 * own labels and default as provenance; what the app shows is copy, and lives here.
 *
 * "[K]" is Apax's own shorthand for the KONFLUX addition. The three-bottle range is
 * first in the registry: it is the base set, and the default.
 */
const DISPLAY: Record<
  string,
  Pick<Range, 'name' | 'shortName' | 'rangeLabel'> &
    Partial<Pick<Range, 'spokenShortName' | 'displayNote' | 'isDefault'>>
> = {
  'apax-lab-original': {
    name: 'Apax Lab',
    shortName: 'Apax Lab',
    rangeLabel: 'Without KONFLUX',
    displayNote:
      'Apax Lab’s website lists recipes with KONFLUX only. The recipes without it are from its earlier calculator, so a few amounts differ slightly from the card in the box.',
    isDefault: true,
  },
  'apax-lab': {
    name: 'Apax Lab with KONFLUX',
    shortName: 'Apax Lab [K]',
    spokenShortName: 'Apax Lab with KONFLUX',
    rangeLabel: 'With KONFLUX',
  },
};

const DISPLAY_ORDER = ['apax-lab-original', 'apax-lab'];

function buildRange(sb: SourceRange): Range {
  const display = DISPLAY[sb.id]!;
  return {
    id: sb.id,
    kit: 'apax',
    name: display.name,
    shortName: display.shortName,
    rangeLabel: display.rangeLabel,
    ...(display.spokenShortName ? { spokenShortName: display.spokenShortName } : {}),
    subtitle: sb.subtitle,
    source: {
      url: 'https://apaxlab.com',
      verifiedOn: source.generated,
      confidence: 'high',
      notes: sb.source,
    },
    ...(display.displayNote ? { displayNote: display.displayNote } : {}),
    ...(display.isDefault ? { isDefault: true } : {}),
    accent: ACCENT,
  };
}

/**
 * Components are namespaced per range rather than shared. A component belonging
 * to exactly one range is an invariant worth keeping — the duplication is three
 * records, generated, not transcribed.
 */
function buildComponents(sb: SourceRange): Component[] {
  return sb.concentrates.map((c) => ({
    id: `${sb.id}-${c.id}`,
    range: sb.id,
    name: c.name,
    kind: 'product' as const,
    doseUnit: 'g' as const,
    dispensers: dispensersFor(),
    ...(COLOURS[c.id] ? { colour: COLOURS[c.id] } : {}),
    order: c.order,
  }));
}

function buildRecipes(sb: SourceRange): Recipe[] {
  return sb.recipes.map((r) => {
    const id = `${sb.id}-${r.id}`;
    const doses: Record<string, number> = r.doses;

    return {
      id,
      range: sb.id,
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

export const apaxRanges: Range[] = source.brands
  .map(buildRange)
  .sort((a, b) => DISPLAY_ORDER.indexOf(a.id) - DISPLAY_ORDER.indexOf(b.id));
export const apaxComponents: Component[] = source.brands.flatMap(buildComponents);
export const apaxRecipes: Recipe[] = source.brands.flatMap(buildRecipes);
