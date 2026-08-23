/**
 * The honesty line, pinned to the bottom of the dose screen.
 *
 * Renders nothing at all when there is no rounding worth reporting, rather than
 * saying "0% off" — silence is the correct output for a dose you can actually
 * deliver.
 */

import { View } from 'react-native';
import { Body, Dot, Touchable, resolveAccent, useTheme } from '@/design';
import type { RoundingSummary } from '@/format/rounding';

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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        // Sits inboard of the cards, roughly on their content edge.
        paddingHorizontal: 8,
        paddingTop: 14,
      }}
    >
      <Dot status={summary.status} />
      <Body tone="secondary" style={{ flex: 1 }}>
        {summary.text}
      </Body>
      <Touchable
        onPress={onDetails}
        accessibilityLabel="What you'll get"
        accessibilityHint="Shows the full breakdown of asked versus delivered"
        hitSlop={12}
      >
        <Body style={{ color: accent }}>Details</Body>
      </Touchable>
    </View>
  );
}
