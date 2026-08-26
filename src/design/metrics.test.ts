import { describe, expect, it } from 'vitest';
import {
  ALL_FAMILIES,
  CAP_HEIGHT,
  CONTENT_BOX,
  DESCENT,
  ascentPxFor,
  capBlockBoxFor,
  capBoxInsetFor,
  capBoxPaddingFor,
  capTop,
  descentPxFor,
  inkInsetsFor,
  minLineHeightRatio,
  opticalGap,
  opticalPadding,
  trackingInset,
  trackingPx,
} from './metrics';
import type { FontWeight, TextPlatform } from './metrics';
import { typeScale, typeSpecs } from './typography';
import type { TypeRole } from './typography';

/** The existing expectations were all written against iOS; bind them explicitly
 *  now that the module models both platforms. */
const inkInsets = (fs: number, lh: number, w: FontWeight, e: 'digits' | 'text' = 'text') =>
  inkInsetsFor('ios', fs, lh, w, e);
const capBoxPadding = (fs: number, lh: number, w: FontWeight, e: 'digits' | 'text') =>
  capBoxPaddingFor('ios', fs, lh, w, e);
const capBoxInset = (fs: number, lh: number, w: FontWeight, e: 'digits' | 'text') =>
  capBoxInsetFor('ios', fs, lh, w, e);

const WEIGHTS: FontWeight[] = ['400', '600', '700', '800', '900'];

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
    expect(ALL_FAMILIES).toContain(typeScale[role].fontFamily);
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

describe('opticalPadding', () => {
  it('subtracts the slack the text box already contributes', () => {
    expect(opticalPadding({ top: 18, bottom: 18 }, { top: 4, bottom: 6 })).toEqual({
      paddingTop: 14,
      paddingBottom: 12,
    });
  });

  it('clamps rather than going negative', () => {
    // A 54px numeral at the tightest legal line height already carries ~19px of
    // descent slack below its digits, which is more than the 18px the handoff
    // asks for. Zero is the right answer; a negative margin is not.
    const insets = inkInsets(54, typeScale.volume.lineHeight, '900', 'digits');
    expect(insets.bottom).toBeGreaterThan(18);
    expect(opticalPadding({ top: 18, bottom: 18 }, insets).paddingBottom).toBe(0);
  });

  it('leaves the volume card within a pixel of the designed height', () => {
    // The check that the no-hack approach actually reproduces the design: the
    // padding we can legally apply lands almost exactly on the intended gap.
    const insets = inkInsets(54, typeScale.volume.lineHeight, '900', 'digits');
    const { paddingTop, paddingBottom } = opticalPadding({ top: 18, bottom: 18 }, insets);
    const visibleGapTop = paddingTop + insets.top;
    const visibleGapBottom = paddingBottom + insets.bottom;
    expect(visibleGapTop).toBeCloseTo(18, 6);
    expect(Math.abs(visibleGapBottom - 18)).toBeLessThan(1.5);
  });
});

