/**
 * Strength, in whole percent of the recipe as published.
 *
 * Apax Lab's calculator offers 25, 50, 75 and 100% (`docs/apax-lab-brief.md`).
 * Any whole percent in that span is allowed: strength is a plain multiplier,
 * not vendor data, so 73% invents no Apax number. The steps stay the easy path —
 * a drag sticks to them — and the exact value is typed.
 */

export const STRENGTH_MIN = 25;
export const STRENGTH_MAX = 100;
export const STRENGTH_STEPS = [25, 50, 75, 100] as const;
/** How close a drag has to come to a step to land on it, in percent. */
export const STRENGTH_SNAP = 2;

const clamp = (pct: number) => Math.min(STRENGTH_MAX, Math.max(STRENGTH_MIN, Math.round(pct)));

export const isStrengthStep = (pct: number): boolean =>
  (STRENGTH_STEPS as readonly number[]).includes(pct);

/** A dragged value: whole, in range, and stuck to a step it is near. */
export function snapStrength(raw: number): number {
  const pct = clamp(raw);
  return STRENGTH_STEPS.find((step) => Math.abs(step - pct) <= STRENGTH_SNAP) ?? pct;
}

/** A typed value, clamped into range. Null for anything that is not a number. */
export function parseStrength(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  return digits ? clamp(Number(digits)) : null;
}

/** The next step up or down from `pct`, for increment and decrement. */
export function nextStrengthStep(pct: number, direction: 1 | -1): number {
  const steps = direction === 1 ? STRENGTH_STEPS : [...STRENGTH_STEPS].reverse();
  return steps.find((step) => (direction === 1 ? step > pct : step < pct)) ?? clamp(pct);
}
