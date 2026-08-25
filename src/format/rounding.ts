/**
 * The one line that tells you what you are actually about to make.
 *
 * This is the app's whole argument compressed into a sentence, so the design
 * brief is strict about it: most mornings the number is fine and should be nearly
 * invisible; occasionally it is 20% off and should be noticed. It has to read as
 * quiet confidence, not an error state.
 */

import type { Dose } from '@/engine';

export type RoundingStatus = 'ok' | 'warning';

/** Null when rounding is not worth mentioning — see `Dose.showsRounding`. */
export type RoundingSummary = { status: RoundingStatus; text: string } | null;

/** Below this the dose is exact for any practical purpose, and saying "0% off"
 *  would be pedantry rather than honesty. */
const EXACT = 0.005;

/**
 * Which of the figures on the detail screen the headline is quoting.
 *
 * The headline is one percentage over a screen showing six, and until it said
 * which one it meant, it could not be checked: a reader picked the row they
 * assumed it came from, got a different answer, and had no way to tell whether
 * the app or their arithmetic was wrong. Naming the source is half of making the
 * number verifiable — `formatPpm`'s second decimal is the other half.
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

export function roundingSummary(dose: Dose, flagAbove = 0.1): RoundingSummary {
  if (!dose.showsRounding) return null;

  if (dose.zeroed.length > 0) {
    // A mineral vanishing is a different failure from being a few percent out,
    // and it is the one the vendor calculators hide completely.
    const names = dose.zeroed.map((l) => l.component.name);
    return {
      status: 'warning',
      text:
        names.length === 1
          ? `${names[0]} would round to zero`
          : `${names.length} bottles would round to zero`,
    };
  }

  const gap = headlineGap(dose);
  if (Math.abs(gap) < EXACT) return { status: 'ok', text: 'Rounds exactly' };

  const status: RoundingStatus = Math.abs(gap) > flagAbove ? 'warning' : 'ok';
  const percent = Math.round(Math.abs(gap) * 100);
  const direction = gap < 0 ? 'under' : 'over';
  return {
    status,
    text: `${status === 'warning' ? 'Rounds hard' : 'Rounds clean'} — ${percent}% ${direction} target`,
  };
}
