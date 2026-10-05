/**
 * Whether the platform has been asked to reduce motion.
 *
 * A vestibular accommodation. Every navigation in the app is a full-screen slide
 * and every changing number pulses in scale — exactly the movement the setting
 * exists to suppress.
 *
 * Suppressed does not mean removed. A transition still has to say "you have
 * arrived somewhere else", so the slide becomes a cross-fade rather than a cut —
 * opacity carries no implied movement through space, which is the part that
 * makes people ill. What goes entirely is decoration: the pulse, the withdrawal
 * of the covered screen, the row's little shove to one side.
 *
 * One subscription for the whole app rather than one per animated component,
 * read through `useSyncExternalStore` so the value is synchronous at render —
 * the same shape the store's hydration flag uses.
 */

import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

let reduced = false;
let subscription: { remove: () => void } | null = null;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (next === reduced) return;
  reduced = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!subscription) {
    subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', set);
    // The initial read is async on both platforms; until it lands the app
    // animates, which is the right default for the overwhelming majority.
    AccessibilityInfo.isReduceMotionEnabled()
      .then(set)
      .catch(() => {});
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      subscription?.remove();
      subscription = null;
    }
  };
}

export const useReduceMotion = () => useSyncExternalStore(subscribe, () => reduced);
