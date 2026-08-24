import { describe, expect, it } from 'vitest';
import { minLineHeightRatio } from './metrics';
import { styleForRole, typeScale, typeSpecs } from './typography';
import type { TypeRole } from './typography';

const roles = Object.keys(typeSpecs) as TypeRole[];

/**
 * Roles whose size is a layout decision. Each is either a display numeral sized
 * to fit a specific composition, or a small label locked to one of them on a
 * shared baseline.
 */
const GEOMETRIC: TypeRole[] = [
  'hero',
  'volume',
  'doseValue',
  'cardLabel',
  'unitLabel',
  'volumeUnit',
];

describe('dynamic type', () => {
  it('caps exactly the roles whose size is a layout decision', () => {
    const capped = roles.filter((role) => typeScale[role].maxScale !== undefined);
    expect(capped.sort()).toEqual([...GEOMETRIC].sort());
  });

  it('leaves prose free to scale', () => {
    for (const role of roles.filter((r) => !GEOMETRIC.includes(r))) {
      expect(typeScale[role].maxScale, role).toBeUndefined();
    }
  });

  /**
   * The pairs that sit on one baseline have to move together or not at all: a
   * capped numeral beside an uncapped unit is not a larger version of the design.
   */
  it.each([
    ['doseValue', 'unitLabel'],
    ['volume', 'volumeUnit'],
    ['volume', 'cardLabel'],
    ['hero', 'volumeUnit'],
  ] as [TypeRole, TypeRole][])('%s and %s share a ceiling', (a, b) => {
    expect(typeScale[a].maxScale).toBe(typeScale[b].maxScale);
  });

  /**
   * The reason dynamic type is safe here at all. React Native multiplies
   * `fontSize` and `lineHeight` by the same factor, so the ratio the whole type
   * system is built on survives — which is what keeps a scaled-up glyph from
   * being sheared by a line box that did not grow with it.
   */
  it.each([1, 1.15, 1.3, 2, 3.1])('stays above the clipping floor at %sx', (factor) => {
    for (const role of roles) {
      const { fontSize, lineHeight, weight, extent } = typeScale[role];
      const ratio = (lineHeight * factor) / (fontSize * factor);
      expect(ratio, role).toBeGreaterThanOrEqual(minLineHeightRatio(weight, extent));
    }
  });
});

describe('styleForRole', () => {
  it('passes no metric metadata to the renderer', () => {
    for (const role of roles) {
      const style = styleForRole(role) as Record<string, unknown>;
      expect(Object.keys(style), role).not.toContain('weight');
      expect(Object.keys(style), role).not.toContain('extent');
      expect(Object.keys(style), role).not.toContain('maxScale');
    }
  });
});
