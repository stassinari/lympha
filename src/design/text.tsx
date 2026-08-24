/**
 * Typography components.
 *
 * React Native has no cascade: a `Text` inherits nothing from the `View` around
 * it, and every one needs its own family, size, line height and tracking. Loose
 * style objects make that easy to get wrong in a hundred places, so each role in
 * the scale is a component and screens never set type properties directly.
 *
 * The prop is `variant`, not `role` — `role` is React Native's own accessibility
 * prop and must stay available to callers.
 */

import { Animated, Text as RNText } from 'react-native';
import type { StyleProp, TextProps as RNTextProps, TextStyle } from 'react-native';
import { styleForRole } from './typography';
import type { TypeRole } from './typography';
import { useTheme } from './theme';

export type Tone = 'primary' | 'secondary' | 'onCard' | 'warning' | 'ok';

export type TextProps = Omit<RNTextProps, 'style'> & {
  tone?: Tone;
  style?: StyleProp<TextStyle>;
};

/**
 * Display variants are sized to fit a specific layout, so unlimited text scaling
 * would break them. Prose scales freely; a fuller dynamic-type pass is Slice 12.
 */
const DISPLAY_VARIANTS: ReadonlySet<TypeRole> = new Set<TypeRole>(['hero', 'volume', 'doseValue']);

/** The resolved style for a role and tone, shared by the plain and animated texts. */
function useTextStyle(variant: TypeRole, tone: Tone) {
  const { colour } = useTheme();
  const colours: Record<Tone, string> = {
    primary: colour.text,
    secondary: colour.textSecondary,
    onCard: colour.textOnCard,
    warning: colour.textWarning,
    ok: colour.ok,
  };
  return [styleForRole(variant), { color: colours[tone] }];
}

export function AppText({
  variant,
  tone = 'primary',
  style,
  ...rest
}: TextProps & { variant: TypeRole }) {
  return (
    <RNText
      maxFontSizeMultiplier={DISPLAY_VARIANTS.has(variant) ? 1.3 : undefined}
      style={[useTextStyle(variant, tone), style]}
      {...rest}
    />
  );
}

const AnimatedRNText = Animated.createAnimatedComponent(RNText);

/**
 * The same text, animatable.
 *
 * A `Text` rather than a `Text` inside an `Animated.View`, because a view has no
 * text baseline — Yoga aligns its bottom edge instead — and every display number
 * in this app sits in a baseline-aligned row beside its unit. Wrapping would move
 * the unit; transforming the text itself does not touch layout at all.
 */
export function AnimatedAppText({
  variant,
  tone = 'primary',
  style,
  ...rest
}: Omit<TextProps, 'style'> & {
  variant: TypeRole;
  style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
}) {
  return (
    <AnimatedRNText
      maxFontSizeMultiplier={DISPLAY_VARIANTS.has(variant) ? 1.3 : undefined}
      style={[useTextStyle(variant, tone), style]}
      {...rest}
    />
  );
}

function variantComponent(variant: TypeRole, displayName: string) {
  const Component = (props: TextProps) => <AppText variant={variant} {...props} />;
  Component.displayName = displayName;
  return Component;
}

/** Volume value on the volume screen. Numerals only. */
export const Hero = variantComponent('hero', 'Hero');
/** Volume value on the dose screen. Numerals only. */
export const Volume = variantComponent('volume', 'Volume');
/** Per-bottle dose. Numerals only. */
export const DoseValue = variantComponent('doseValue', 'DoseValue');
export const ScreenTitle = variantComponent('screenTitle', 'ScreenTitle');
export const RowTitle = variantComponent('rowTitle', 'RowTitle');
export const CardTitle = variantComponent('cardTitle', 'CardTitle');
export const Body = variantComponent('body', 'Body');
export const Caption = variantComponent('caption', 'Caption');
export const SectionHeader = variantComponent('sectionHeader', 'SectionHeader');
export const UnitLabel = variantComponent('unitLabel', 'UnitLabel');
export const VolumeUnit = variantComponent('volumeUnit', 'VolumeUnit');
export const CardLabel = variantComponent('cardLabel', 'CardLabel');
