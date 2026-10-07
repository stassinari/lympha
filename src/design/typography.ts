/**
 * The type scale.
 *
 * Each role fixes a family, size, line height and tracking, because React Native
 * has no cascade — a `Text` inherits nothing from the `View` around it. Roles are
 * consumed through the components in `text.tsx`, never as loose style objects.
 *
 * Line heights are chosen against `minLineHeightRatio`, which is a hard floor,
 * not a preference. The display roles sit as close to that floor as Nunito
 * allows; the tightness `docs/designs/v1` draws with `line-height: 0.88` comes
 * from container padding, using `inkInsets`.
 *
 * Every role is Nunito except `wordmark`, and a role's font is what decides which
 * font's floor its line height is measured against — the two are 0.11em apart.
 */

import type { FontMetrics, FontWeight, InkExtent } from './metrics';
import { FIGTREE, NUNITO, faceFor, minLineHeightRatio, trackingInset, trackingPx } from './metrics';

export type TypeRole =
  | 'hero'
  | 'volume'
  | 'doseValue'
  | 'headlineWords'
  | 'screenTitle'
  | 'rowTitle'
  | 'cardTitle'
  | 'body'
  | 'action'
  | 'caption'
  | 'sectionHeader'
  | 'unitLabel'
  | 'volumeUnit'
  | 'cardLabel'
  | 'wordmark';

type RoleSpec = {
  /**
   * The family, where it is not the app's own.
   *
   * Defaulted rather than required because exactly one role departs from Nunito,
   * and a field repeated on twelve roles to say "as usual" earns nothing. The
   * font is not cosmetic here: it selects which metrics the line-height floor is
   * checked against, and the two fonts' floors differ by 0.11em.
   */
  font?: FontMetrics;
  weight: FontWeight;
  size: number;
  /** Multiple of font size. Must clear `minLineHeightRatio` for the weight. */
  lineHeightRatio: number;
  /** Tracking in em, as the handoff expresses it; converted to px below. */
  trackingEm: number;
  /** What the role renders, which sets how tight its line may legally be. */
  extent: InkExtent;
  uppercase?: boolean;
  /**
   * Ceiling on the OS text-size multiplier, for roles whose size is a layout
   * decision rather than a reading one.
   *
   * React Native scales `fontSize`, `lineHeight` and `letterSpacing` together, so
   * dynamic type never clips a glyph here — the whole box grows in proportion.
   * What it does break is the relationship *between* two roles: a 72px numeral
   * and the 19px unit beside it are one composition, and letting either move
   * without the other is not a bigger version of the design, it is a different
   * one. So the display numerals and the labels that sit beside them share a
   * ceiling, and everything that is simply read scales without limit.
   */
  maxScale?: number;
};

/** Display numerals and the small labels locked to their baselines. */
const GEOMETRIC_MAX_SCALE = 1.3;

