/**
 * Press feedback, which is the main thing that differs between the platforms.
 *
 * Note the Android ripple is *not* clipped by this component. `overflow: 'hidden'`
 * bounds a view's children, and the ripple is the view's own background drawable,
 * so it needs a clipping parent. Every rounded caller supplies one — see `Card`.
 *
 * The handoff keeps one visual language across iOS and Android and varies only
 * mechanics: iOS dims on press, Android draws a Material ripple.
 */

import { Platform, Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export type TouchableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Corner radius, so the Android ripple is clipped to the same shape. */
  radius?: number;
  /**
   * A bare icon with no surface of its own — a back chevron, the settings glyph.
   *
   * Material draws these with an unbounded ripple that spills past the icon
   * rather than a rectangle around its padding box, which is what an
   * `overflow: hidden` wrapper would give and what looks like a mistake on a
   * transparent header.
   */
  borderless?: boolean;
  /**
   * Dim on press on Android too, instead of the ripple.
   *
   * For a control that is a *region* rather than an object: the dose screen's
   * footer is a full-width tap target with no card, border or resting background
   * of its own. Material's ripple belongs to a surface — bounded, it draws a
   * rectangle where the design says there is nothing, and borderless it spills
   * the width of the screen. Neither reads as feedback, so this one takes the dim
   * on both platforms. Deliberately narrow: anything with a surface keeps the
   * ripple.
   */
  pressDim?: boolean;
  children?: React.ReactNode;
};

/** Ripple and press-dim are drawn from the text colour so they read on either scheme. */
const RIPPLE_ALPHA = '22';
const PRESSED_OPACITY = 0.62;

export function Touchable({
  style,
  radius,
  borderless,
  pressDim,
  disabled,
  // Defaulted here rather than on the element, because a caller that forwards an
  // optional role passes `undefined` explicitly — and a later spread of
  // `undefined` overrides an earlier default, which would silently leave the
  // control with no role at all.
  accessibilityRole = 'button',
  ...rest
}: TouchableProps) {
  const { colour } = useTheme();

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      disabled={disabled}
      android_ripple={
        Platform.OS === 'android' && !pressDim
          ? { color: `${colour.text}${RIPPLE_ALPHA}`, foreground: false, borderless: !!borderless }
          : undefined
      }
      style={({ pressed }) => [
        radius !== undefined ? { borderRadius: radius, overflow: 'hidden' } : null,
        style,
        // Android gets the ripple instead; dimming as well would double up. Unless
        // it has been given no ripple to get — see `pressDim`.
        pressed && (pressDim || Platform.OS !== 'android') ? { opacity: PRESSED_OPACITY } : null,
        disabled ? { opacity: 0.4 } : null,
      ]}
      {...rest}
    />
  );
}
