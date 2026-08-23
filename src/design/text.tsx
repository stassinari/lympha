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

import { Text as RNText } from 'react-native';
import type { StyleProp, TextProps as RNTextProps, TextStyle } from 'react-native';
import { typeScale } from './typography';
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

export function AppText({
  variant,
  tone = 'primary',
  style,
  ...rest
}: TextProps & { variant: TypeRole }) {
  const { colour } = useTheme();
  // `weight` and `extent` are metric metadata for layout, not RN style props;
  // spreading them into a style would be silently ignored at best.
  const { weight: _weight, extent: _extent, ...typeStyle } = typeScale[variant];

  const colours: Record<Tone, string> = {
    primary: colour.text,
    secondary: colour.textSecondary,
    onCard: colour.textOnCard,
    warning: colour.textWarning,
    ok: colour.ok,
  };

  return (
    <RNText
      maxFontSizeMultiplier={DISPLAY_VARIANTS.has(variant) ? 1.3 : undefined}
      style={[typeStyle, { color: colours[tone] }, style]}
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
