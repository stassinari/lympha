/**
 * Layout tokens: spacing, radii, and the fixed sizes screens are measured
 * against.
 *
 * Split from `theme.ts` for the same reason `metrics.ts` is split from
 * `textMetrics.ts` — nothing here touches React Native, so it can be tested in
 * plain Node against both platforms. `theme.ts` re-exports all of it, so call
 * sites still import layout and colour from one place.
 */

/**
 * Spacing. The handoff's values are deliberately irregular, so they are named
 * for what they separate rather than fitted to a scale that would distort them.
 */
export const space = {
  /** Between dose rows in the list. */
  rows: 9,
  /** Between the major blocks of a screen. */
  blocks: 14,
  /** Screen edge inset, horizontal. */
  screenH: 18,
  /** Inside a card. */
  cardV: 18,
  cardH: 20,
  /**
   * Gap between a row's edge and the *visible marks* inside it, as opposed to the
   * invisible text box. Fed through `opticalPadding`, which is what keeps a dose
   * row from looking top-heavy: a 40px numeral carries ~14px of descent slack
   * below its digits, and padding both sides equally would push the ink upwards.
   */
  rowInk: 20,
  /** Between a field label and the large value beneath it. Chosen to clear the
   *  intrinsic slack both platforms leave above a display numeral — see
   *  `VolumeCard` — so the two render the same gap. */
  labelGap: 10,
  /**
   * Between the header band and the first thing in a screen's scroller.
   *
   * A ScrollView clips to its own bounds, so a card that starts flush with the
   * scroller's top edge has the top of its shadow sliced off. Home's recipe card
   * and Details' headline row both did, faintly on Android and invisibly on iOS.
   * The visible part of `cardShadow` reaches about 4pt above a card on iOS (a
   * 14pt blur, offset 3pt down, at 6% opacity) and about 2dp on Android at
   * elevation 2, so 8 clears both with room to spare.
   *
   * Applied to every screen whose content starts directly under the header, not
   * only the two that clip, because the content start line has to stay shared —
   * see `HEADER_BAND`. Giving it only to the screens that start with a card would
   * put Home's card and Settings' first label 8pt apart again.
   */
  belowHeader: 8,
  /** Small internal gaps. */
  tight: 6,
  snug: 8,
  loose: 20,
} as const;

export const radius = {
  /** Keypad keys. */
  key: 6,
  /** Material selection chips; iOS uses `pill`. */
  chipAndroid: 12,
  /** Segmented controls, preset pills. */
  control: 16,
  /** Dose rows. */
  row: 20,
  /** Cards. */
  card: 22,
  pill: 999,
} as const;

/** The colour bar on the leading edge of a dose row. Flush, never inset. */
export const COLOUR_BAR_WIDTH = 12;

/**
 * The header strip, directly below the safe-area inset, on every screen.
 *
 * One number, because the point of it is that content starts at the same y
 * wherever you are. Home is headed by a 16pt Figtree wordmark and every overlay
 * screen by a 24pt Nunito title, and before this the band was whatever those
 * happened to measure plus a margin — so the recipe card on Home and the
 * `APPEARANCE` label on Settings sat about 13pt apart and the page jumped as you
 * navigated. A fixed band absorbs the difference in header type instead.
 *
 * It also decouples the top spacing from the status bar. Padding the header by
 * the safe-area inset alone reads as generous on a notched iPhone and collapses
 * on a flat-edge Android with a short status bar; measured from the inset, the
 * band is the same either way.
 *
 * **64 is chosen against the wordmark's cap height, not its line box.** Centre a
 * cap-squared 16pt Figtree box in 64pt and the caps start 26.4pt down, with the
 * same 26.4pt below the baseline — on both platforms, since `capBoxPadding` is
 * what removes the platforms' disagreement about where a line box sits on its
 * marks. At 56 that air was ~17pt, which is close enough to the gap below the
 * band that the mark read as a label attached to the recipe card rather than a
 * bar above the screen. The 24pt title's caps land at 23.5pt in the same band,
 * still with room to spare, which is why the two headers look like one strip.
 *
 * The band also has room to spare beyond the wordmark: a ~24pt glyph beside it
 * would fit with 20pt either side. A `(Ly)` mark was tried there and dropped in
 * favour of the wordmark alone, but the headroom costs nothing, and anything that
 * joins the header later moves neither this number nor the content start line.
 *
 * The content start line itself is the band plus `space.belowHeader`, which each
 * screen's scroller applies as top padding. It is padding inside the scroller,
 * not more band, because its job is to give a card's shadow room inside the
 * scroller's clip.
 *
 * A `minHeight`, never a `height`. `screenTitle` scales without limit, and at the
 * larger accessibility sizes its line box passes 64 — a fixed height would shear
 * the title rather than grow. Below that ceiling the band is exactly 64 and the
 * shared start line holds.
 */
export const HEADER_BAND = 64;
