import { describe, expect, it } from 'vitest';
import { decimalsForStep, quantise, quantiseToStep, toDispenserUnits } from './quantise';
import type { Dispenser } from '@/data/types';

const dropper: Dispenser = {
  id: 'dropper',
  label: 'Dropper',
  unit: 'drop',
  step: 1,
  allowPartial: false,
  equivalentInDoseUnit: 1,
};

const scale: Dispenser = {
  id: 'scale',
  label: 'Scale',
  unit: 'g',
  step: 0.01,
  allowPartial: true,
  equivalentInDoseUnit: 1,
};

/** Apax: doses are grams, but a dropper delivers 1/15 g at a time. */
const gramDropper: Dispenser = { ...dropper, equivalentInDoseUnit: 1 / 15 };

describe('decimalsForStep', () => {
  it.each([
    [1, 0],
    [0.5, 1],
    [0.01, 2],
    [0.001, 3],
  ])('%s → %s places', (step, expected) => {
    expect(decimalsForStep(step)).toBe(expected);
  });

  it('rejects a step that cannot quantise anything', () => {
    expect(() => decimalsForStep(0)).toThrow(RangeError);
    expect(() => decimalsForStep(-1)).toThrow(RangeError);
  });
});

describe('quantiseToStep', () => {
  it('rounds half-up, matching the vendors’ own conversion tables', () => {
    expect(quantiseToStep(7.5, 1)).toBe(8);
    expect(quantiseToStep(37.5, 1)).toBe(38);
    expect(quantiseToStep(6.22, 1)).toBe(6);
  });

  it('does not leak binary floating point into a displayed number', () => {
    // Math.round(2.7 / 0.01) * 0.01 is 2.7000000000000002. Displayed in an app
    // whose selling point is reporting error, that is worse than useless.
    expect(quantiseToStep(2.7, 0.01)).toBe(2.7);
    expect(quantiseToStep(0.30000000000000004, 0.01)).toBe(0.3);
  });

  it('rounds a half-way value by what the double actually is', () => {
    // 0.125 is exactly representable, so it rounds up as you would expect.
    expect(quantiseToStep(0.125, 0.01)).toBe(0.13);
    // 1.005 is not: the nearest double is 1.00499999999999989, so it rounds down.
    // JavaScript's own toFixed agrees, and the difference between 1.00 g and
    // 1.01 g is far below anything that matters in a jug. Documented, not fixed —
    // nudging by an epsilon to force "half-up" would misround honest values.
    expect(quantiseToStep(1.005, 0.01)).toBe(1.0);
    expect((1.005).toFixed(2)).toBe('1.00');

    // Whole-unit steps are unaffected: the halves that occur in practice are all
    // exactly representable, so Apax's stated half-up rule holds where it is used.
    expect(quantiseToStep(7.5, 1)).toBe(8);
    expect(quantiseToStep(37.5, 1)).toBe(38);
    expect(quantiseToStep(0.5, 1)).toBe(1);
  });
});

describe('quantise', () => {
  it('keeps the ideal and the achievable side by side', () => {
    const q = quantise(6.22, dropper);
    expect(q.exact).toBe(6.22);
    expect(q.delivered).toBe(6);
    expect(q.error).toBeCloseTo(-0.22, 10);
    expect(q.relativeError).toBeCloseTo(0.0354, 4);
  });

  it('signs the error so the UI can say short or over', () => {
    expect(quantise(6.6, dropper).error).toBeGreaterThan(0);
    expect(quantise(6.2, dropper).error).toBeLessThan(0);
  });

  it('flags a bottle that rounds away, but not one never asked for', () => {
    expect(quantise(0.4, dropper).zeroed).toBe(true);
    expect(quantise(0, dropper).zeroed).toBe(false);
    expect(quantise(0, dropper).relativeError).toBe(0);
  });

  it('converts through the dispenser rather than assuming the units match', () => {
    // 2 g of Apax concentrate is 30 drops. Getting this backwards would be wrong
    // by a factor of 225.
    expect(toDispenserUnits(2, gramDropper)).toBe(30);
    expect(quantise(2, gramDropper).delivered).toBe(30);
    expect(quantise(2, scale).delivered).toBe(2);
  });
});
