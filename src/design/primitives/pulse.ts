/**
 * The little jump a number makes when it changes.
 *
 * The dose screen recomputes silently — change the volume and four numbers become
 * four different numbers with nothing to mark the moment. A brief pop says "that
 * updated" without a word, which is what a screen read at 6am wants.
 */

import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

/** From the handoff: 150ms on cubic-bezier(.3, 1.6, .5, 1) — an easing that
 *  overshoots, so the value springs back rather than easing flatly. */
const DURATION = 150;
const PEAK = 1.05;
const EASING = Easing.bezier(0.3, 1.6, 0.5, 1);

/**
 * An animated style to spread onto a text whenever `value` changes.
 *
 * Snaps to the peak and settles back, rather than growing and shrinking: the
 * change has already happened, so the motion should report it, not perform it.
 */
export function usePulse(value: string | number) {
  const [scale] = useState(() => new Animated.Value(1));
  // Tracked in state rather than a ref so the first render does not pulse.
  const [previous, setPrevious] = useState(value);
  const changed = previous !== value;
  if (changed) setPrevious(value);

  useEffect(() => {
    scale.setValue(PEAK);
    const animation = Animated.timing(scale, {
      toValue: 1,
      duration: DURATION,
      easing: EASING,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // Runs on every change of the tracked value, and once on mount — where
    // starting from the peak is invisible because the screen is arriving anyway.
  }, [previous, scale]);

  return { transform: [{ scale }] };
}
