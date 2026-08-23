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
};

export type SemanticTokens = {
  ok: string;
  warning: string;
};

/**
 * Where a bottle has no sampleable label colour, per the handoff's fallback rule.
 * Cool enough to stay distinct from the warm neutrals of the surface palette.
 */
export const NEUTRAL_SLATE = { light: '#7E8A8C', dark: '#9DAAAC' } as const;

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
};

/** Shared across both schemes: these read acceptably on either background. */
export const semantic: SemanticTokens = {
  /** Rounding is within tolerance. */
  ok: '#78A566',
  /** Rounding is over the flag threshold, or a bottle would round to zero. */
  warning: '#D99A4E',
};
