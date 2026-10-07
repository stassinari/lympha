/**
 * Font vertical metrics, and the line-height rules they impose.
 *
 * All values are em (both fonts' unitsPerEm is 1000). They are transcribed from
 * `scripts/font-metrics.mjs`, which reads them out of the shipped TTFs — run
 * `npm run font-metrics [family]` to reproduce. They are checked in rather than
 * computed at build time so nothing at runtime depends on parsing a font file.
 *
 * Every function here takes the font as a trailing argument, defaulting to Nunito
 * because that is what all but one role is set in. Nothing about these numbers
 * transfers between families — see `FontMetrics`.
 *
 * ---
 *
 * Why this file exists
 *
 * React Native clips glyphs to the text's lineHeight box; CSS lets them
 * overflow. On top of that, RN sets TextKit's `maximumLineHeight`, which clamps
 * the *ascent* — so the space below the baseline is pinned at the font's descent
 * and every bit of lineHeight slack lands above the baseline instead.
 *
 * Two consequences drive the whole type system:
 *
 *   1. There is a hard floor below which capitals and digits shear off. It is
 *      `descent + tallest ink`, and it differs per weight.
 *   2. A text box is never vertically centred on its ink. Layout that wants
 *      optical spacing has to subtract the known insets — see `inkInsets`.
 *
 * This is why the design handoff's `line-height: 0.88` cannot be ported. That
 * number is a CSS idiom for removing leading; here it would just decapitate the
 * numerals. We reproduce the *look* by choosing a legal line height and taking
 * the difference out of the container's padding.
 */

export type FontWeight = '400' | '600' | '700' | '800' | '900';

/**
 * The two platforms position a line of text differently inside an explicit
 * `lineHeight`, and no amount of `includeFontPadding: false` reconciles them.
 * Measured on device (Nunito Black 40px, lineHeight 43):
 *
 *   iOS      ascent 28.88   descent 14.12
 *   Android  ascent 34.67   descent  8.38
 *
 * iOS pins the descent at the font's own and takes the entire difference off the
 * ascent. Android splits the difference evenly between the two — 5.71 above and
 * 5.72 below. Everything else in this module derives from that.
 */
export type TextPlatform = 'ios' | 'android';

/** One loaded face: its names and its own ink extents. */
export type FontFace = {
  /** The alias React Native's `fontFamily` resolves, as registered by `expo-font`. */
  family: string;
  /**
   * The name CoreText registers the face under, read from the TTF's `name` table.
   * Native text outside React Native, such as SwiftUI's `Font.custom`, finds the
   * face by this name and knows nothing of the alias.
   */
  postScriptName: string;
  /** Tallest ink above the baseline. Heavier weights are taller: the outlines grow
   *  outward, so the safe line height grows with the weight. */
  inkTop: number;
  /** Tallest ink above the baseline for digits only. Lower than `inkTop`, so
   *  numerals tolerate a tighter line than prose. */
  digitTop: number;
  /** Lowest ink below the baseline (negative). Descenders never reach the full font
   *  descent, which is why there is slack under a line of text. */
  inkBottom: number;
};

/**
 * Everything about a family that layout has to know, in em.
 *
 * There is one of these per family in the app, because **none of it transfers**.
 * Two fonts at the same nominal size have different ascenders, descenders and cap
 * heights, so a line height that is safe in one shears glyphs in the other and a
 * box squared about one font's cap block is not squared about the other's. Nunito
 * and Figtree differ by more than they look: a 1.200em content box against
 * 1.364em, and 0.250em of descent against 0.353em.
 *
 * All values come from `scripts/font-metrics.mjs`, which reads them out of the
 * shipped TTFs — run `npm run font-metrics [family]` to reproduce. They are checked
 * in rather than computed at build time so nothing at runtime depends on parsing a
 * font file.
 */
export type FontMetrics = {
  name: string;
  ascent: number;
  descent: number;
  /** The box at `lineHeight: normal` — ascender + descender + lineGap. */
  contentBox: number;
  capHeight: number;
  xHeight: number;
  /** Only the weights the app actually loads. Asking for another throws. */
  faces: Partial<Record<FontWeight, FontFace>>;
};

