/**
 * Nunito's vertical metrics, and the line-height rules they impose.
 *
 * All values are em (the font's unitsPerEm is 1000). They are transcribed from
 * `scripts/font-metrics.mjs`, which reads them out of the shipped TTFs — run
 * `npm run font-metrics` to reproduce. They are checked in rather than computed
 * at build time so nothing at runtime depends on parsing a font file.
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

export type NunitoWeight = '400' | '600' | '700' | '800' | '900';

/**
 * The two platforms position a line of text differently inside an explicit
 * `lineHeight`, and no amount of `includeFontPadding: false` reconciles them.
 * Measured on device (Nunito Black 40px, lineHeight 43):
 *
 *   iOS      ascent 28.88   descent 14.12
 *   Android  ascent 34.67   descent  8.38
 *
 * iOS pins the descent at the font's own and takes the entire difference off the
 * ascent. Android splits the difference evenly between the two — it removed 5.71
 * above and 5.72 below. Everything else in this module derives from that.
 */
export type TextPlatform = 'ios' | 'android';

export const FONT_FAMILY: Record<NunitoWeight, string> = {
  '400': 'Nunito_400Regular',
  '600': 'Nunito_600SemiBold',
  '700': 'Nunito_700Bold',
  '800': 'Nunito_800ExtraBold',
  '900': 'Nunito_900Black',
};

/** The font's own descent, in em. What sits below the baseline on iOS at any
 *  line height, and the starting point for Android's even split. */
export const DESCENT = 0.353;

export const ASCENT = 1.011;
export const CONTENT_BOX = ASCENT + DESCENT; // 1.364em, the box at lineHeight: normal
export const CAP_HEIGHT = 0.705;
export const X_HEIGHT = 0.484;

/** Tallest ink above the baseline, per weight. Heavier weights are taller: the
 *  outlines grow outward, so the safe line height grows with the weight. */
const INK_TOP: Record<NunitoWeight, number> = {
  '400': 0.714,
  '600': 0.714,
  '700': 0.721,
  '800': 0.732,
  '900': 0.743,
};

/** Tallest ink above the baseline for digits only. Nearly weight-invariant,
 *  and lower than INK_TOP, so numerals tolerate a tighter line than prose. */
const DIGIT_TOP: Record<NunitoWeight, number> = {
  '400': 0.714,
  '600': 0.714,
  '700': 0.715,
  '800': 0.716,
  '900': 0.716,
};

/** Lowest ink below the baseline (negative). Descenders never reach the full
 *  font descent, which is why there is slack under a line of text. */
const INK_BOTTOM: Record<NunitoWeight, number> = {
  '400': -0.195,
  '600': -0.198,
  '700': -0.203,
  '800': -0.207,
  '900': -0.212,
};

/** Which glyphs a piece of text actually contains. Numerals can be set tighter
 *  than prose because they have no ascenders and no descenders. */
export type InkExtent = 'digits' | 'text';

const inkTop = (weight: NunitoWeight, extent: InkExtent) =>
  extent === 'digits' ? DIGIT_TOP[weight] : INK_TOP[weight];

const inkBottom = (weight: NunitoWeight, extent: InkExtent) =>
  extent === 'digits' ? 0 : INK_BOTTOM[weight];

/**
 * The smallest legal `lineHeight`, as a multiple of font size, before glyphs
 * shear. Below this RN clips; there is no styling that recovers it.
 *
 * Ranges from 1.067 (Regular prose) to 1.096 (Black prose); digits sit at ~1.07
 * for every weight.
 */
export const minLineHeightRatio = (weight: NunitoWeight, extent: InkExtent = 'text') =>
  DESCENT + inkTop(weight, extent);

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
  weight: NunitoWeight,
  extent: InkExtent = 'text',
): { top: number; bottom: number } {
  return {
    top: ascentPxFor(platform, fontSize, lineHeight) - inkTop(weight, extent) * fontSize,
    bottom: descentPxFor(platform, fontSize, lineHeight) + inkBottom(weight, extent) * fontSize,
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
 * and the final glyph is clipped at the frame — losing ~2.9px of the last digit
 * at `hero`, which is what the volume screen's cutoff was.
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
  weight: NunitoWeight,
  extent: InkExtent,
): { top: number; height: number } {
  const height = capTop(weight, extent) * fontSize;
  return { top: ascentPxFor(platform, fontSize, lineHeight) - height, height };
}

/**
 * Space below the baseline, in px, for a given line height.
 *
 * The one function that knows the platforms disagree. Everything above it is
 * font data; everything below it is layout, and gets this right for free.
 */
export function descentPxFor(platform: TextPlatform, fontSize: number, lineHeight: number): number {
  const natural = DESCENT * fontSize;
  if (platform === 'ios') return natural;
  // Android moves half the difference between the natural box and the requested
  // line height onto each side of the baseline.
  return natural - (CONTENT_BOX * fontSize - lineHeight) / 2;
}

/** Space above the baseline. The rest of the box, by definition. */
export const ascentPxFor = (platform: TextPlatform, fontSize: number, lineHeight: number) =>
  lineHeight - descentPxFor(platform, fontSize, lineHeight);

/**
 * Distance from the baseline to the top of the *cap block* — capital height for
 * prose, digit height for numerals.
 *
 * Deliberately not the full ink extent: descenders are excluded, because a word
 * containing a "g" does not read as sitting lower on the line than one without.
 * Optical alignment is judged on the cap block, so that is what these helpers use.
 */
export function capTop(weight: NunitoWeight, extent: InkExtent): number {
  return extent === 'digits' ? DIGIT_TOP[weight] : CAP_HEIGHT;
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
  weight: NunitoWeight,
  extent: InkExtent,
): { paddingTop: number; paddingBottom: number } {
  const below = descentPxFor(platform, fontSize, lineHeight);
  const above = lineHeight - below - capTop(weight, extent) * fontSize;
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
  weight: NunitoWeight,
  extent: InkExtent,
): number {
  const below = descentPxFor(platform, fontSize, lineHeight);
  const above = lineHeight - below - capTop(weight, extent) * fontSize;
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
 * left. This is the whole reason the handoff crushed its line heights, and doing
 * it here instead means no negative margins and no per-screen fudge factors.
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
