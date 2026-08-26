/**
 * Lotus Coffee Products.
 *
 * Target-first: the vendor's calculator takes a profile in ppm as CaCO₃ and
 * computes drops. Four bottles, split into a hardness pair (magnesium and
 * calcium chlorides) and an alkalinity pair (sodium and potassium bicarbonates)
 * — structurally the same hardness-plus-buffer system Barista Hustle sells
 * unmixed.
 */

import { additionsFromTarget } from '@/engine/resolve';
import type { Brand, Component, Recipe, TargetEntry } from './types';

const BRAND_ID = 'lotus';

/**
 * Lotus's published formula, read from their calculator's page script:
 *
 *   drops = ppm_caco3 × (volume_ml / 4500) × dropper_factor × (2 if monovalent)
 *
 * The 4500 mL base is an arbitrary hidden constant. Inverting it at one litre
 * gives the CaCO₃ each drop contributes. The schema document rounds these to
 * 8.04 and 4.02; the unrounded values are kept here because the app displays
 * rounding error to one decimal place, and 8.04 is not precise enough to
 * reproduce the vendor's own published figures at that resolution.
 */
const BASE_ML = 4500;
const ROUND_DROPPER_FACTOR = 0.56;

/** Divalent ions (Mg²⁺, Ca²⁺) map 1:1 to CaCO₃. */
const HARDNESS_PER_DROP_PER_LITRE = 1 / ((1000 / BASE_ML) * ROUND_DROPPER_FACTOR);
/** Monovalent ions (Na⁺, K⁺) take a factor of two, so half the CaCO₃ per drop. */
const ALKALINITY_PER_DROP_PER_LITRE = HARDNESS_PER_DROP_PER_LITRE / 2;

export const lotusConstants = {
  BASE_ML,
  ROUND_DROPPER_FACTOR,
  HARDNESS_PER_DROP_PER_LITRE,
  ALKALINITY_PER_DROP_PER_LITRE,
};

export const lotusBrand: Brand = {
  id: BRAND_ID,
  name: 'Lotus Coffee Products',
  shortName: 'Lotus',
  source: {
    url: 'https://lotuscoffeeproducts.com/pages/product-instructions',
    verifiedOn: '2026-08-22',
    confidence: 'high',
    notes: "Derived from the calculator's page script and confirmed against four manual readings.",
  },
  accent: { light: '#B8404F', dark: '#E4707E' },
};

/**
 * Only the round dropper is modelled. The straight dropper was the original and
 * has not been sold in years; it is a second array entry whenever someone asks.
 */
const roundDropper = {
  id: 'lotus-round',
  label: 'Round dropper',
  unit: 'drop',
  step: 1,
  allowPartial: false,
  equivalentInDoseUnit: 1,
  isDefault: true,
} as const;

export const lotusComponents: Component[] = [
  {
    id: 'lotus-magnesium',
    brand: BRAND_ID,
    name: 'Magnesium',
    kind: 'product',
    doseUnit: 'drop',
    dispensers: [roundDropper],
    ions: {
      asCaCO3: { hardness: HARDNESS_PER_DROP_PER_LITRE },
      mgPerL: { Mg: 1.953, Cl: 5.698 },
    },
    colour: { light: '#B8404F', dark: '#E4707E' },
  },
  {
    id: 'lotus-calcium',
    brand: BRAND_ID,
    name: 'Calcium',
    kind: 'product',
    doseUnit: 'drop',
    dispensers: [roundDropper],
    ions: {
      asCaCO3: { hardness: HARDNESS_PER_DROP_PER_LITRE },
      mgPerL: { Ca: 3.221, Cl: 5.698 },
    },
    colour: { light: '#EBB093', dark: '#EBB093' },
  },
  {
    id: 'lotus-sodium',
    brand: BRAND_ID,
    name: 'Sodium',
    kind: 'product',
    doseUnit: 'drop',
    dispensers: [roundDropper],
    ions: {
      asCaCO3: { alkalinity: ALKALINITY_PER_DROP_PER_LITRE },
      mgPerL: { Na: 1.847, HCO3: 4.903 },
    },
    // The palest label in the app, and shipped exactly as published. It reads as a
    // whisper against a white card, which is correct: the bar is decoration, and
    // "Sodium" plus its number is what tells you what to pour.
    colour: { light: '#F0DADC', dark: '#EBD3D5' },
  },
  {
    id: 'lotus-potassium',
    brand: BRAND_ID,
    name: 'Potassium',
    kind: 'product',
    doseUnit: 'drop',
    dispensers: [roundDropper],
    ions: {
      asCaCO3: { alkalinity: ALKALINITY_PER_DROP_PER_LITRE },
      mgPerL: { K: 3.142, HCO3: 4.903 },
    },
    colour: { light: '#4E9E98', dark: '#5AB3AC' },
  },
];

