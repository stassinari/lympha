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
 *
 * Rule 1 is what settles the question a pale label used to raise. Lotus Sodium is
 * `#F0DADC`, which is 1.33 against a white card, and it used to carry an
 * `edgeOnLight` outline so it could hold a 3:1 edge. That was applying a text rule
 * to something that is not text: the bar is a decorative echo of the sticker, and
 * the row's name and number carry the meaning whatever the bar does. Nothing is
 * lost when it is faint, so nothing needs to be added to stop it being faint —
 * every bar is now flush and unbordered, at exactly the colour the vendor publishes.
 */

import { NEUTRAL_SLATE } from './palette';
import type { ResolvedScheme } from './theme';

export type SchemeColour = {
  light: string;
  dark: string;
};

export type ResolvedBarColour = {
  bar: string;
};

export function resolveBarColour(
  colour: SchemeColour | undefined,
  scheme: ResolvedScheme,
): ResolvedBarColour {
  return { bar: colour ? colour[scheme] : NEUTRAL_SLATE[scheme] };
}

/** Brand accent, for links and active states. Always a separate token from the
 *  bar colour — a bar may be too light to use as text. */
export function resolveAccent(
  accent: { light: string; dark: string },
  scheme: ResolvedScheme,
): string {
  return accent[scheme];
}
