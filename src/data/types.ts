/**
 * The domain model, mirroring `docs/water-schema-v0.md`.
 *
 * The structural point of the schema is that a recipe is always "component +
 * amount at a reference volume", whichever way the vendor happens to think about
 * it. Apax states doses ("2.7 g/L Tonik"); Lotus states targets ("50 ppm Mg").
 * Both end up as the same object, and the difference is recorded in `statedAs`
 * rather than in the shape.
 *
 * Three concerns are kept apart, and conflating them is what breaks vendor
 * calculators:
 *
 *   1. what the recipe means      — `Recipe.target`, optional
 *   2. what you add               — `Recipe.additions`, always present
 *   3. how you measure it         — `Dispenser`, never inside a recipe
 */

export type Confidence = 'high' | 'medium' | 'low';

export type Source = {
  url: string;
  /** ISO date the numbers were last checked against the source. */
  verifiedOn: string;
  confidence: Confidence;
  notes?: string;
};

/** The vendor's natural unit for a component. There is no universal canonical
 *  unit: Lotus drops cannot honestly be converted to grams without data nobody
 *  publishes. */
export type DoseUnit = 'drop' | 'g' | 'ml' | 'sachet';

export type Dispenser = {
  id: string;
  label: string;
  /** What this dispenser measures in, which may differ from the component's
   *  `doseUnit` — an Apax dose is grams, but you can deliver it by dropper. */
  unit: DoseUnit;
  /** Smallest increment the dispenser can deliver or read, in `unit`. */
  step: number;
  /**
   * Whether a fraction of a unit is physically deliverable.
   *
   * A dropper and a sachet cannot be halved, so their quantisation is a real
   * constraint that introduces real error. A scale's step is only its reading
   * resolution. Rounding messaging is suppressed when this is true — the error
   * exists but is too small to be worth a word at 6am.
   */
  allowPartial: boolean;
  /** How many of the component's `doseUnit` one `unit` of this dispenser
   *  delivers. Identity for a matching unit; 0.0667 g for an Apax drop. */
  equivalentInDoseUnit: number;
  isDefault?: boolean;
};

export type Ion = 'Mg' | 'Ca' | 'Na' | 'K' | 'Cl' | 'HCO3';

/**
 * Contribution per dose unit per litre, expressed as ppm CaCO₃. A component
 * donates hardness or alkalinity, not usually both.
 */
export type CaCO3Contribution = {
  hardness?: number;
  alkalinity?: number;
};

/**
 * Optional. Lotus publishes enough to fill this in; Apax publishes ingredient
 * lists but no quantities, so its components carry none. Absence means that
 * component cannot join a cross-brand comparison — a known limitation, not a
 * broken record.
 */
export type Ions = {
  asCaCO3: CaCO3Contribution;
  mgPerL: Partial<Record<Ion, number>>;
};

/** Label colours, so the user matches the sticker in their hand rather than
 *  reading a word. Light and dark carry different values of the same hue. */
export type BottleColour = {
  light: string;
  dark: string;
  /** A very pale label needs an inner edge to stay visible on a white card. */
  edgeOnLight?: string;
};

/** A component made up at home rather than bought ready to dose. Recursion
 *  depth one is enough: nobody makes a stock from a stock. */
export type Preparation = {
  ingredients: { name: string; amount: number | null; unit: string }[];
  solvent: string;
  yieldMl: number;
};

export type Component = {
  id: string;
  brand: string;
  name: string;
  /** The schema calls this `type`; `kind` here to keep it clearly a discriminant. */
  kind: 'product' | 'prepared';
  doseUnit: DoseUnit;
  dispensers: Dispenser[];
  ions?: Ions;
  colour?: BottleColour;
  /** Display order within its brand, as the vendor lists them. */
  order?: number;
  preparation?: Preparation;
  /** Set when the numbers are not verified against a primary source. Such a
   *  component must never ship. */
  unverified?: true;
};

export type Brand = {
  id: string;
  name: string;
  /** Short form for chips and tight spaces. */
  shortName: string;
  /** Disambiguates two ranges from the same vendor, e.g. "Pre-KONFLUX range". */
  subtitle?: string;
  source: Source;
  /**
   * Shown to the user on the brand itself. Distinct from `source.notes`, which
   * is provenance for us. Used where the user needs to know something about the
   * data — for instance that the original Apax range comes from the calculator
   * and differs from the card in the box.
   */
  displayNote?: string;
  /** Which range to prefer when one vendor ships more than one. */
  isDefault?: boolean;
  /** Text-safe brand colour for links and active states. Deliberately separate
   *  from bottle colours: a bar colour may be too light to use as text. */
  accent: { light: string; dark: string };
};

/**
 * How a vendor organises its recipe list. Apax's current range has fifteen
 * recipes, which is too many to read as a flat list at 6am.
 */
export type RecipeGroup = 'process' | 'roast' | 'brew-method' | 'varietal' | 'signature';

/**
 * A published value that departs from the vendor's own stated pattern.
 *
 * Recorded rather than corrected. If a number is wrong it should be traceably
 * wrong in the same way the vendor's table is — silently "fixing" vendor data
 * means the app and the bottle in your hand disagree, and the app is the one
 * nobody can check.
 */
export type Anomaly = {
  kind: 'total-mismatch' | 'cross-version-inversion';
  detail: string;
  /** Whether the user should be told, or whether it is only a note for us. */
  userFacing: boolean;
};

export type Addition = {
  component: string;
  /** In the component's `doseUnit`, at the recipe's reference volume. There is
   *  no per-addition unit field, and so no class of mismatch bug. */
  amount: number;
};

/** What the recipe is trying to achieve, when the vendor states it that way.
 *  ppm as CaCO₃, attributed to the component that delivers it. */
export type TargetEntry = {
  component: string;
  caco3Ppm: number;
};

export type Recipe = {
  id: string;
  brand: string;
  name: string;
  referenceVolumeMl: number;
  /** Which way the vendor thinks. Documentation, not behaviour — it matters when
   *  the numbers need re-checking. */
  statedAs: 'dose' | 'target';
  additions: Addition[];
  /** Present for target-first recipes. `additions` is derived from it. */
  target?: TargetEntry[];
  scaling: 'linear';
  /** The author of the recipe, where one is credited. Never the vendor's
   *  marketing description. */
  attribution?: string;
  notes?: string;
  group?: RecipeGroup;
  anomaly?: Anomaly;
};
