/**
 * How far through the bottles you are.
 *
 * Losing your place halfway through is the real failure mode this screen guards
 * against — four bottles, squeezed one at a time, in the dark. The strip is
 * deliberately tiny: it answers "where was I" at a glance without becoming
 * something to look at.
 */

import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
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

  // Width is not native-drivable, but this is a three-pixel bar that changes once
  // per bottle — the JS driver is not going to be noticed here.
  const [width] = useState(() => new Animated.Value(fraction));
  useEffect(() => {
    const animation = Animated.timing(width, {
      toValue: fraction,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fraction, width]);
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
      <Animated.View
        style={{
          width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          height: '100%',
          backgroundColor: resolveAccent(brandAccent, scheme),
        }}
      />
    </View>
  );
}
