/**
 * The type scale.
 *
 * Each role fixes a family, size, line height and tracking, because React Native
 * has no cascade — a `Text` inherits nothing from the `View` around it. Roles are
 * consumed through the components in `text.tsx`, never as loose style objects.
 *
 * Line heights are chosen against `minLineHeightRatio`, which is a hard floor,
 * not a preference. The display roles sit as close to that floor as Nunito
 * allows; the difference from the handoff's `line-height: 0.88` is taken out of
 * container padding instead, using `inkInsets`.
 */

import { FONT_FAMILY, minLineHeightRatio, trackingPx } from './metrics';
import type { InkExtent, NunitoWeight } from './metrics';

export type TypeRole =
  | 'hero'
  | 'volume'
  | 'doseValue'
  | 'screenTitle'
  | 'rowTitle'
  | 'cardTitle'
  | 'body'
  | 'caption'
  | 'sectionHeader'
  | 'unitLabel'
  | 'volumeUnit'
  | 'cardLabel';

type RoleSpec = {
  weight: NunitoWeight;
  size: number;
  /** Multiple of font size. Must clear `minLineHeightRatio` for the weight. */
  lineHeightRatio: number;
  /** Tracking in em, as the handoff expresses it; converted to px below. */
  trackingEm: number;
  /** What the role renders, which sets how tight its line may legally be. */
  extent: InkExtent;
  uppercase?: boolean;
};

const ROLES: Record<TypeRole, RoleSpec> = {
  // Display roles — numerals only, so they may use the tighter digit floor (~1.07).
  hero: { weight: '900', size: 72, lineHeightRatio: 1.08, trackingEm: -0.04, extent: 'digits' },
  volume: { weight: '900', size: 54, lineHeightRatio: 1.08, trackingEm: -0.035, extent: 'digits' },
  doseValue: {
    weight: '900',
    size: 40,
    lineHeightRatio: 1.08,
    trackingEm: -0.02,
    extent: 'digits',
  },

  // Prose roles — must clear the taller floor (up to 1.096 at Black).
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
  cardLabel: { weight: '700', size: 13.5, lineHeightRatio: 1.35, trackingEm: 0, extent: 'text' },
  /** Sits beside a dose value on a shared baseline, so it stays small. */
  unitLabel: { weight: '700', size: 13, lineHeightRatio: 1.35, trackingEm: 0, extent: 'text' },
  /** Sits beside the volume, which is far larger, so it is scaled up to match. */
  volumeUnit: { weight: '700', size: 19, lineHeightRatio: 1.3, trackingEm: 0, extent: 'text' },
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
  /** Kept so layout can compensate for the asymmetry — see `inkInsets`. */
  weight: NunitoWeight;
  extent: InkExtent;
};

function resolve(spec: RoleSpec): ResolvedType {
  const floor = minLineHeightRatio(spec.weight, spec.extent);
  if (spec.lineHeightRatio < floor) {
    throw new Error(
      `lineHeightRatio ${spec.lineHeightRatio} is below Nunito's floor of ${floor.toFixed(3)} ` +
        `for weight ${spec.weight}/${spec.extent}; glyphs would be clipped.`,
    );
  }
  return {
    fontFamily: FONT_FAMILY[spec.weight],
    fontSize: spec.size,
    lineHeight: Math.round(spec.size * spec.lineHeightRatio),
    letterSpacing: trackingPx(spec.trackingEm, spec.size),
    includeFontPadding: false,
    ...(spec.uppercase ? { textTransform: 'uppercase' as const } : {}),
    weight: spec.weight,
    extent: spec.extent,
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
 * `ResolvedType` also carries `weight` and `extent`, which are metric metadata
 * for layout rather than style props. Spreading the whole record into a `style`
 * would pass them to the renderer, where they are meaningless at best.
 */
export function styleForRole(role: TypeRole): Omit<ResolvedType, 'weight' | 'extent'> {
  const { weight: _weight, extent: _extent, ...style } = typeScale[role];
  return style;
}
