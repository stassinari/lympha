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
import { styleForRole, typeScale } from './typography';
import type { TypeRole } from './typography';
import { useTheme } from './theme';
import { useTrackingInset } from './textMetrics';

export type Tone = 'primary' | 'secondary' | 'onCard' | 'warning' | 'error' | 'ok';

export type TextProps = Omit<RNTextProps, 'style'> & {
  tone?: Tone;
  style?: StyleProp<TextStyle>;
};

/**
 * How far the OS text-size setting may take a role, declared by the role itself.
 *
 * `undefined` is React Native's "no ceiling", which is what prose wants: at the
 * largest accessibility sizes a settings row should get tall and wrap, not stay
 * neat and unreadable. The geometric roles cap — see `maxScale` in the scale.
 */
const maxScaleFor = (variant: TypeRole) => typeScale[variant].maxScale;

/**
 * The resolved style for a role and tone, shared by the plain and animated texts.
 *
 * The right inset is applied here rather than at any call site, because the bug it
 * fixes is a property of the *role*, not of one screen: React Native puts a
 * letter-spacing gap after the final character, so every negatively-tracked role
 * measures narrower than its own ink and clips its last glyph — 2.9px of a 72px
 * `hero` digit, less at the smaller tracked roles.
 *
 * Padding, not a negative margin: the frame has to grow for the ink to survive.
 * Left-aligned text keeps its glyphs where they were. Right-aligned text moves
 * left by the inset, which ends its last glyph's advance at the box edge, where the
 * column's other figures end.
 */
function useTextStyle(variant: TypeRole, tone: Tone) {
  const { colour } = useTheme();
  const inset = useTrackingInset(variant);
  const colours: Record<Tone, string> = {
    primary: colour.text,
    secondary: colour.textSecondary,
    onCard: colour.textOnCard,
    warning: colour.textWarning,
    error: colour.error,
    ok: colour.ok,
  };
  return [
    styleForRole(variant),
    { color: colours[tone] },
    inset > 0 ? { paddingRight: inset } : null,
  ];
}

export function AppText({
  variant,
  tone = 'primary',
  style,
  ...rest
}: TextProps & { variant: TypeRole }) {
  return (
    <RNText
      maxFontSizeMultiplier={maxScaleFor(variant)}
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
      maxFontSizeMultiplier={maxScaleFor(variant)}
      style={[useTextStyle(variant, tone), style]}
      {...rest}
    />
  );
}

function variantComponent(variant: TypeRole, displayName: string, defaults?: Partial<RNTextProps>) {
  const Component = (props: TextProps) => <AppText variant={variant} {...defaults} {...props} />;
  Component.displayName = displayName;
  return Component;
}

/**
 * Screen titles and section headers are headings, and saying so is most of what
 * makes a screen navigable without sight: both VoiceOver's rotor and TalkBack's
 * reading controls offer heading-by-heading movement, which turns the settings
 * screen from twenty swipes into four.
 *
 * Set on the role rather than at each call site, because a `SectionHeader` that
 * is not a heading is a bug, not a variation.
 */
const HEADING: Partial<RNTextProps> = { accessibilityRole: 'header' };

/** Volume value on the volume screen. Numerals only. */
export const Hero = variantComponent('hero', 'Hero');
/** Volume value on the dose screen. Numerals only. */
export const Volume = variantComponent('volume', 'Volume');
/** Per-bottle dose. Numerals only. */
export const DoseValue = variantComponent('doseValue', 'DoseValue');
/** The Rounding headline when it is words. */
export const HeadlineWords = variantComponent('headlineWords', 'HeadlineWords');
export const ScreenTitle = variantComponent('screenTitle', 'ScreenTitle', HEADING);
export const RowTitle = variantComponent('rowTitle', 'RowTitle');
export const CardTitle = variantComponent('cardTitle', 'CardTitle');
export const Body = variantComponent('body', 'Body');
export const BodyRegular = variantComponent('bodyRegular', 'BodyRegular');
/** What the Rounding headline's figure quotes. */
export const HeadlineSubject = variantComponent('headlineSubject', 'HeadlineSubject');
/** A text-only control's label. Not pressable itself; it goes inside a `Touchable`. */
export const ActionText = variantComponent('action', 'ActionText');
export const Caption = variantComponent('caption', 'Caption');
export const SectionHeader = variantComponent('sectionHeader', 'SectionHeader', HEADING);
export const UnitLabel = variantComponent('unitLabel', 'UnitLabel');
export const VolumeUnit = variantComponent('volumeUnit', 'VolumeUnit');
export const CardLabel = variantComponent('cardLabel', 'CardLabel');
/** The app's name in the dose screen header. The one role not set in Nunito. */
export const Wordmark = variantComponent('wordmark', 'Wordmark');