const ROLES: Record<TypeRole, RoleSpec> = {
  // Display roles — numerals only, so they may use the tighter digit floor (~1.07).
  hero: {
    weight: '900',
    size: 72,
    lineHeightRatio: 1.08,
    trackingEm: -0.04,
    extent: 'digits',
    maxScale: GEOMETRIC_MAX_SCALE,
  },
  volume: {
    weight: '900',
    size: 54,
    lineHeightRatio: 1.08,
    trackingEm: -0.035,
    extent: 'digits',
    maxScale: GEOMETRIC_MAX_SCALE,
  },
  doseValue: {
    weight: '900',
    size: 40,
    lineHeightRatio: 1.08,
    trackingEm: -0.02,
    extent: 'digits',
    maxScale: GEOMETRIC_MAX_SCALE,
  },

  // Prose roles — must clear the taller floor (up to 1.096 at Black).
  /**
   * The Rounding card's headline where it is words rather than a percentage: "On
   * target", "No Potassium". The weight of `doseValue`, a step smaller, because a
   * word at 40 is far wider than a figure and "2 bottles missing" would not hold a
   * line. Uncapped, unlike the figure it stands in for: it is read, not composed
   * against a unit beside it.
   */
  headlineWords: {
    weight: '900',
    size: 34,
    lineHeightRatio: 1.15,
    trackingEm: -0.02,
    extent: 'text',
  },
  screenTitle: {
    weight: '900',
    size: 24,
    lineHeightRatio: 1.15,
    trackingEm: -0.02,
    extent: 'text',
  },
  rowTitle: { weight: '800', size: 20, lineHeightRatio: 1.2, trackingEm: -0.01, extent: 'text' },
  cardTitle: { weight: '800', size: 17, lineHeightRatio: 1.25, trackingEm: -0.005, extent: 'text' },
  body: { weight: '600', size: 15, lineHeightRatio: 1.5, trackingEm: 0, extent: 'text' },
  /**
   * A control drawn as a word and nothing else: "Done" in an iOS header,
   * "Details" in the dose screen's footer.
   *
   * `body` in everything but weight. It shares a line with body text — "Details"
   * sits beside the rounding sentence — so a matching size and line box keeps
   * the two on one baseline. The extra step of weight is what tells a control
   * apart from prose once the accent alone stops doing it: in greyscale, in
   * sunlight, or under a brand whose accent sits close to the text tone.
   */
  action: { weight: '700', size: 15, lineHeightRatio: 1.5, trackingEm: 0, extent: 'text' },
  caption: { weight: '600', size: 13.5, lineHeightRatio: 1.35, trackingEm: 0, extent: 'text' },
  sectionHeader: {
    weight: '800',
    size: 13.5,
    lineHeightRatio: 1.35,
    // Uppercase needs positive tracking to stop the caps crowding each other.
    trackingEm: 0.06,
    extent: 'text',
    uppercase: true,
  },
  /** Names the field above a large value — "Water" over the volume. Heavier than
   *  `caption` so it holds its own beneath a 54px numeral. */
  cardLabel: {
    weight: '700',
    size: 13.5,
    lineHeightRatio: 1.35,
    trackingEm: 0,
    extent: 'text',
    maxScale: GEOMETRIC_MAX_SCALE,
  },
  /** Sits beside a dose value on a shared baseline, so it stays small. */
  unitLabel: {
    weight: '700',
    size: 13,
    lineHeightRatio: 1.35,
    trackingEm: 0,
    extent: 'text',
    maxScale: GEOMETRIC_MAX_SCALE,
  },
  /**
   * The app's name, in the dose screen's header, and the only thing set in Figtree.
   *
   * A wordmark is a picture of a name rather than a piece of text, which is the one
   * place a second family pays for itself: it marks the app's own chrome as not
   * being part of the content. Everything else on every screen stays Nunito.
   *
   * Mixed case, never uppercase, and smaller than `screenTitle` on purpose: it is
   * not the page's heading, so it must not read as one. The header band absorbs
   * the difference in size between the two — see `HEADER_BAND` — so neither ever
   * moves the content beneath it.
   *
   * Figtree at 600 has a floor of 0.977 — its content box is 0.164em tighter than
   * Nunito's — so 1.15 here is generous rather than near the limit and the mark has
   * room to sit without shearing. Note the guard in `resolve` only means anything
   * because the role names its font: measured against Nunito's 1.067 floor for the
   * same weight this ratio would also have passed, while checking a font the mark is
   * not set in.
   *
   * Capped, and more tightly than the display roles: the header is pinned outside
   * the scroll view, so an uncapped wordmark grows the one strip of the screen that
   * cannot scroll and pushes the doses off it. The mark is decoration — it is
   * hidden from screen readers — so it is the right thing to hold still.
   */
  wordmark: {
    font: FIGTREE,
    weight: '600',
    // Two thirds of `screenTitle`, not a shade under it. A mark a few points off
    // the page titles reads as a near-miss — a title that failed — rather than a
    // different kind of thing; at 16 the question does not come up. The band
    // stops the smaller mark shortening the header: see `HEADER_BAND`.
    size: 16,
    lineHeightRatio: 1.15,
    // Opened up, not tightened. A wordmark is looked at rather than read, and a
    // little air between the letters is what separates a set name from a word in
    // a sentence. Positive tracking needs no `trackingInset`: RN's trailing
    // letter-space leaves the box too wide rather than too narrow, which clips
    // nothing.
    trackingEm: 0.015,
    extent: 'text',
    maxScale: 1.2,
  },
  /** Sits beside the volume, which is far larger, so it is scaled up to match. */
  volumeUnit: {
    weight: '700',
    size: 19,
    lineHeightRatio: 1.3,
    trackingEm: 0,
    extent: 'text',
    maxScale: GEOMETRIC_MAX_SCALE,
  },
};

