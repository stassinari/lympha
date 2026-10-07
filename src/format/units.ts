/**
 * Turning engine numbers into the words on the row.
 *
 * Presentation only — the engine deals in amounts and dispensers and has no
 * opinion about how they read at 6am.
 */

import { decimalsForStep } from '@/engine/quantise';
import type { DoseUnit } from '@/data/types';

/** Units you count, and so pluralise. Grams and millilitres are measured, not
 *  counted, and "2 gs" would be nonsense. */
const COUNTABLE: ReadonlySet<DoseUnit> = new Set<DoseUnit>(['drop', 'sachet']);

export function formatUnit(unit: DoseUnit, count: number): string {
  if (!COUNTABLE.has(unit)) return unit;
  return count === 1 ? unit : `${unit}s`;
}

/**
 * A dose, at the dispenser's resolution, without trailing zeros.
 *
 * A scale reads to 0.01 g, but "2.00 g" is three characters of noise on a row
 * meant to be read in one glance, so a value that lands on a whole number prints
 * as one.
 */
export function formatDoseAmount(value: number, step: number): string {
  const decimals = decimalsForStep(step);
  if (decimals === 0) return String(value);
  return String(Number(value.toFixed(decimals)));
}

/**
 * What the recipe asks for, before the dispenser has its say.
 *
 * Always two decimals. This number exists to be compared against the delivered
 * one, and rounding the ideal would hide exactly the difference the screen is
 * there to show.
 */
export const formatIdealAmount = (value: number): string => value.toFixed(2);

/**
 * A concentration in ppm, to two decimals, trailing zeros trimmed.
 *
 * Two rather than one, because this column is meant to be checked. At Rao's and
 * 1500 ml the delivered alkalinity is 21.4286 against a target of 20.1 — a gap of
 * 6.6%, which the headline reports as 7%. Printed to one decimal the same sum
 * gives 6.5%, and a reader doing the arithmetic gets a different answer from the
 * app. The second decimal makes the headline reproducible.
 */
export function formatPpm(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * A relative error, as a whole signed percentage.
 *
 * Whole, deliberately: this exists so the headline can be checked, and the
 * headline is a whole number. A decimal here would disagree with it.
 *
 * The minus is U+2212, not a hyphen. Nunito draws the minus, the plus and every
 * digit 600/1000 em wide, and the hyphen narrower, so only the minus keeps a
 * right-aligned column of signed figures in step.
 */
export function formatGapPercent(fraction: number): string {
  const percent = Math.round(fraction * 100);
  if (percent === 0) return '0%';
  return `${percent > 0 ? '+' : '\u2212'}${Math.abs(percent)}%`;
}
