/**
 * Raw colour values from the design handoff. Nothing outside this file should
 * reference a hex code; screens consume the semantic names in `theme.ts`.
 *
 * The secondary text values are the lightest that pass WCAG AA at 14px against
 * their intended backgrounds. Do not lighten.
 */

export type ColourTokens = {
  background: string;
  card: string;
  control: string;
  controlSelected: string;
  text: string;
  textSecondary: string;
  textOnCard: string;
  textWarning: string;
  divider: string;
  /**
   * Rounding is within tolerance. Per scheme, unlike `warning`, because it is a
   * two-value hue: see the note on the light table below.
   */
  ok: string;
  /**
   * Off target past the flag threshold: bars and the status mark. Lighter than
   * `textWarning` in light, because a mark needs 3:1 where text needs 4.5:1.
   */
  warning: string;
  /**
   * Far off target, or a bottle missing: the recipe is no longer the recipe.
   * Bars, the status mark and text alike, since it clears 4.5:1 in both schemes.
   *
   * Vermilion rather than crimson, to stay clear of Lotus's Magnesium and
   * accent (#B8404F); Apax's JAMM coral is the nearest bottle colour.
   */
  error: string;
};

/**
 * Where a bottle has no sampleable label colour, per the handoff's fallback rule.
 * Cool enough to stay distinct from the warm neutrals of the surface palette.
 */
export const NEUTRAL_SLATE = { light: '#7E8A8C', dark: '#9DAAAC' } as const;

/**
 * `ok` is a leaf green of its own, not a bottle's colour.
 *
 * A bottle colour used as a state reads as that bottle — beside a teal bar, a
 * teal check looks like part of the dose list — and the caution state it pairs
 * with is an amber that belongs to no bottle.
 *
 * Leaf sits at hue ~96°, warm enough to live with terracotta, rose, cream and
 * amber, and clear of every green a bottle or brand already uses: Lotus's
 * potassium teal (~175°), Apax's forest accent (~138°) and TONIK's mint (~133°).
 * Apax's accent matters most, because it colours the "Details" link that sits
 * beside the check.
 *
 * As drawn, at the clear mark's 80% opacity, it clears 3:1 against `background`
 * in both schemes: 3.30 light, 5.89 dark. `palette.test.ts` holds it there.
 */
export const light: ColourTokens = {
  background: '#FBF8F4',
  card: '#FFFFFF',
  control: '#F1E9E2',
  controlSelected: '#FFFFFF',
  text: '#241E1C',
  textSecondary: '#7D6D66',
  textOnCard: '#7D6D66',
  textWarning: '#96632F',
  divider: '#EDE4DC',
  ok: '#4D7A31',
  warning: '#A8742F',
  error: '#B8321A',
};

export const dark: ColourTokens = {
  background: '#161211',
  card: '#211C1A',
  control: '#332B28',
  controlSelected: '#463C37',
  text: '#F4EFEB',
  textSecondary: '#9C8D85',
  textOnCard: '#B6A79F',
  textWarning: '#D99A4E',
  divider: '#2C2523',
  ok: '#8DBE6A',
  warning: '#D99A4E',
  error: '#EF6A4A',
};
