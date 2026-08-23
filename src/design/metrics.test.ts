import { describe, expect, it } from 'vitest';
import {
  CONTENT_BOX,
  DESCENT,
  FONT_FAMILY,
  inkInsets,
  minLineHeightRatio,
  trackingPx,
} from './metrics';
import type { NunitoWeight } from './metrics';
import { typeScale, typeSpecs } from './typography';
import type { TypeRole } from './typography';

const WEIGHTS: NunitoWeight[] = ['400', '600', '700', '800', '900'];

describe('Nunito metrics', () => {
  it('has the content box the TTFs report', () => {
    // ascender 1011 + |descender| 353, over unitsPerEm 1000.
    expect(CONTENT_BOX).toBeCloseTo(1.364, 5);
  });

  it('reproduces the per-weight line-height floors from scripts/font-metrics.mjs', () => {
    // Prose: heavier weights have taller ink, so the floor rises with weight.
    expect(minLineHeightRatio('400', 'text')).toBeCloseTo(1.067, 3);
    expect(minLineHeightRatio('700', 'text')).toBeCloseTo(1.074, 3);
    expect(minLineHeightRatio('900', 'text')).toBeCloseTo(1.096, 3);

    // Digits are nearly weight-invariant and tolerate a tighter line than prose.
    for (const weight of WEIGHTS) {
      expect(minLineHeightRatio(weight, 'digits')).toBeCloseTo(1.068, 2);
    }
  });

  it('never rates digits as needing more room than prose', () => {
    for (const weight of WEIGHTS) {
      expect(minLineHeightRatio(weight, 'digits')).toBeLessThanOrEqual(
        minLineHeightRatio(weight, 'text'),
      );
    }
  });
});

describe('inkInsets', () => {
  it('accounts for the whole line box', () => {
    // top inset + visible ink + bottom inset must equal the line height exactly,
    // or padding computed from these values would drift.
    const fontSize = 54;
    const lineHeight = 58;
    const { top, bottom } = inkInsets(fontSize, lineHeight, '900', 'digits');
    const inkHeight = lineHeight - top - bottom;
    expect(top + inkHeight + bottom).toBeCloseTo(lineHeight, 6);
  });

  it('puts nearly all the slack below the ink, not above it', () => {
    // This asymmetry is the point of the module: RN clamps the ascent, so the
    // descent below the baseline is fixed and every bit of extra line height
    // lands above. Padding a display numeral symmetrically looks top-heavy.
    const { top, bottom } = inkInsets(54, 58, '900', 'digits');
    expect(bottom).toBeGreaterThan(top * 5);
    expect(bottom).toBeCloseTo(DESCENT * 54, 5);
  });

  it('grows the top inset one-for-one with line height', () => {
    const a = inkInsets(54, 58, '900', 'digits');
    const b = inkInsets(54, 68, '900', 'digits');
    expect(b.top - a.top).toBeCloseTo(10, 6);
    expect(b.bottom).toBeCloseTo(a.bottom, 6);
  });

  it('reports a shorter drop under digits than under prose, which has descenders', () => {
    const digits = inkInsets(40, 44, '900', 'digits');
    const text = inkInsets(40, 44, '900', 'text');
    expect(digits.bottom).toBeGreaterThan(text.bottom);
  });
});

describe('the type scale', () => {
  const roles = Object.keys(typeScale) as TypeRole[];

  it.each(roles)('%s clears the line-height floor for its weight', (role) => {
    const resolved = typeScale[role];
    const floor = minLineHeightRatio(resolved.weight, resolved.extent) * resolved.fontSize;
    expect(resolved.lineHeight).toBeGreaterThanOrEqual(floor);
  });

  it.each(roles)('%s disables Android font padding for cross-platform parity', (role) => {
    expect(typeScale[role].includeFontPadding).toBe(false);
  });

  it.each(roles)('%s names a font family that is actually loaded', (role) => {
    expect(Object.values(FONT_FAMILY)).toContain(typeScale[role].fontFamily);
  });

  it('converts the handoff’s em tracking into absolute px', () => {
    // The handoff gives the volume value as -0.035em at 54px.
    expect(typeScale.volume.letterSpacing).toBeCloseTo(trackingPx(-0.035, 54), 6);
    expect(typeScale.volume.letterSpacing).toBeCloseTo(-1.89, 2);
  });

  it('rejects a spec below the floor at construction time', () => {
    // The handoff's `line-height: 0.88` is the case this guards against.
    const spec = typeSpecs.volume;
    expect(0.88).toBeLessThan(minLineHeightRatio(spec.weight, spec.extent));
  });
});
