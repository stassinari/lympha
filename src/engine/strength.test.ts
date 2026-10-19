import { describe, expect, it } from 'vitest';
import { isStrengthStep, nextStrengthStep, parseStrength, snapStrength } from './strength';

describe('snapStrength', () => {
  it('sticks to a step within two percent', () => {
    expect(snapStrength(48)).toBe(50);
    expect(snapStrength(77)).toBe(75);
    expect(snapStrength(98)).toBe(100);
  });

  it('keeps any whole percent between the steps', () => {
    expect(snapStrength(47)).toBe(47);
    expect(snapStrength(72.4)).toBe(72);
  });

  it('holds to 25–100', () => {
    expect(snapStrength(101)).toBe(100);
    expect(snapStrength(10)).toBe(25);
  });
});

describe('parseStrength', () => {
  it('ignores input that is not a number', () => {
    expect(parseStrength('')).toBeNull();
    expect(parseStrength('abc')).toBeNull();
  });

  it('clamps rather than rejects a number out of range', () => {
    expect(parseStrength('250')).toBe(100);
    expect(parseStrength('0')).toBe(25);
  });

  it('takes a typed value as it is, without snapping', () => {
    expect(parseStrength('39')).toBe(39);
    expect(parseStrength('49')).toBe(49);
  });
});

describe('steps', () => {
  it('are Apax Lab’s quarters', () => {
    expect([25, 50, 75, 100].every(isStrengthStep)).toBe(true);
    expect(isStrengthStep(73)).toBe(false);
  });

  it('are where increment and decrement land', () => {
    expect(nextStrengthStep(73, 1)).toBe(75);
    expect(nextStrengthStep(75, 1)).toBe(100);
    expect(nextStrengthStep(100, 1)).toBe(100);
    expect(nextStrengthStep(73, -1)).toBe(50);
    expect(nextStrengthStep(25, -1)).toBe(25);
  });
});
