/**
 * The one line that tells you what you are actually about to make.
 *
 * The app's whole argument compressed into a sentence. Most mornings the number
 * is fine and should be nearly invisible; occasionally it is 20% off and should
 * be noticed without alarm. Past a third off, or with a bottle missing, the water
 * is no longer the recipe, and that is the one case that should look like an
 * error.
 */

import type { Dose, DoseLine } from '@/engine';

export type RoundingStatus = 'ok' | 'warning' | 'error';

/**
 * How far off a dose is, in the steps that change what the app says.
 *
 * - `onTarget`: under `EXACT`, which displays as 0%.
 * - `close`: within the user's flag threshold.
 * - `off`: past the threshold.
 * - `farOff`: more than `FAR_OFF`, whatever the threshold.
 * - `missing`: a bottle rounds to zero.
 *
 * `farOff` and `missing` share a severity: a third off and a bottle gone are
 * both a different water, not a less accurate one.
 */
export type Band = 'onTarget' | 'close' | 'off' | 'farOff' | 'missing';

export const SEVERITY: Record<Band, RoundingStatus> = {
  onTarget: 'ok',
  close: 'ok',
  off: 'warning',
  farOff: 'error',
  missing: 'error',
};

/** Null when rounding is not worth mentioning — see `Dose.showsRounding`. */
export type RoundingSummary = { status: RoundingStatus; text: string } | null;

/** Below this the dose is exact for any practical purpose, and saying "0% off"
 *  would be pedantry rather than honesty. */
export const EXACT = 0.005;

/** A third off. Fixed rather than relative to the flag threshold: the threshold is
 *  a preference about when to be told, and this is a fact about the water. The
 *  threshold's own ceiling is 20%, which keeps the two from meeting. */
export const FAR_OFF = 1 / 3;

/**
 * More than a third, with exactly a third counting as Off, as the copy says.
 *
 * The slack is for floating point: 2 drops against 1.5 is exactly a third over,
 * but the division lands a few ulps either side of `1 / 3` depending on the
 * route the numbers took to get there.
 */
const isFarOff = (gap: number) => Math.abs(gap) > FAR_OFF + 1e-9;

/** A gap as the whole, signed percentage the screen shows. Ties and comparisons
 *  are made on this, so they always agree with the figures beside them. */
const shownPercent = (gap: number) => Math.round(gap * 100);

/**
 * Which of the figures on the detail screen the headline is quoting.
 *
 * The headline is one percentage over a screen showing six. Unless it names
 * which one it quotes, a reader checks it against the wrong row, gets a different
 * answer, and cannot tell whether the app or their arithmetic is wrong. Naming
 * the source is half of making the number verifiable — `formatPpm`'s second
 * decimal is the other half.
 */
export type HeadlineSource =
  /** The error in the finished water, where the vendor publishes enough to know it. */
  | { kind: 'profile'; measure: 'hardness' | 'alkalinity'; label: string }
  /** The worst single bottle, where it does not. */
  | { kind: 'bottle'; componentId: string; label: string };

export type Headline = {
  gap: number;
  /** Null only when there is nothing to report — no profile and no bottles. */
  source: HeadlineSource | null;
};

/**
 * The gap worth reporting, signed, and where it came from. Negative means the
 * water is weaker than asked.
 *
 * Where the vendor publishes ion data this is the error in the *water* — which is
 * what the user actually cares about, and is usually far smaller than the error on
 * any single bottle. Simple and Sweet at a litre has a bottle 7% out but delivers
 * hardness within 1.8%, and reporting the 7% would overstate the problem.
 *
 * Without ion data there is no honest statement about the water, so it falls back
 * to the worst single bottle.
 */
export function headline(dose: Dose): Headline {
  const profile = dose.profile;
  if (profile) {
    const { hardnessError: h, alkalinityError: a } = profile;
    return Math.abs(h) >= Math.abs(a)
      ? { gap: h, source: { kind: 'profile', measure: 'hardness', label: 'Hardness' } }
      : { gap: a, source: { kind: 'profile', measure: 'alkalinity', label: 'Alkalinity' } };
  }

  let worst: Headline = { gap: 0, source: null };
  for (const line of dose.lines) {
    if (line.exact <= 0) continue;
    const signed = line.error / line.exact;
    if (Math.abs(signed) > Math.abs(worst.gap) || worst.source === null) {
      worst = {
        gap: signed,
        source: { kind: 'bottle', componentId: line.component.id, label: line.component.name },
      };
    }
  }
  return worst;
}

export const headlineGap = (dose: Dose): number => headline(dose).gap;

/**
 * The same steps for one figure on its own — a bottle, or hardness — so a row in
 * the breakdown is coloured by the rule that colours the headline. Null when the
 * figure is within the threshold.
 */
