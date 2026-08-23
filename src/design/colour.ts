/**
 * Resolving a bottle's label colour for the active scheme.
 *
 * The rules the whole identity system rests on, from the handoff:
 *
 *   1. Colour never carries meaning alone. A name and a number are always
 *      present too, for colour-blind users and for very pale labels.
 *   2. Colour appears as a flush edge bar, never as a fill or a tint. No coloured
 *      row backgrounds and no coloured body text, so contrast stays a solved
 *      problem whatever colour a future brand ships.
 *   3. Light and dark use different values of the same hue, but the same geometry.
 *   4. A bottle with no sampleable colour degrades to neutral slate.
 */

import { NEUTRAL_SLATE } from './palette';
import type { ResolvedScheme } from './theme';

export type SchemeColour = {
  light: string;
  dark: string;
  /** A very pale label needs an inner edge to stay visible against a white card. */
  edgeOnLight?: string;
};

export type ResolvedBarColour = {
  bar: string;
  /** Only ever set in light mode, and only for labels too pale to hold an edge. */
  edge?: string;
};

export function resolveBarColour(
  colour: SchemeColour | undefined,
  scheme: ResolvedScheme,
): ResolvedBarColour {
  if (!colour) return { bar: NEUTRAL_SLATE[scheme] };
  const bar = colour[scheme];
  return scheme === 'light' && colour.edgeOnLight ? { bar, edge: colour.edgeOnLight } : { bar };
}

/** Brand accent, for links and active states. Always a separate token from the
 *  bar colour — a bar may be too light to use as text. */
export function resolveAccent(
  accent: { light: string; dark: string },
  scheme: ResolvedScheme,
): string {
  return accent[scheme];
}