const MG = 'lotus-magnesium';
const CA = 'lotus-calcium';
const NA = 'lotus-sodium';
const K = 'lotus-potassium';

/**
 * Named recipes, lifted from the `data-ppm*` attributes on the calculator page's
 * `<option>` elements. All values are ppm as CaCO₃.
 *
 * Two ingest rules were applied:
 *
 *   - `Custom Recipe` is excluded. It is a UI sentinel with all-zero attributes,
 *     and ingested naively it becomes a selectable option that produces plain water.
 *   - Attribution is stored, not description. The `data-description` fields are
 *     marketing copy; the author's name is the part worth keeping.
 *
 * Components at zero ppm are omitted rather than stored as zero, so they drop out
 * of the dose list and the bottle-colour cluster without a special case.
 */
type RecipeSpec = {
  id: string;
  name: string;
  target: TargetEntry[];
  attribution?: string;
  notes?: string;
};

const SPECS: RecipeSpec[] = [
  {
    id: 'lotus-light-and-bright',
    name: 'Light and Bright',
    attribution: 'Lance Hedrick',
    target: [
      { component: CA, caco3Ppm: 60 },
      { component: K, caco3Ppm: 25 },
    ],
  },
  {
    id: 'lotus-simple-and-sweet',
    name: 'Simple and Sweet',
    attribution: 'Lance Hedrick',
    target: [
      { component: MG, caco3Ppm: 30 },
      { component: CA, caco3Ppm: 60 },
      { component: NA, caco3Ppm: 25 },
      { component: K, caco3Ppm: 15 },
    ],
  },
  {
    id: 'lotus-light-and-bright-espresso',
    name: 'Light and Bright (espresso)',
    attribution: 'Lance Hedrick',
    target: [
      { component: MG, caco3Ppm: 20 },
      { component: K, caco3Ppm: 45 },
    ],
  },
  {
    id: 'lotus-simple-and-sweet-espresso',
    name: 'Simple and Sweet (espresso)',
    attribution: 'Lance Hedrick',
    target: [
      { component: MG, caco3Ppm: 20 },
      { component: NA, caco3Ppm: 55 },
    ],
  },
  {
    id: 'lotus-bright-and-juicy',
    name: 'Bright and Juicy',
    attribution: 'Mike Bawden',
    target: [
      { component: MG, caco3Ppm: 36 },
      { component: CA, caco3Ppm: 36 },
      { component: NA, caco3Ppm: 9 },
      { component: K, caco3Ppm: 9 },
    ],
  },
  {
    id: 'lotus-raos-recipe',
    name: "Rao's Recipe",
    attribution: 'Scott Rao',
    notes:
      'The odd decimals are reverse-engineered to land on whole drops at exactly one ' +
      'litre. It is the only Lotus recipe that comes out clean.',
    target: [
      { component: MG, caco3Ppm: 32.1 },
      { component: CA, caco3Ppm: 40.2 },
      { component: NA, caco3Ppm: 12.1 },
      { component: K, caco3Ppm: 8 },
    ],
  },
  {
    id: 'lotus-ultra-light',
    name: 'Ultra Light',
    attribution: 'Lotus',
    target: [
      { component: MG, caco3Ppm: 15 },
      { component: CA, caco3Ppm: 20 },
      { component: K, caco3Ppm: 10 },
    ],
  },
];

const REFERENCE_VOLUME_ML = 1000;

const byId = new Map(lotusComponents.map((c) => [c.id, c]));

export const lotusRecipes: Recipe[] = SPECS.map((spec) => ({
  id: spec.id,
  brand: BRAND_ID,
  name: spec.name,
  referenceVolumeMl: REFERENCE_VOLUME_ML,
  statedAs: 'target',
  target: spec.target,
  additions: additionsFromTarget(spec.target, byId, REFERENCE_VOLUME_ML),
  scaling: 'linear',
  ...(spec.attribution ? { attribution: spec.attribution } : {}),
  ...(spec.notes ? { notes: spec.notes } : {}),
}));
