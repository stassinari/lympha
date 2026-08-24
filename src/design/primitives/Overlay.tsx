/**
 * A full-screen layer that enters from the direction of the control that opened it.
 *
 * The governing motion rule in the handoff: the brand-and-recipe screen drops from
 * the top because its trigger is the header, the volume screen pushes in from the
 * right because Edit sits mid-screen, settings rises from the bottom. The screen
 * appears to come from the thing you touched.
 *
 * Two ways in. `Overlay` runs its own transition, which suits a nested layer with
 * nothing behind it worth moving. A screen that covers another uses
 * `useOverlayTransition` directly and pairs `OverlayLayer` with `Underlay`, so both
 * halves read the same progress value.
 */

import { useEffect } from 'react';
import { Animated, BackHandler, Platform, useWindowDimensions } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useReduceMotion } from '../motion';
import { useTheme } from '../theme';
import { overlayStyle, underlayStyle, useOverlayTransition } from './overlayTransition';
import type { OverlayDirection } from './overlayTransition';

/** Android's back gesture and button close a layer, as the platform expects. */
export function useAndroidBack(active: boolean, onBack: () => void) {
  useEffect(() => {
    if (!active || Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [active, onBack]);
}

export function OverlayLayer({
  progress,
  from,
  children,
  style,
  /**
   * Whether this layer currently owns the screen reader.
   *
   * Visually a layer covers what is beneath it; to VoiceOver and TalkBack it does
   * not, and swiping past the last control on the settings screen walks straight
   * into the dose screen underneath it. `accessibilityViewIsModal` is iOS's flag
   * for exactly this, and it also moves VoiceOver's focus into the layer as it
   * arrives, so the announcement follows the navigation. Android has no
   * equivalent, and is handled from the other side — see `Underlay`.
   *
   * Dropped as the layer starts to leave, so focus returns to the screen behind
   * rather than being stranded on a view that is on its way out.
   */
  modal = true,
}: {
  progress: Animated.Value;
  from: OverlayDirection;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  modal?: boolean;
}) {
  const { colour } = useTheme();
  const window = useWindowDimensions();
  const reduced = useReduceMotion();

  return (
    <Animated.View
      accessibilityViewIsModal={modal}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colour.background,
        },
        overlayStyle(progress, from, window, reduced),
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** The screen being covered, withdrawing along the same axis. */
export function Underlay({
  progress,
  from,
  children,
  /**
   * Taken out of the accessibility tree while something covers it.
   *
   * This is the Android half of the modality above: TalkBack has no notion of a
   * modal view, so the covered screen has to be hidden explicitly or it stays
   * reachable by swipe. Both props are set because they are the same idea under
   * two names — `accessibilityElementsHidden` is iOS, `importantForAccessibility`
   * is Android — and neither platform reads the other's.
   *
   * Tied to the flag that opens the overlay rather than to the animation, so the
   * screen becomes reachable again the moment the way back has been asked for.
   */
  hidden = false,
}: {
  progress: Animated.Value;
  from: OverlayDirection;
  children: React.ReactNode;
  hidden?: boolean;
}) {
  const reduced = useReduceMotion();

  return (
    <Animated.View
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      style={[{ flex: 1 }, underlayStyle(progress, from, reduced)]}
    >
      {children}
    </Animated.View>
  );
}

export type OverlayProps = {
  visible: boolean;
  from: OverlayDirection;
  onRequestClose: () => void;
  children: React.ReactNode;
};

export function Overlay({ visible, from, onRequestClose, children }: OverlayProps) {
  const { progress, mounted } = useOverlayTransition(visible);
  useAndroidBack(visible, onRequestClose);

  if (!mounted) return null;
  return (
    <OverlayLayer progress={progress} from={from} modal={visible}>
      {children}
    </OverlayLayer>
  );
}
