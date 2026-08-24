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
}: {
  progress: Animated.Value;
  from: OverlayDirection;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colour } = useTheme();
  const window = useWindowDimensions();

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colour.background,
        },
        overlayStyle(progress, from, window),
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
}: {
  progress: Animated.Value;
  from: OverlayDirection;
  children: React.ReactNode;
}) {
  return (
    <Animated.View style={[{ flex: 1 }, underlayStyle(progress, from)]}>{children}</Animated.View>
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
    <OverlayLayer progress={progress} from={from}>
      {children}
    </OverlayLayer>
  );
}
