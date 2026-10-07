import { describe, expect, it } from 'vitest';
import {
  formatDoseAmount,
  formatGapPercent,
  formatIdealAmount,
  formatPpm,
  formatUnit,
} from './units';

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
    expect(formatPpm(88.393)).toBe('88.39');
    expect(formatPpm(72.3)).toBe('72.3');
    expect(formatPpm(0)).toBe('0');
  });

  /**
   * The reason for the second decimal: at one, the printed figures give 6.5%
   * against a headline of 7%, and the arithmetic the screen invites you to do
   * disagrees with the screen.
   */
  it('prints enough precision to reproduce the headline', () => {
    const target = 20.1;
    const delivered = (8 * (1 / ((1000 / 4500) * 0.56) / 2)) / 1.5;
    const printed = Number(formatPpm(delivered));
    expect(Math.round(((printed - target) / target) * 100)).toBe(
      Math.round(((delivered - target) / target) * 100),
    );
  });
});

describe('formatGapPercent', () => {
  it('signs the direction and rounds to whole percent', () => {
    expect(formatGapPercent(0.0661)).toBe('+7%');
    expect(formatGapPercent(0.10685)).toBe('+11%');
    expect(formatGapPercent(-0.0373)).toBe('\u22124%');
  });

  it('uses a real minus sign, not a hyphen', () => {
    expect(formatGapPercent(-0.0373)).not.toContain('-');
  });

  it('drops the sign where there is nothing to sign', () => {
    expect(formatGapPercent(0.00134)).toBe('0%');
    expect(formatGapPercent(-0.00446)).toBe('0%');
    expect(formatGapPercent(0)).toBe('0%');
  });
});
