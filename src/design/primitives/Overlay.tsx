/**
 * A full-screen layer that enters from the direction of the control that opened it.
 *
 * The governing motion rule in the handoff: the brand-and-recipe screen drops from
 * the top because its trigger is the header, the volume screen pushes in from the
 * right because Edit sits mid-screen, settings rises from the bottom. The screen
 * appears to come from the thing you touched.
 *
 * Built on React Native's own `Animated` rather than Reanimated. A slide is a
 * transform, which runs on the native driver here with no extra dependency and no
 * babel configuration. Slice 11 revisits that with the full motion spec in hand.
 */

import { useEffect, useState } from 'react';
import { Animated, BackHandler, Dimensions, Easing, Platform, View } from 'react-native';
import { useTheme } from '../theme';

export type OverlayDirection = 'right' | 'top' | 'bottom';

/** From the handoff: 380–400ms on cubic-bezier(.22, 1, .36, 1). */
const DURATION = 380;
const EASING = Easing.bezier(0.22, 1, 0.36, 1);

export type OverlayProps = {
  visible: boolean;
  from: OverlayDirection;
  onRequestClose: () => void;
  children: React.ReactNode;
};

export function Overlay({ visible, from, onRequestClose, children }: OverlayProps) {
  const { colour } = useTheme();
  // Lazy state rather than a ref: the value is read while rendering the transform,
  // and a ref read during render is not safe under concurrent rendering.
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));

  // Mount on the render that opens it, so the entrance animates from offscreen
  // rather than starting a frame late.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: DURATION,
      easing: EASING,
      useNativeDriver: true,
    });
    // Stays mounted until the exit finishes, so it animates out instead of
    // vanishing on the frame the flag flips.
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, progress]);

  // Android's back gesture and button close the layer, matching the platform's
  // expectation that back means "up one level" rather than "leave the app".
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onRequestClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onRequestClose]);

  if (!mounted) return null;

  const { width, height } = Dimensions.get('window');
  const horizontal = from === 'right';
  const travel = (horizontal ? width : height) * (from === 'top' ? -1 : 1);
  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [travel, 0] });

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
        horizontal
          ? { transform: [{ translateX: offset }] }
          : { transform: [{ translateY: offset }] },
      ]}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}
