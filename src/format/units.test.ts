import { describe, expect, it } from 'vitest';
import { formatDoseAmount, formatUnit } from './units';

describe('formatUnit', () => {
  it('pluralises the units you count', () => {
    expect(formatUnit('drop', 1)).toBe('drop');
    expect(formatUnit('drop', 4)).toBe('drops');
    expect(formatUnit('drop', 0)).toBe('drops');
    expect(formatUnit('sachet', 2)).toBe('sachets');
  });

  it('leaves measured units alone', () => {
    // "2 gs" would be nonsense.
    expect(formatUnit('g', 2)).toBe('g');
    expect(formatUnit('ml', 500)).toBe('ml');
  });
});

describe('formatDoseAmount', () => {
  it('prints whole drops as integers', () => {
    expect(formatDoseAmount(4, 1)).toBe('4');
    expect(formatDoseAmount(0, 1)).toBe('0');
  });

  it('drops trailing zeros a scale would otherwise show', () => {
    expect(formatDoseAmount(2, 0.01)).toBe('2');
    expect(formatDoseAmount(0.5, 0.01)).toBe('0.5');
    expect(formatDoseAmount(0.27, 0.01)).toBe('0.27');
  });

  it('does not leak floating-point dust into a displayed value', () => {
    expect(formatDoseAmount(2.7000000000000002, 0.01)).toBe('2.7');
  });
});
