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

export const FONT_FAMILY: Record<NunitoWeight, string> = {
  '400': 'Nunito_400Regular',
  '600': 'Nunito_600SemiBold',
  '700': 'Nunito_700Bold',
  '800': 'Nunito_800ExtraBold',
  '900': 'Nunito_900Black',
};

/** Distance from the baseline to the bottom of the text box. Constant, and — because
 *  RN clamps the ascent rather than the descent — independent of lineHeight. */
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
export function inkInsets(
  fontSize: number,
  lineHeight: number,
  weight: NunitoWeight,
  extent: InkExtent = 'text',
): { top: number; bottom: number } {
  const spaceAboveBaseline = lineHeight - DESCENT * fontSize;
  return {
    top: spaceAboveBaseline - inkTop(weight, extent) * fontSize,
    bottom: DESCENT * fontSize + inkBottom(weight, extent) * fontSize,
  };
}

/** The handoff specifies letter-spacing in em; RN takes absolute px. */
export const trackingPx = (em: number, fontSize: number) => em * fontSize;
