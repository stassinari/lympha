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