describe('capBoxPadding', () => {
  it('squares a box about its cap block', () => {
    const size = 40;
    const lineHeight = typeScale.doseValue.lineHeight;
    const pad = capBoxPadding(size, lineHeight, '900', 'digits');

    const below = DESCENT * size;
    const above = lineHeight - below - capTop('900', 'digits') * size;
    // With the padding applied, the space above the cap block equals the space
    // below the baseline — which is what makes plain centring optically correct.
    expect(above + pad.paddingTop).toBeCloseTo(below + pad.paddingBottom, 9);
  });

  it('only ever pads, never pulls', () => {
    // RN puts every bit of line-height slack above the baseline, so the shortfall
    // is always on top. A negative margin is never the answer.
    for (const role of ['doseValue', 'volume', 'hero', 'rowTitle', 'cardTitle'] as const) {
      const t = typeScale[role];
      const pad = capBoxPadding(t.fontSize, t.lineHeight, t.weight, t.extent);
      expect(pad.paddingTop).toBeGreaterThanOrEqual(0);
      expect(pad.paddingBottom).toBeGreaterThanOrEqual(0);
    }
  });

  it('brings a name and a numeral onto the same optical centre', () => {
    // The bug this exists to fix: baseline-aligning a 20px name against a 40px
    // numeral leaves the name reading about 7px low.
    const title = typeScale.rowTitle;
    const value = typeScale.doseValue;

    const centre = (t: (typeof typeScale)[keyof typeof typeScale]) => {
      const pad = capBoxPadding(t.fontSize, t.lineHeight, t.weight, t.extent);
      const height = t.lineHeight + pad.paddingTop + pad.paddingBottom;
      const capBlockTop =
        pad.paddingTop +
        (t.lineHeight - DESCENT * t.fontSize) -
        capTop(t.weight, t.extent) * t.fontSize;
      const capBlockBottom = pad.paddingTop + (t.lineHeight - DESCENT * t.fontSize);
      // Distance from the centre of the padded box to the centre of the cap block.
      return (capBlockTop + capBlockBottom) / 2 - height / 2;
    };

    expect(centre(title)).toBeCloseTo(0, 6);
    expect(centre(value)).toBeCloseTo(0, 6);
  });

  it('ignores descenders, which do not make a word read as lower', () => {
    expect(capTop('800', 'text')).toBe(CAP_HEIGHT);
    expect(capTop('900', 'digits')).toBeGreaterThan(CAP_HEIGHT);
  });
});

describe('opticalGap', () => {
  it('measures between the marks, not between the boxes', () => {
    expect(opticalGap(10, { bottom: 2 }, { top: 3 })).toBe(5);
  });

  it('clamps when the boxes already sit further apart than asked', () => {
    expect(opticalGap(4, { bottom: 3 }, { top: 3 })).toBe(0);
  });
});

describe('capBoxInset', () => {
  it('is the slack a squared box actually leaves, on both sides', () => {
    const t = typeScale.doseValue;
    const pad = capBoxPadding(t.fontSize, t.lineHeight, t.weight, 'digits');
    const raw = inkInsets(t.fontSize, t.lineHeight, t.weight, 'digits');
    expect(pad.paddingTop + raw.top).toBeCloseTo(
      capBoxInset(t.fontSize, t.lineHeight, t.weight, 'digits'),
      9,
    );
    expect(pad.paddingBottom + raw.bottom).toBeCloseTo(
      capBoxInset(t.fontSize, t.lineHeight, t.weight, 'digits'),
      9,
    );
  });

  it('keeps a squared row the same height as an unsquared one', () => {
    // Squaring the box moves slack around; it must not make the row grow. If this
    // fails, the row is bottom-heavy — which is exactly the bug it was written for.
    const t = typeScale.doseValue;
    const pad = capBoxPadding(t.fontSize, t.lineHeight, t.weight, 'digits');
    const boxHeight = t.lineHeight + pad.paddingTop + pad.paddingBottom;
    const inset = capBoxInset(t.fontSize, t.lineHeight, t.weight, 'digits');
    const rowPad = opticalPadding({ top: 20, bottom: 20 }, { top: inset, bottom: inset });
    expect(rowPad.paddingTop + boxHeight + rowPad.paddingBottom).toBeCloseTo(68.6, 1);
  });
});

/**
 * Measured on device with `onTextLayout`, Expo SDK 57 / RN 0.86, iPhone 16 Pro
 * (iOS 18.1) and Pixel 8 (Android 16). These are the numbers the renderers
 * actually produced; the model exists to reproduce them, not the other way round.
 */
const MEASURED: {
  label: string;
  platform: TextPlatform;
  fontSize: number;
  lineHeight: number;
  ascent: number;
  descent: number;
}[] = [
  {
    label: 'doseValue',
    platform: 'ios',
    fontSize: 40,
    lineHeight: 43,
    ascent: 28.88,
    descent: 14.12,
  },
  {
    label: 'doseValue',
    platform: 'android',
    fontSize: 40,
    lineHeight: 43,
    ascent: 34.67,
    descent: 8.38,
  },
  { label: 'volume', platform: 'ios', fontSize: 54, lineHeight: 58, ascent: 38.94, descent: 19.06 },
  {
    label: 'volume',
    platform: 'android',
    fontSize: 54,
    lineHeight: 58,
    ascent: 47.24,
    descent: 11.05,
  },
  {
    label: 'rowTitle',
    platform: 'ios',
    fontSize: 20,
    lineHeight: 24,
    ascent: 16.94,
    descent: 7.06,
  },
  {
    label: 'rowTitle',
    platform: 'android',
    fontSize: 20,
    lineHeight: 24,
    ascent: 18.67,
    descent: 5.33,
  },
];