export function missSeverity(
  gap: number,
  flagAbove: number,
  zeroed = false,
): Exclude<RoundingStatus, 'ok'> | null {
  if (zeroed || isFarOff(gap)) return 'error';
  return Math.abs(gap) > flagAbove ? 'warning' : null;
}

/** Null when rounding is not shown at all, which is any dose measured in grams. */
export function band(dose: Dose, flagAbove: number): Band | null {
  if (!dose.showsRounding) return null;
  if (dose.zeroed.length > 0) return 'missing';
  const gap = Math.abs(headlineGap(dose));
  if (gap < EXACT) return 'onTarget';
  if (isFarOff(gap)) return 'farOff';
  return gap > flagAbove ? 'off' : 'close';
}

export function roundingSummary(dose: Dose, flagAbove = 0.1): RoundingSummary {
  const which = band(dose, flagAbove);
  if (which === null) return null;
  const status = SEVERITY[which];

  if (which === 'missing') {
    // A mineral vanishing is a different failure from being a few percent out,
    // and it is the one the vendor calculators hide completely.
    const names = dose.zeroed.map((l) => l.component.name);
    return {
      status,
      text:
        names.length === 1
          ? `No ${names[0]} at this volume`
          : `${names.length} bottles missing at this volume`,
    };
  }

  if (which === 'onTarget') return { status, text: 'On target' };

  const gap = headlineGap(dose);
  const percent = Math.round(Math.abs(gap) * 100);
  const direction = gap < 0 ? 'under' : 'over';
  // The same words either side of the threshold: the status mark carries the
  // difference, so a large gap is noticed without the sentence raising its voice.
  // Far off is longer, and names the volume as the cause.
  const suffix = which === 'farOff' ? ' at this volume' : '';
  return { status, text: `${percent}% ${direction} target${suffix}` };
}

/** One name, two joined with "and", or a count past that. */
function joinNames(names: string[]): string {
  if (names.length <= 2) return names.join(' and ');
  return `${names.length} bottles`;
}

/**
 * What the headline percentage is quoting, for "14% over target on alkalinity".
 *
 * Every figure showing the same signed percentage is named, not just the one the
 * arithmetic happened to pick: two bottles both 7% over are equally the answer.
 * Signed, because 7% over and 7% under are not the same miss. Missing bottles are
 * all 100% under, so they tie with each other by construction.
 */
export function headlineLabel(dose: Dose): string {
  if (dose.zeroed.length > 0) return joinNames(dose.zeroed.map((l) => l.component.name));

  const { gap, source } = headline(dose);
  const shown = shownPercent(gap);
  const profile = dose.profile;
  if (profile) {
    return [
      ['hardness', profile.hardnessError],
      ['alkalinity', profile.alkalinityError],
    ]
      .filter(([, error]) => shownPercent(error as number) === shown)
      .map(([name]) => name as string)
      .join(' and ');
  }

  const tied = dose.lines.filter((l) => l.exact > 0 && shownPercent(l.error / l.exact) === shown);
  return tied.length > 0 ? joinNames(tied.map((l) => l.component.name)) : (source?.label ?? '');
}

/**
 * Why the water can be nearer its target than the bottles that make it.
 *
 * Each water figure is the sum of the bottles that feed it, so its gap is a
 * weighted mix of theirs: never further out than the furthest of them, and nearer
 * whenever another bottle is less far out. Said only when the furthest bottle is
 * visibly further out than the headline, or the tables would show the
 * contradiction the sentence exists to explain. Not with a bottle missing, where
 * "closer than Potassium alone" would describe a bottle that is not there.
 */
export function blendNote(dose: Dose): string | null {
  if (!dose.profile || dose.zeroed.length > 0) return null;

  const gapOf = (l: DoseLine) => (l.exact > 0 ? Math.abs(shownPercent(l.error / l.exact)) : 0);
  const furthest = dose.lines.reduce<DoseLine | undefined>(
    (worst, l) => (!worst || gapOf(l) > gapOf(worst) ? l : worst),
    undefined,
  );
  if (!furthest || gapOf(furthest) <= Math.abs(shownPercent(headlineGap(dose)))) return null;

  const figure = furthest.component.ions?.asCaCO3.hardness ? 'hardness' : 'alkalinity';
  const feeders = dose.lines.filter((l) => l.component.ions?.asCaCO3[figure]);
  const name = figure === 'hardness' ? 'Hardness' : 'Alkalinity';
  return `${name} comes from ${joinNames(feeders.map((l) => l.component.name))} together, so it’s closer to target than ${furthest.component.name} alone.`;
}