const NUNITO_FACES = {
  '400': {
    family: 'Nunito_400Regular',
    postScriptName: 'Nunito-Regular',
    inkTop: 0.714,
    digitTop: 0.714,
    inkBottom: -0.195,
  },
  '600': {
    family: 'Nunito_600SemiBold',
    postScriptName: 'Nunito-SemiBold',
    inkTop: 0.714,
    digitTop: 0.714,
    inkBottom: -0.198,
  },
  '700': {
    family: 'Nunito_700Bold',
    postScriptName: 'Nunito-Bold',
    inkTop: 0.721,
    digitTop: 0.715,
    inkBottom: -0.203,
  },
  '800': {
    family: 'Nunito_800ExtraBold',
    postScriptName: 'Nunito-ExtraBold',
    inkTop: 0.732,
    digitTop: 0.716,
    inkBottom: -0.207,
  },
  '900': {
    family: 'Nunito_900Black',
    postScriptName: 'Nunito-Black',
    inkTop: 0.743,
    digitTop: 0.716,
    inkBottom: -0.212,
  },
} satisfies Record<FontWeight, FontFace>;

/** The app's text face, for every role but the wordmark. */
export const NUNITO: FontMetrics = {
  name: 'Nunito',
  ascent: 1.011,
  descent: 0.353,
  contentBox: 1.364,
  capHeight: 0.705,
  xHeight: 0.484,
  faces: NUNITO_FACES,
};

/**
 * The wordmark face, and nothing else — see the `wordmark` role.
 *
 * One weight, because the wordmark is one word at one size and the app has no other
 * use for the family. Anything else asked of it throws rather than falling back:
 * `faceFor` exists to make that loud.
 *
 * Note how little it has in common with Nunito: a shorter ascent and a much
 * shallower descent, which together make its content box 0.164em tighter, so its
 * line-height floor is 0.977 where Nunito's worst is 1.096. Its cap height happens
 * to land within half a percent of Nunito's, so the two read at a similar size at
 * the same `fontSize` — a coincidence of these two fonts, not a rule.
 */
export const FIGTREE: FontMetrics = {
  name: 'Figtree',
  ascent: 0.95,
  descent: 0.25,
  contentBox: 1.2,
  capHeight: 0.7,
  xHeight: 0.5,
  faces: {
    '600': {
      family: 'Figtree_600SemiBold',
      postScriptName: 'Figtree-SemiBold',
      inkTop: 0.727,
      digitTop: 0.712,
      inkBottom: -0.215,
    },
  },
};

/**
 * A font's face for a weight, or a loud failure.
 *
 * Silently falling back would be the worst outcome: the app would render a weight
 * it does not have — which Android fakes by synthesising a bold — and lay it out
 * against metrics belonging to a different one.
 */
export function faceFor(font: FontMetrics, weight: FontWeight): FontFace {
  const face = font.faces[weight];
  if (!face) {
    throw new Error(
      `${font.name} has no ${weight} face loaded. Available: ${Object.keys(font.faces).join(', ')}.`,
    );
  }
  return face;
}

/** Nunito's own values, kept as named constants because most of the app is set in
 *  it and the layout maths reads better without a lookup. */
export const DESCENT = NUNITO.descent;
export const ASCENT = NUNITO.ascent;
export const CONTENT_BOX = NUNITO.contentBox;
export const CAP_HEIGHT = NUNITO.capHeight;
export const X_HEIGHT = NUNITO.xHeight;

/** Every face the app can render, across all families. */
export const ALL_FAMILIES: string[] = [NUNITO, FIGTREE].flatMap((f) =>
  Object.values(f.faces).map((face) => face.family),
);

/** Which glyphs a piece of text actually contains. Numerals can be set tighter
 *  than prose because they have no ascenders and no descenders. */
export type InkExtent = 'digits' | 'text';

const inkTop = (font: FontMetrics, weight: FontWeight, extent: InkExtent) => {
  const face = faceFor(font, weight);
  return extent === 'digits' ? face.digitTop : face.inkTop;
};