describe('the two platforms position text differently', () => {
  it.each(MEASURED)('$label on $platform matches what the device reported', (m) => {
    // Half a pixel. The residual is display-density rounding, not model error:
    // the Pixel 8 runs at 2.625x, so one device pixel is 0.38dp and the renderer
    // snaps line boxes to it — the 54px case measured a box of 58.29 for a
    // requested 58. Sub-pixel, and invisible.
    const TOLERANCE = 0.5;
    expect(Math.abs(descentPxFor(m.platform, m.fontSize, m.lineHeight) - m.descent)).toBeLessThan(
      TOLERANCE,
    );
    expect(Math.abs(ascentPxFor(m.platform, m.fontSize, m.lineHeight) - m.ascent)).toBeLessThan(
      TOLERANCE,
    );
  });

  it('leaves iOS pinning the descent at the font’s own', () => {
    for (const fs of [13.5, 20, 40, 54]) {
      for (const lh of [fs * 1.08, fs * 1.2, fs * 1.5]) {
        expect(descentPxFor('ios', fs, lh)).toBeCloseTo(DESCENT * fs, 9);
      }
    }
  });

  it('has Android split the difference evenly about the baseline', () => {
    const fs = 40;
    const lh = 43;
    const lostBelow = DESCENT * fs - descentPxFor('android', fs, lh);
    const lostAbove = ASCENT_PX(fs) - ascentPxFor('android', fs, lh);
    expect(lostBelow).toBeCloseTo(lostAbove, 9);
  });

  it('agrees with iOS when no line height is imposed', () => {
    // At the natural box there is no slack to distribute, so the platforms
    // converge — which the device measurements confirm to within 0.05px.
    for (const fs of [20, 40, 54]) {
      const natural = CONTENT_BOX * fs;
      expect(descentPxFor('android', fs, natural)).toBeCloseTo(descentPxFor('ios', fs, natural), 9);
    }
  });
});

/** The font's ascent in px, for the even-split check above. */
const ASCENT_PX = (fontSize: number) => (CONTENT_BOX - DESCENT) * fontSize;

describe('the same layout lands on both platforms', () => {
  const t = typeScale.doseValue;

  it('gives a dose row the same height either way', () => {
    // The row is the case that went wrong: identical code rendered top-heavy on
    // Android because the model only knew iOS's rule.
    const height = (platform: TextPlatform) => {
      const pad = capBoxPaddingFor(platform, t.fontSize, t.lineHeight, t.weight, 'digits');
      const inset = capBoxInsetFor(platform, t.fontSize, t.lineHeight, t.weight, 'digits');
      const rowPad = opticalPadding({ top: 20, bottom: 20 }, { top: inset, bottom: inset });
      return (
        rowPad.paddingTop + t.lineHeight + pad.paddingTop + pad.paddingBottom + rowPad.paddingBottom
      );
    };
    expect(height('android')).toBeCloseTo(height('ios'), 6);
  });

  it('centres the marks on both, which is the point', () => {
    for (const platform of ['ios', 'android'] as const) {
      const pad = capBoxPaddingFor(platform, t.fontSize, t.lineHeight, t.weight, 'digits');
      const below = descentPxFor(platform, t.fontSize, t.lineHeight);
      const above = t.lineHeight - below - capTop(t.weight, 'digits') * t.fontSize;
      expect(above + pad.paddingTop).toBeCloseTo(below + pad.paddingBottom, 9);
    }
  });
});

