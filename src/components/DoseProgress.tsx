/**
 * How far through the bottles you are.
 *
 * Losing your place halfway through is the real failure mode this screen guards
 * against — four bottles, squeezed one at a time, in the dark. The strip is
 * deliberately tiny: it answers "where was I" at a glance without becoming
 * something to look at.
 */

import { View } from 'react-native';
import { resolveAccent, useTheme } from '@/design';

export function DoseProgress({
  done,
  total,
  brandAccent,
}: {
  done: number;
  total: number;
  brandAccent: { light: string; dark: string };
}) {
  const { colour, scheme } = useTheme();
  const fraction = total > 0 ? done / total : 0;
  // Before the first bottle there is no progress to show, and an empty track just
  // reads as a stray rule above the list. The space stays reserved so the rows do
  // not jump when the track appears.
  const started = done > 0;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
      accessibilityLabel={`${done} of ${total} bottles added`}
      style={{
        height: 3,
        borderRadius: 2,
        backgroundColor: started ? colour.control : 'transparent',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${fraction * 100}%`,
          height: '100%',
          backgroundColor: resolveAccent(brandAccent, scheme),
        }}
      />
    </View>
  );
}
