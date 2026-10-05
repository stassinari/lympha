import { describe, expect, it } from 'vitest';
import { FIGTREE, NUNITO, capBoxPaddingFor, capTop, faceFor, minLineHeightRatio } from './metrics';
import type { FontWeight, TextPlatform } from './metrics';
import { HEADER_BAND } from './layout';
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

/**
 * The header band, which is the only thing keeping the content start line the same
 * on Home as on every overlay screen.
 *
 * Home is headed by a 16pt Figtree wordmark and the overlays by a 24pt Nunito
 * title. Nothing stops those two drifting apart except the band being fixed and
 * both headers being cap-squared inside it — so this asserts the geometry rather
 * than trusting two components to keep agreeing. Both platforms, because the whole
 * reason `capBoxPadding` exists is that they disagree about where a line box sits
 * on its marks.
 */
describe('the header band', () => {
  const PLATFORMS: TextPlatform[] = ['ios', 'android'];

  /** Where the header's capitals start, measured from the top of the band. */
  const capTopInBand = (role: TypeRole, platform: TextPlatform) => {
    const { fontSize, lineHeight, weight, extent, font } = typeScale[role];
    const pad = capBoxPaddingFor(platform, fontSize, lineHeight, weight, extent, font);
    const box = lineHeight + pad.paddingTop + pad.paddingBottom;
    const cap = capTop(weight, extent, font) * fontSize;
    // The box is symmetric about its caps once squared, so centring it in the band
    // is (band - box) / 2 of band slack plus (box - cap) / 2 of the box's own.
    return (HEADER_BAND - box) / 2 + (box - cap) / 2;
  };

  it('holds both headers, so a fixed height never shears one', () => {
    for (const role of ['wordmark', 'screenTitle'] as const) {
      for (const platform of PLATFORMS) {
        const { fontSize, lineHeight, weight, extent, font } = typeScale[role];
        const pad = capBoxPaddingFor(platform, fontSize, lineHeight, weight, extent, font);
        expect(lineHeight + pad.paddingTop + pad.paddingBottom).toBeLessThan(HEADER_BAND);
      }
    }
  });

  it('puts each header at the same height on both platforms', () => {
    for (const role of ['wordmark', 'screenTitle'] as const) {
      expect(capTopInBand(role, 'ios')).toBeCloseTo(capTopInBand(role, 'android'), 6);
    }
  });

  it('gives the wordmark the air above its caps that stops it reading as a label', () => {
    // Not the line box: Figtree leaves slack above its caps, so measuring to the
    // box would put the visible mark lower than intended. Cap-block centring is
    // symmetric about the baseline, so this is also the air below it — which is
    // the half that was too tight at the old 56pt band.
    expect(capTopInBand('wordmark', 'ios')).toBeCloseTo(26.4, 1);
  });

  /**
   * Headroom beyond the wordmark. A `(Ly)` brand mark was tried beside it and
   * dropped — the header is the wordmark alone — so nothing here draws one. This
   * only records that the band still has room for a glyph that size, so anything
   * added beside the wordmark stays additive to `AppHeader` and reaches neither
   * `HEADER_BAND` nor the content start line.
   */
  it('has room for a ~24pt brand mark beside the wordmark', () => {
    expect(HEADER_BAND - 24).toBeGreaterThanOrEqual(2 * 16);
  });

  /**
   * The whole point of the band. The two headers are 8pt of font size apart, and
   * before the band that difference landed on the content: the recipe card on
   * Home and the `APPEARANCE` label on Settings sat about 13pt apart and the page
   * jumped as you navigated.
   *
   * What survives is half the difference in their cap heights, which moves the
   * headers' own ink and nothing below them. It stays small enough that the two
   * bars read as one strip.
   */
  it('absorbs the difference in header size, so content starts at one y', () => {
    const gap = capTopInBand('wordmark', 'ios') - capTopInBand('screenTitle', 'ios');
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(4);
  });
});
