/**
 * The honesty line, pinned to the bottom of the dose screen.
 *
 * Renders nothing at all when there is no rounding worth reporting, rather than
 * saying "0% off" — silence is the correct output for a dose you can actually
 * deliver.
 *
 * The whole line is the way through to the breakdown, not just the word
 * "Details". A 15px word is a ~40×22pt target at the far bottom corner of the
 * screen, which is the hardest place on a phone to hit one-handed, and the line
 * beside it is already about exactly the thing the breakdown explains — so the
 * text was a label for a target that should have been the row.
 *
 * It gains no card, border, chevron or resting background in exchange. The line
 * looks the same as it did; "Details" stays the only coloured thing on it and
 * carries the affordance on its own, and a press dims the row briefly to confirm
 * what was hit.
 */

import { Body, Dot, Touchable, resolveAccent, useTheme } from '@/design';
import type { RoundingSummary } from '@/format/rounding';

/**
 * Padding that buys touch area rather than space.
 *
 * The band has to clear 44pt: the line's own `body` box is 22.5pt, and the 14pt
 * gap above the text is already inside the target, so 11pt below takes it to
 * ~47pt. The equal negative margin gives that height back to the layout, so the
 * line sits exactly where it did — the overhang falls into the bottom inset,
 * which is empty, rather than up over the last dose row.
 */
const TAP_BAND = 11;
const GAP_ABOVE = 14;

export type RoundingLineProps = {
  summary: RoundingSummary;
  brandAccent: { light: string; dark: string };
  onDetails: () => void;
};

export function RoundingLine({ summary, brandAccent, onDetails }: RoundingLineProps) {
  const { scheme } = useTheme();
  if (!summary) return null;

  const accent = resolveAccent(brandAccent, scheme);

  return (
    <Touchable
      onPress={onDetails}
      // The row is one control now, so it reads as one: the status it reports is
      // the label, and what tapping does is the hint. Without this the reader
      // announces the summary and the word "Details" as two separate strings and
      // leaves it to the listener to work out that the first one is a button.
      accessibilityLabel={summary.text}
      accessibilityHint="Shows the full breakdown of asked versus delivered"
      pressDim
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        // Sits inboard of the cards, roughly on their content edge.
        paddingHorizontal: 8,
        paddingTop: GAP_ABOVE,
        paddingBottom: TAP_BAND,
        marginBottom: -TAP_BAND,
      }}
    >
      <Dot status={summary.status} />
      <Body tone="secondary" style={{ flex: 1 }}>
        {summary.text}
      </Body>
      <Body style={{ color: accent }}>Details</Body>
    </Touchable>
  );
}