const inkBottom = (font: FontMetrics, weight: FontWeight, extent: InkExtent) =>
  extent === 'digits' ? 0 : faceFor(font, weight).inkBottom;

/**
 * The smallest legal `lineHeight`, as a multiple of font size, before glyphs
 * shear. Below this RN clips; there is no styling that recovers it.
 *
 * Ranges from 1.067 (Regular prose) to 1.096 (Black prose); digits sit at ~1.07
 * for every weight.
 */
export const minLineHeightRatio = (
  weight: FontWeight,
  extent: InkExtent = 'text',
  font: FontMetrics = NUNITO,
) => font.descent + inkTop(font, weight, extent);

/**
 * Empty space, in px, between the edges of a text box and the visible ink.
 *
 * Use this to compensate padding so that spacing is measured between the marks
 * a reader actually sees, rather than between invisible box edges. A 54px Black
 * numeral at lineHeight 59 has ~2px of slack above its digits and ~19px below —
 * pad it symmetrically and it will look badly top-heavy.
 */
export function inkInsetsFor(
  platform: TextPlatform,
  fontSize: number,
  lineHeight: number,
  weight: FontWeight,
  extent: InkExtent = 'text',
  font: FontMetrics = NUNITO,
): { top: number; bottom: number } {
  return {
    top:
      ascentPxFor(platform, fontSize, lineHeight, font) - inkTop(font, weight, extent) * fontSize,
    bottom:
      descentPxFor(platform, fontSize, lineHeight, font) +
      inkBottom(font, weight, extent) * fontSize,
  };
}

/** The handoff specifies letter-spacing in em; RN takes absolute px. */
export const trackingPx = (em: number, fontSize: number) => em * fontSize;

/**
 * The width a negatively-tracked text box under-measures its own ink by.
 *
 * React Native applies `letterSpacing` after *every* character, including the
 * last, where CSS puts it only *between* them. With negative tracking the box
 * therefore comes out one whole tracking unit narrower than the glyphs inside it,
 * and the final glyph is clipped at the frame — ~2.9px of the last digit at
 * `hero`.
 *
 * Giving that trailing unit back as right padding restores the advance width the
 * text should have had. This is not a fudge factor: it is exactly the one gap RN
 * adds that should not be there, and it is zero for every role tracked at or
 * above zero. Positive tracking leaves the box a trailing gap *too wide*, which
 * clips nothing and is left alone.
 */
export const trackingInset = (letterSpacing: number) => Math.max(0, -letterSpacing);

/**
 * Where the cap block sits inside a line box — the rect the digits or capitals
 * actually occupy, as opposed to the box RN reserves around them.
 *
 * For anything drawn *around* text rather than beside it. A `Text`'s own
 * background is no use for this: it fills the line box, and on iOS the line box
 * is nowhere near centred on its marks. At `hero`, 72/78 Black digits, iOS leaves
 * 1.03px above the digits and 25.42px below — because it pins the space under the
 * baseline to the font's descent and digits have no descenders to fill it. Android
 * splits the slack and comes out at 11.14/15.31, near enough to look deliberate.
 * That difference is why a selection band drawn as a text background reads as
 * correct on one platform and badly low on the other, and no choice of line height
 * fixes it — the descent is the font's, not the layout's.
 *
 * Measured from the top of the line box, so it composes directly with a text's
 * own frame.
 */
export function capBlockBoxFor(
  platform: TextPlatform,
  fontSize: number,
  lineHeight: number,
  weight: FontWeight,
  extent: InkExtent,
  font: FontMetrics = NUNITO,
): { top: number; height: number } {
  const height = capTop(weight, extent, font) * fontSize;
  return { top: ascentPxFor(platform, fontSize, lineHeight, font) - height, height };
}

/**
 * Space below the baseline, in px, for a given line height.
 *
 * The one function that knows the platforms disagree. Everything above it is
 * font data; everything below it is layout, and gets this right for free.
 */