export type ResolvedType = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  /** Android adds ascent/descent padding that iOS does not. Off, everywhere,
   *  so a line box measures the same on both platforms. */
  includeFontPadding: false;
  textTransform?: 'uppercase';
  /** The family the role resolved to, so layout reads the right metrics for it. */
  font: FontMetrics;
  /** Kept so layout can compensate for the asymmetry — see `inkInsets`. */
  weight: FontWeight;
  extent: InkExtent;
  /** Undefined where the role may scale without limit. */
  maxScale?: number;
  /**
   * Right padding, at the nominal size, that gives back RN's trailing
   * letter-spacing so the last glyph is not clipped — see `trackingInset`.
   *
   * Metric metadata rather than a style prop, because padding does not scale with
   * the reader's text size and `letterSpacing` does: baked into the static style
   * it would be right at 1× and short by the same proportion at every size above
   * it. `AppText` applies it scaled.
   */
  trackingInset: number;
};

function resolve(spec: RoleSpec): ResolvedType {
  const font = spec.font ?? NUNITO;
  const floor = minLineHeightRatio(spec.weight, spec.extent, font);
  if (spec.lineHeightRatio < floor) {
    throw new Error(
      `lineHeightRatio ${spec.lineHeightRatio} is below ${font.name}'s floor of ` +
        `${floor.toFixed(3)} for weight ${spec.weight}/${spec.extent}; glyphs would be clipped.`,
    );
  }
  return {
    // Throws if the weight is not a loaded face, so a role can never name type the
    // app has not shipped — Android would silently fake it.
    fontFamily: faceFor(font, spec.weight).family,
    fontSize: spec.size,
    lineHeight: Math.round(spec.size * spec.lineHeightRatio),
    letterSpacing: trackingPx(spec.trackingEm, spec.size),
    includeFontPadding: false,
    ...(spec.uppercase ? { textTransform: 'uppercase' as const } : {}),
    font,
    weight: spec.weight,
    extent: spec.extent,
    maxScale: spec.maxScale,
    trackingInset: trackingInset(trackingPx(spec.trackingEm, spec.size)),
  };
}

/** Named `typeScale`, not `type`: a binding called `type` collides with the
 *  `import { type X }` type-only import syntax. */
export const typeScale: Record<TypeRole, ResolvedType> = Object.fromEntries(
  (Object.keys(ROLES) as TypeRole[]).map((role) => [role, resolve(ROLES[role])]),
) as Record<TypeRole, ResolvedType>;

export const typeSpecs = ROLES;

/**
 * Just the React Native style properties for a role.
 *
 * `ResolvedType` also carries `font`, `weight`, `extent`, `maxScale` and
 * `trackingInset`, which are metric metadata for layout rather than style props.
 * Spreading the whole record into a `style` would pass them to the renderer, where
 * they are meaningless at best.
 */
export function styleForRole(
  role: TypeRole,
): Omit<ResolvedType, 'font' | 'weight' | 'extent' | 'maxScale' | 'trackingInset'> {
  const {
    font: _font,
    weight: _weight,
    extent: _extent,
    maxScale: _maxScale,
    trackingInset: _trackingInset,
    ...style
  } = typeScale[role];
  return style;
}

/**
 * A role as SwiftUI text takes it, for the few places the app draws native text.
 *
 * SwiftUI has no line height, only `lineSpacing`, the gap added between the
 * natural line boxes the font defines (its content box). So the role's line
 * height is expressed as what it adds over that box, and a role tighter than the
 * box adds nothing. The size is nominal: SwiftUI scales it with Dynamic Type when
 * given a text style to scale against.
 */
export function swiftUIFont(role: TypeRole) {
  const { font, weight, fontSize, lineHeight, letterSpacing } = typeScale[role];
  return {
    family: faceFor(font, weight).postScriptName,
    size: fontSize,
    lineSpacing: Math.max(0, lineHeight - font.contentBox * fontSize),
    kerning: letterSpacing,
  };
}
