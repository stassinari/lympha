/**
 * The metric helpers, bound to the platform the app is actually running on.
 *
 * `metrics.ts` stays free of React Native so it can be tested in plain Node
 * against both platforms' measured behaviour. This is the thin layer that picks
 * one, so call sites never have to think about it.
 */

import { Platform, useWindowDimensions } from 'react-native';
import {
  NUNITO,
  ascentPxFor,
  capBlockBoxFor,
  capBoxInsetFor,
  capBoxPaddingFor,
  capTop,
  descentPxFor,
  inkInsetsFor,
} from './metrics';
import type { FontMetrics, InkExtent, FontWeight, TextPlatform } from './metrics';
import { typeScale } from './typography';
import type { TypeRole } from './typography';

export const TEXT_PLATFORM: TextPlatform = Platform.OS === 'android' ? 'android' : 'ios';

export const descentPx = (fontSize: number, lineHeight: number, font: FontMetrics = NUNITO) =>
  descentPxFor(TEXT_PLATFORM, fontSize, lineHeight, font);

export const ascentPx = (fontSize: number, lineHeight: number, font: FontMetrics = NUNITO) =>
  ascentPxFor(TEXT_PLATFORM, fontSize, lineHeight, font);

export const inkInsets = (
  fontSize: number,
  lineHeight: number,
  weight: FontWeight,
  extent: InkExtent = 'text',
  font: FontMetrics = NUNITO,
) => inkInsetsFor(TEXT_PLATFORM, fontSize, lineHeight, weight, extent, font);

export const capBoxPadding = (
  fontSize: number,
  lineHeight: number,
  weight: FontWeight,
  extent: InkExtent,
  font: FontMetrics = NUNITO,
) => capBoxPaddingFor(TEXT_PLATFORM, fontSize, lineHeight, weight, extent, font);

export const capBoxInset = (
  fontSize: number,
  lineHeight: number,
  weight: FontWeight,
  extent: InkExtent,
  font: FontMetrics = NUNITO,
) => capBoxInsetFor(TEXT_PLATFORM, fontSize, lineHeight, weight, extent, font);

export const capBlockBox = (
  fontSize: number,
  lineHeight: number,
  weight: FontWeight,
  extent: InkExtent,
  font: FontMetrics = NUNITO,
) => capBlockBoxFor(TEXT_PLATFORM, fontSize, lineHeight, weight, extent, font);

/**
 * The effective text-size multiplier for a role, with the role's own ceiling
 * applied. The one number everything else here scales by.
 */
export function useTypeScaleFactor(role: TypeRole): number {
  const { fontScale } = useWindowDimensions();
  const { maxScale } = typeScale[role];
  return maxScale === undefined ? fontScale : Math.min(fontScale, maxScale);
}

/**
 * The right inset a role needs at the reader's text size so its last glyph is not
 * clipped — see `trackingInset` for what RN is doing wrong and why this is a
 * restoration rather than a fudge.
 *
 * Scaled here rather than baked into the role's style, because RN scales
 * `letterSpacing` with `fontSize` but does not scale padding: a static value would
 * be exactly right at 1× and short by the same proportion at every size above it.
 */
export function useTrackingInset(role: TypeRole): number {
  return typeScale[role].trackingInset * useTypeScaleFactor(role);
}

/**
 * A role's metrics at the reader's chosen text size.
 *
 * Everything derived from the type scale — the cap-squaring padding on a dose
 * row, the optical inset a card measures its edges against, the height of the
 * volume caret — was computed once at module load from an unscaled font size.
 * Turn the system text size up and the text grows while those numbers do not, so
 * the optical centring the whole design system exists to get right quietly stops
 * being centred, and the caret ends up two thirds the height of the digits it
 * stands beside.
 *
 * React Native scales `fontSize` and `lineHeight` by the same multiplier, so the
 * fix is to run the same metric functions against the scaled pair rather than
 * the nominal one. The role's own ceiling applies, so a capped role's geometry
 * stops moving at exactly the point its type does.
 */
export function useTypeMetrics(role: TypeRole) {
  const spec = typeScale[role];
  const factor = useTypeScaleFactor(role);

  const fontSize = spec.fontSize * factor;
  const lineHeight = spec.lineHeight * factor;

  // The role's own font, not the app's default one: a box squared about Nunito's
  // cap block is not squared about Figtree's, and its descent is 0.1em shallower.
  const font = spec.font;

  return {
    factor,
    fontSize,
    lineHeight,
    /** Distance from the baseline to the top of the digits or capitals. */
    capHeight: capTop(spec.weight, spec.extent, font) * fontSize,
    capBoxPadding: capBoxPadding(fontSize, lineHeight, spec.weight, spec.extent, font),
    capBoxInset: capBoxInset(fontSize, lineHeight, spec.weight, spec.extent, font),
    inkInsets: inkInsets(fontSize, lineHeight, spec.weight, spec.extent, font),
    /** Where the marks sit inside the line box, for anything drawn around them. */
    capBlockBox: capBlockBox(fontSize, lineHeight, spec.weight, spec.extent, font),
    trackingInset: spec.trackingInset * factor,
  };
}

/**
 * The text size above which a fixed composition has to reflow.
 *
 * iOS divides text sizes into the standard range and the accessibility range,
 * and Apple's guidance for the latter is not "make it bigger" but "lay it out
 * differently" — side-by-side becomes stacked, pinned becomes scrollable. React
 * Native does not surface the category, but it surfaces the multiplier, and the
 * two ranges do not overlap: the largest standard size is 1.35 and the smallest
 * accessibility size is 1.786 (measured on device). Anything between them
 * separates the two cleanly.
 *
 * Android has no equivalent split, so the same number is applied there, where it
 * sits just above the 1.3 that the app's own display roles cap at.
 */
export const REFLOW_TEXT_SCALE = 1.5;

/**
 * Whether the reader's text size has passed the point where a layout that fixes
 * something to an edge stops being viable.
 */
export function useReflowedText(): boolean {
  const { fontScale } = useWindowDimensions();
  return fontScale >= REFLOW_TEXT_SCALE;
}
