import { describe, expect, it } from 'vitest';
import { formatDoseAmount, formatIdealAmount, formatPpm, formatUnit } from './units';

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

describe('formatIdealAmount', () => {
  it('keeps the precision the comparison depends on', () => {
    // 3.73 against 4 is the whole point; "4 against 4" would say nothing.
    expect(formatIdealAmount(3.7313)).toBe('3.73');
    expect(formatIdealAmount(4)).toBe('4.00');
  });
});

describe('formatPpm', () => {
  it('spends a decimal only where there is one to spend', () => {
    expect(formatPpm(90)).toBe('90');
    expect(formatPpm(88.393)).toBe('88.4');
    expect(formatPpm(72.3)).toBe('72.3');
    expect(formatPpm(0)).toBe('0');
  });
});
