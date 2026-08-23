/**
 * Turning an unrounded amount into something you can actually deliver.
 *
 * This is where the app earns its keep. Drops are whole numbers and doses are
 * not, so the achievable dose is almost never the recipe. Every vendor
 * calculator rounds silently and then reports the ideal figure anyway; here the
 * ideal and the achievable are both kept, and the gap between them is a value
 * the UI can show.
 */

import type { Component, Dispenser } from '@/data/types';

/** Decimal places implied by a dispenser step, so 0.01 g reads as "2.70". */
export function decimalsForStep(step: number): number {
  if (!Number.isFinite(step) || step <= 0) throw new RangeError(`Bad step ${step}`);
  const text = step.toString();
  if (text.includes('e-')) return Number(text.split('e-')[1]);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/**
 * Round to the nearest multiple of `step`, half-up.
 *
 * The `toFixed` pass is not cosmetic: `Math.round(2.7 / 0.01) * 0.01` is
 * 2.7000000000000002, and that would surface as a rounding "error" of 1e-16 in
 * a display whose entire purpose is reporting error honestly.
 */
export function quantiseToStep(value: number, step: number): number {
  const steps = Math.round(value / step);
  return Number((steps * step).toFixed(decimalsForStep(step)));
}

/** Convert an amount in the component's dose unit into the dispenser's unit. */
export function toDispenserUnits(amountInDoseUnits: number, dispenser: Dispenser): number {
  return amountInDoseUnits / dispenser.equivalentInDoseUnit;
}

/** And back, for working out what a quantised reading actually delivers. */
export function toDoseUnits(amountInDispenserUnits: number, dispenser: Dispenser): number {
  return amountInDispenserUnits * dispenser.equivalentInDoseUnit;
}

export type Quantised = {
  /** What the recipe asks for, in the dispenser's unit. Never rounded. */
  exact: number;
  /** What the dispenser can actually deliver. */
  delivered: number;
  /** Signed, in dispenser units. Negative means short. */
  error: number;
  /** Unsigned, as a fraction of the ideal. Zero when nothing was asked for. */
  relativeError: number;
  /**
   * The recipe calls for some of this component and the dispenser delivers
   * none. A mineral silently vanishing is a different failure from being a few
   * percent out, and the UI treats it differently.
   */
  zeroed: boolean;
};

export function quantise(amountInDoseUnits: number, dispenser: Dispenser): Quantised {
  const exact = toDispenserUnits(amountInDoseUnits, dispenser);
  const delivered = quantiseToStep(exact, dispenser.step);
  const error = delivered - exact;
  return {
    exact,
    delivered,
    error,
    relativeError: exact > 0 ? Math.abs(error) / exact : 0,
    zeroed: delivered === 0 && exact > 0,
  };
}

/** The dispenser a component uses unless the caller names another. */
export function defaultDispenserFor(component: Component): Dispenser {
  const chosen = component.dispensers.find((d) => d.isDefault) ?? component.dispensers[0];
  if (!chosen) throw new Error(`Component "${component.id}" has no dispenser`);
  return chosen;
}