describe('trackingInset', () => {
  it('gives back exactly the trailing gap RN adds after the last character', () => {
    // RN applies letterSpacing after every character; CSS applies it between them.
    // The box is therefore one whole tracking unit short of its own ink.
    expect(trackingInset(trackingPx(-0.04, 72))).toBeCloseTo(2.88, 9);
  });

  it('is zero for a role that is not tracked negatively', () => {
    // A positive-tracked box is a hair too wide, which clips nothing.
    expect(trackingInset(trackingPx(0.06, 13.5))).toBe(0);
    expect(trackingInset(0)).toBe(0);
  });

  it('covers every negatively-tracked role in the scale, not just the hero', () => {
    const tracked = (Object.keys(typeScale) as TypeRole[]).filter(
      (role) => typeScale[role].letterSpacing < 0,
    );
    // The bug was only ever *seen* at hero, where it is 2.9px of a 72px digit. It
    // was latent everywhere else the handoff tightened the tracking.
    expect(tracked.length).toBeGreaterThan(1);
    for (const role of tracked) {
      expect(typeScale[role].trackingInset).toBeCloseTo(-typeScale[role].letterSpacing, 9);
    }
  });

  it('leaves an untracked role with no inset at all', () => {
    for (const role of Object.keys(typeScale) as TypeRole[]) {
      if (typeScale[role].letterSpacing >= 0) expect(typeScale[role].trackingInset).toBe(0);
    }
  });
});

describe('capBlockBox', () => {
  const hero = typeScale.hero;

  it('reports the digit block, not the line box', () => {
    const box = capBlockBoxFor('ios', hero.fontSize, hero.lineHeight, hero.weight, hero.extent);
    expect(box.height).toBeCloseTo(capTop('900', 'digits') * 72, 9);
    // Shorter than the box RN reserves around it, which is the whole point.
    expect(box.height).toBeLessThan(hero.lineHeight);
  });

  it('is why a text background cannot be used as a selection band', () => {
    // The measured asymmetry behind the iOS bug: a background filling the line box
    // sits ~24px lower on its digits than the same background does on Android.
    const above = (platform: TextPlatform) =>
      capBlockBoxFor(platform, hero.fontSize, hero.lineHeight, hero.weight, hero.extent).top;
    const below = (platform: TextPlatform) =>
      hero.lineHeight -
      capBlockBoxFor(platform, hero.fontSize, hero.lineHeight, hero.weight, hero.extent).top -
      capBlockBoxFor(platform, hero.fontSize, hero.lineHeight, hero.weight, hero.extent).height;

    expect(above('ios')).toBeCloseTo(1.03, 1);
    expect(below('ios')).toBeCloseTo(25.42, 1);
    expect(above('android')).toBeCloseTo(11.14, 1);
    expect(below('android')).toBeCloseTo(15.31, 1);

    // iOS is off-centre by most of the font's descent; Android by a few pixels.
    expect(Math.abs(below('ios') - above('ios'))).toBeGreaterThan(20);
    expect(Math.abs(below('android') - above('android'))).toBeLessThan(5);
  });

  it('centres a padded band on the digits on both platforms', () => {
    // What the volume screen actually draws. Symmetric by construction, so the band
    // needs no per-platform correction — which is the property that was missing.
    const PAD = 7.2;
    for (const platform of ['ios', 'android'] as TextPlatform[]) {
      const box = capBlockBoxFor(
        platform,
        hero.fontSize,
        hero.lineHeight,
        hero.weight,
        hero.extent,
      );
      const band = { top: box.top - PAD, height: box.height + PAD * 2 };
      expect(box.top - band.top).toBeCloseTo(band.top + band.height - (box.top + box.height), 9);
    }
  });

  it('grows with the reader’s text size', () => {
    const at = (factor: number) =>
      capBlockBoxFor(
        'ios',
        hero.fontSize * factor,
        hero.lineHeight * factor,
        hero.weight,
        hero.extent,
      );
    expect(at(1.3).height).toBeCloseTo(at(1).height * 1.3, 9);
    expect(at(1.3).top).toBeCloseTo(at(1).top * 1.3, 9);
  });
});
