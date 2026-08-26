import { describe, expect, it } from 'vitest';
import { FIGTREE, NUNITO, faceFor, minLineHeightRatio } from './metrics';
import type { FontWeight } from './metrics';
import { styleForRole, typeScale, typeSpecs } from './typography';
import type { TypeRole } from './typography';

const roles = Object.keys(typeSpecs) as TypeRole[];
const WEIGHTS: FontWeight[] = ['400', '600', '700', '800', '900'];

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

/**
 * Roles in chrome that cannot scroll, which is a different reason to cap from
 * `GEOMETRIC`'s. The dose screen's header sits outside its scroll view, so a mark
 * that grows without limit grows the one strip of that screen the reader cannot
 * scroll away from, and pushes the doses off it. Legitimate only because the mark
 * is decoration and is hidden from screen readers — capping something that has to
 * be *read* would not be.
 */
const CHROME: TypeRole[] = ['wordmark'];

const CAPPED = [...GEOMETRIC, ...CHROME];

describe('dynamic type', () => {
  /**
   * One test, not two. Exact set equality already implies that everything outside
   * the list is uncapped, so asserting it separately bought no coverage and made a
   * single policy change fail twice. The per-role loop is kept only because it names
   * the offending role in the failure message.
   */
  it('caps exactly the roles whose size is a layout decision', () => {
    const capped = roles.filter((role) => typeScale[role].maxScale !== undefined);
    expect(capped.sort()).toEqual([...CAPPED].sort());
    for (const role of roles.filter((r) => !CAPPED.includes(r))) {
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
      const { fontSize, lineHeight, weight, extent, font } = typeScale[role];
      const ratio = (lineHeight * factor) / (fontSize * factor);
      // Against the role's *own* font. Checked against Nunito's floor the wordmark
      // would pass while being measured against a font it is not set in.
      expect(ratio, role).toBeGreaterThanOrEqual(minLineHeightRatio(weight, extent, font));
    }
  });
});

describe('styleForRole', () => {
  it('passes no metric metadata to the renderer', () => {
    for (const role of roles) {
      const style = styleForRole(role) as Record<string, unknown>;
      expect(Object.keys(style), role).not.toContain('font');
      expect(Object.keys(style), role).not.toContain('weight');
      expect(Object.keys(style), role).not.toContain('extent');
      expect(Object.keys(style), role).not.toContain('maxScale');
      expect(Object.keys(style), role).not.toContain('trackingInset');
    }
  });
});

describe('the second family', () => {
  const wordmark = typeScale.wordmark;

  it('is used by exactly one role', () => {
    const foreign = roles.filter((role) => typeScale[role].font !== NUNITO);
    // If this grows, the header has stopped being the only place a second family
    // earns its keep, and that is a design decision rather than a drive-by.
    expect(foreign).toEqual(['wordmark']);
    expect(wordmark.font).toBe(FIGTREE);
  });

  /**
   * Derived from the role rather than hardcoded, so changing the mark's weight is a
   * one-line design change and not a test edit. What is being asserted is the
   * invariant with teeth — the family name a role resolves to is a face the app has
   * actually loaded — not which weight the wordmark happens to be set in today.
   */
  it('resolves every role to a face its own font has loaded', () => {
    for (const role of roles) {
      const { font, weight, fontFamily } = typeScale[role];
      expect(fontFamily, role).toBe(faceFor(font, weight).family);
      expect(fontFamily, role).toContain(font.name);
    }
  });

  it('refuses a weight it has not loaded', () => {
    // Android fakes a missing bold by synthesising one, so a silent fallback would
    // render type the app does not have, laid out against another weight's metrics.
    for (const weight of WEIGHTS) {
      if (FIGTREE.faces[weight]) expect(() => faceFor(FIGTREE, weight)).not.toThrow();
      else expect(() => faceFor(FIGTREE, weight)).toThrow(/no .* face loaded/);
    }
    expect(Object.keys(FIGTREE.faces).length).toBeLessThan(WEIGHTS.length);
  });
});

/**
 * Font data, asserted against literals on purpose.
 *
 * These are transcribed from the TTFs by `scripts/font-metrics.mjs`, so a literal is
 * the point: it catches a bad transcription. Fixed weights rather than the wordmark's
 * current one, so this says something about the fonts and nothing about the design —
 * changing the mark's weight or size cannot reach it.
 */
describe('the two fonts’ line-height floors', () => {
  it('are far enough apart that borrowing one for the other would be wrong', () => {
    expect(minLineHeightRatio('600', 'text', FIGTREE)).toBeCloseTo(0.977, 3);
    expect(minLineHeightRatio('600', 'text', NUNITO)).toBeCloseTo(1.067, 3);

    // 0.09em at the same weight. Nunito's floor would reject legal Figtree line
    // heights; Figtree's would wave through Nunito ones that shear.
    const gap =
      minLineHeightRatio('600', 'text', NUNITO) - minLineHeightRatio('600', 'text', FIGTREE);
    expect(gap).toBeGreaterThan(0.05);
  });

  it('come from content boxes that differ by more than the fonts look like they do', () => {
    expect(NUNITO.contentBox - FIGTREE.contentBox).toBeCloseTo(0.164, 3);
    // The coincidence worth knowing about: near-identical cap heights, so the two
    // read at a similar size at the same fontSize despite all the above.
    expect(Math.abs(NUNITO.capHeight - FIGTREE.capHeight)).toBeLessThan(0.01);
  });
});
