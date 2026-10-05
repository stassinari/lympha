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
 * beside it is about exactly the thing the breakdown explains.
 *
 * It has no card, border, chevron or resting background. "Details" is the only
 * coloured thing on it and carries the affordance on its own, and a press dims
 * the row briefly to confirm what was hit.
 */

import { View } from 'react-native';
import { ActionText, Body, Icon, Touchable, resolveAccent, useTheme } from '@/design';
import type { RoundingSummary } from '@/format/rounding';

/**
 * Padding that buys touch area rather than space.
 *
 * The band has to clear 44pt: the line's own `body` box is 22.5pt, and the 14pt
 * gap above the text is already inside the target, so 11pt below takes it to
 * ~47pt. The equal negative margin gives that height back to the layout, so the
 * line keeps its position — the overhang falls into the bottom inset, which is
 * empty, rather than up over the last dose row.
 */
const TAP_BAND = 11;
const GAP_ABOVE = 14;

/**
 * The status mark: a filled circle either way, amber or leaf green.
 *
 * A coloured dot carries its whole meaning in hue, so it says nothing in
 * greyscale, nothing to a red-green reader, and nothing on a phone in sunlight.
 * `info` and `checkCircle` are shape as well as hue, and they share a silhouette,
 * so the row swaps between them without reflowing or changing weight.
 *
 * `info` deliberately, not a warning glyph: the copy here is gentle on purpose,
 * and a triangle would shout over a line that means to murmur. Filled, because a
 * state is not an action — the one place in the app where `fill` is right.
 *
 * The amber is the text-weight token (`textWarning`) rather than `warning`. The
 * two resolve identically in dark; in light, a 16pt mark on the page background
 * needs the text token's contrast.
 */
const MARK = 16;

/**
 * The clear state sits a step back from the caution state.
 *
 * Problems should have more presence than non-problems, and left alone these two
 * would not: at full strength the green is the *brighter* of the two against the
 * dark background (8.6:1 to the amber's 7.7), and a filled disc carries a lot of
 * ink. Alpha rather than a paler green, so the mute
 * holds on both schemes without a second value to keep in step.
 *
 * `palette.test.ts` restates this value to check the mark's contrast as drawn,
 * so change the two together.
 *
 * The mark only. The sentence beside it stays at the secondary tone in both
 * states — it clears AA on the page background by a tenth of a point, and
 * `palette.ts` is explicit that those values do not get lightened.
 */
const CLEAR_MARK_OPACITY = 0.8;

export type RoundingLineProps = {
  summary: RoundingSummary;
  brandAccent: { light: string; dark: string };
  onDetails: () => void;
};

export function RoundingLine({ summary, brandAccent, onDetails }: RoundingLineProps) {
  const { colour, scheme } = useTheme();
  if (!summary) return null;

  const accent = resolveAccent(brandAccent, scheme);

  return (
    <Touchable
      onPress={onDetails}
      // The row is one control, so it reads as one: the status it reports is
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
      <View style={{ width: MARK, alignItems: 'center' }}>
        {summary.status === 'warning' ? (
          <Icon name="info" size={MARK} weight="fill" colour={colour.textWarning} />
        ) : (
          <View style={{ opacity: CLEAR_MARK_OPACITY }}>
            <Icon name="checkCircle" size={MARK} weight="fill" colour={colour.ok} />
          </View>
        )}
      </View>
      <Body tone="secondary" style={{ flex: 1 }}>
        {summary.text}
      </Body>
      <ActionText style={{ color: accent }}>Details</ActionText>
    </Touchable>
  );
}
