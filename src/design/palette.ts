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
};

export type SemanticTokens = {
  warning: string;
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
};

/** Shared across both schemes: this reads acceptably on either background. */
export const semantic: SemanticTokens = {
  /** Rounding is over the flag threshold, or a bottle would round to zero. */
  warning: '#D99A4E',
};
