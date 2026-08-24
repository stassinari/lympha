/**
 * The shared clock for a screen transition.
 *
 * The overlay and the screen it covers have to move together — one slides in
 * while the other recedes — so they read a single progress value rather than
 * running two animations and hoping they stay in step.
 */

import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useReduceMotion } from '../motion';

export type OverlayDirection = 'right' | 'top' | 'bottom';

/** From the handoff: 380–400ms on cubic-bezier(.22, 1, .36, 1). */
export const TRANSITION_MS = 380;
export const TRANSITION_EASING = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * Reduce Motion replaces the slide with a cross-fade rather than removing the
 * transition. A cut leaves you nowhere — you have to work out that the screen
 * changed — while a fade marks the change without implying travel through space,
 * which is the part the setting is actually about. Shorter, because there is no
 * distance left to cover.
 */
const REDUCED_MS = 200;

/**
 * The underlying screen fades over 240ms against the slide's 380ms. One value
 * drives both, so the fade finishes early by ending its interpolation partway.
 */
const FADE_FRACTION = 240 / TRANSITION_MS;

/** How far the covered screen withdraws, and how far down it settles. */
const UNDERLAY_SHIFT = { right: 16, top: 14, bottom: 14 };
const UNDERLAY_SCALE = 0.97;
const UNDERLAY_OPACITY = 0.4;

export function useOverlayTransition(visible: boolean) {
  const reduced = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));

  // Mount on the render that opens it, so the entrance starts offscreen rather
  // than a frame late.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduced ? REDUCED_MS : TRANSITION_MS,
      easing: reduced ? Easing.linear : TRANSITION_EASING,
      useNativeDriver: true,
    });
    // Stays mounted until the exit finishes, rather than vanishing on the frame
    // the flag flips.
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, progress, reduced]);

  return { progress, mounted };
}

/** The incoming screen's transform: offscreen in the trigger's direction, to rest. */
export function overlayStyle(
  progress: Animated.Value,
  from: OverlayDirection,
  window: { width: number; height: number },
  reduced = false,
) {
  if (reduced) return { opacity: progress };

  const horizontal = from === 'right';
  const travel = (horizontal ? window.width : window.height) * (from === 'top' ? -1 : 1);
  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [travel, 0] });
  return horizontal
    ? { transform: [{ translateX: offset }] }
    : { transform: [{ translateY: offset }] };
}

/**
 * The covered screen's answer: a short withdrawal along the same axis, away from
 * where the new screen is coming from, so the two read as one movement.
 */
export function underlayStyle(progress: Animated.Value, from: OverlayDirection, reduced = false) {
  // Nothing withdraws under Reduce Motion — the covered screen simply dims out
  // behind the arriving one, and the scale that reads as depth is the exact
  // effect being asked for less of.
  if (reduced) {
    return {
      opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, UNDERLAY_OPACITY] }),
      transform: [],
    };
  }

  const shift = UNDERLAY_SHIFT[from];
  // Recipe drops from the top, so the screen beneath sinks; settings rises, so it
  // lifts; volume comes from the right, so it slides left.
  const distance = from === 'right' ? -shift : from === 'top' ? shift : -shift;

  const translate = progress.interpolate({ inputRange: [0, 1], outputRange: [0, distance] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, UNDERLAY_SCALE] });
  const opacity = progress.interpolate({
    inputRange: [0, FADE_FRACTION, 1],
    outputRange: [1, UNDERLAY_OPACITY, UNDERLAY_OPACITY],
  });

  return {
    opacity,
    transform: [
      from === 'right' ? { translateX: translate } : { translateY: translate },
      { scale },
    ],
  };
}