export function descentPxFor(
  platform: TextPlatform,
  fontSize: number,
  lineHeight: number,
  font: FontMetrics = NUNITO,
): number {
  const natural = font.descent * fontSize;
  if (platform === 'ios') return natural;
  // Android moves half the difference between the natural box and the requested
  // line height onto each side of the baseline.
  return natural - (font.contentBox * fontSize - lineHeight) / 2;
}

/** Space above the baseline. The rest of the box, by definition. */
export const ascentPxFor = (
  platform: TextPlatform,
  fontSize: number,
  lineHeight: number,
  font: FontMetrics = NUNITO,
) => lineHeight - descentPxFor(platform, fontSize, lineHeight, font);

/**
 * Distance from the baseline to the top of the *cap block* — capital height for
 * prose, digit height for numerals.
 *
 * Deliberately not the full ink extent: descenders are excluded, because a word
 * containing a "g" does not read as sitting lower on the line than one without.
 * Optical alignment is judged on the cap block, so that is what these helpers use.
 */
export function capTop(weight: FontWeight, extent: InkExtent, font: FontMetrics = NUNITO): number {
  return extent === 'digits' ? faceFor(font, weight).digitTop : font.capHeight;
}

/**
 * Padding that makes a line box symmetric about its cap block.
 *
 * Why this is needed: React Native pins the space below the baseline to the
 * font's descent and puts all line-height slack above it, so a text box is never
 * centred on the marks inside it — and the taller the type, the further out it
 * is. Baseline-aligning a 20px name against a 40px numeral leaves the name
 * looking about 7px low, and box-centring them is no better.
 *
 * Pad each box symmetric first and plain `alignItems: 'center'` then aligns what
 * a reader actually sees. Always positive, because the deficit is always on top.
 */
export function capBoxPaddingFor(
  platform: TextPlatform,
  fontSize: number,
  lineHeight: number,
  weight: FontWeight,
  extent: InkExtent,
  font: FontMetrics = NUNITO,
): { paddingTop: number; paddingBottom: number } {
  const below = descentPxFor(platform, fontSize, lineHeight, font);
  const above = lineHeight - below - capTop(weight, extent, font) * fontSize;
  return {
    paddingTop: Math.max(0, below - above),
    paddingBottom: Math.max(0, above - below),
  };
}

/**
 * Slack left on each side of a box squared by `capBoxPadding`.
 *
 * Equal on both sides by construction — that is what "squared" means — and always
 * the font's descent. Pass this to `opticalPadding` when padding a container
 * around a cap-squared box; passing the *padding* instead double-counts one side
 * and leaves the row visibly bottom-heavy.
 */
export function capBoxInsetFor(
  platform: TextPlatform,
  fontSize: number,
  lineHeight: number,
  weight: FontWeight,
  extent: InkExtent,
  font: FontMetrics = NUNITO,
): number {
  const below = descentPxFor(platform, fontSize, lineHeight, font);
  const above = lineHeight - below - capTop(weight, extent, font) * fontSize;
  return Math.max(above, below);
}

/**
 * Margin between two stacked blocks of text, measured between their marks rather
 * than between their boxes. The same idea as `opticalPadding`, one axis up.
 */
export function opticalGap(
  desired: number,
  aboveInsets: { bottom: number },
  belowInsets: { top: number },
): number {
  return Math.max(0, desired - aboveInsets.bottom - belowInsets.top);
}

/**
 * Container padding that measures to the ink rather than to the text box.
 *
 * `desired` is the gap you want to see between the card edge and the visible
 * marks; the text box already contributes `insets`, so the padding is whatever is
 * left. This is the effect `docs/designs/v1` gets by crushing its line heights;
 * done here it needs no negative margins and no per-screen fudge factors.
 *
 * Clamped at zero: at the tightest legal line height a display numeral's natural
 * descent slack can already exceed the gap asked for, and the honest answer is
 * "no extra padding" rather than pulling the layout apart.
 */
export function opticalPadding(
  desired: { top: number; bottom: number },
  insets: { top: number; bottom: number },
): { paddingTop: number; paddingBottom: number } {
  return {
    paddingTop: Math.max(0, desired.top - insets.top),
    paddingBottom: Math.max(0, desired.bottom - insets.bottom),
  };
}
