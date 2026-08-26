/**
 * Raw colour values from the design handoff. Nothing outside this file should
 * reference a hex code; screens consume the semantic names in `theme.ts`.
 *
 * The secondary text values were verified for WCAG AA at 14px against their
 * intended backgrounds and previously failed with lighter values. Do not lighten.
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
 * `ok` is the potassium bar teal, deliberately.
 *
 * It was a generic success green, which made it the only colour in the app
 * outside the identity palette — terracotta, rose, cream, teal, amber. Reusing
 * the teal keeps that list closed, and the teal is not otherwise spoken for as a
 * state.
 *
 * The two values are restated here rather than imported from `data/lotus`, which
 * is where the same pair sits as Lotus's published label colour. They are the
 * same colour on purpose and should be changed together — but a semantic token
 * must not move because a vendor revised a sticker, so the theme does not depend
 * on the data layer to know what "fine" looks like.
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
  ok: '#4E9E98',
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
  ok: '#5AB3AC',
};

/** Shared across both schemes: this reads acceptably on either background. */
export const semantic: SemanticTokens = {
  /** Rounding is over the flag threshold, or a bottle would round to zero. */
  warning: '#D99A4E',
};
