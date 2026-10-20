/**
 * A number typed on the system keypad and drawn at display size.
 *
 * The keypad is the system's, not a bespoke grid: a custom grid adds maintenance
 * and loses haptics, key repeat and accessibility for nothing. Getting it without a
 * visible text field means an offscreen `TextInput` holding focus while the value
 * is drawn here — see `HiddenInput`.
 *
 * Three states. At rest a dotted underline marks the value as something to tap.
 * Focused and untouched, a selection band sits behind it instead: the first keystroke
 * replaces it. Once typing, a caret follows the last digit. Everything is placed from the type role's metrics, read at the
 * reader's text size, so the field looks the same on both platforms at any size.
 */

import { useEffect, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import { AppText, Touchable, space, useTheme, useTypeMetrics } from '@/design';
import type { TypeRole } from '@/design';
import { HiddenInput } from './HiddenInput';

const CARET_BLINK_MS = 550;

/**
 * The selection band behind an untouched value.
 *
 * The first keystroke replaces the value, but a caret parked after the last digit
 * is the universal cue for *insert here*, so it reads as "delete this, then type" —
 * the opposite of what the field does. A selection is the one cue that means
 * "type and this goes away", and it needs no words.
 *
 * ---
 *
 * Why it is a drawn view and not the Text's own background
 *
 * A `Text` background fills the *line box*, and a line box is never centred on its
 * marks. At `hero` — 72px Black digits in a 78px box — iOS leaves 1.03px above the
 * digits and 25.42px below, because it pins the space under the baseline to the
 * font's descent and digits have no descenders to fill it. Android splits the slack
 * and lands at 11.14/15.31, so a text background looks deliberate there and badly
 * low on iOS. No choice of line height fixes it: the descent belongs to the font.
 *
 * So the band is positioned from `capBlockBox` — the rect the digits actually
 * occupy — and is symmetric about them on both platforms by construction. It is
 * absolute, so it contributes nothing to layout: the value cannot be wrapped in a
 * View to carry a background, because the row is baseline-aligned and a View has no
 * text baseline (the trap `Caret` and `AnimatedAppText` both document).
 *
 * Its width is the one thing metrics cannot supply — it depends on how many digits
 * are on screen — so it is measured, and lands a frame after the digits.
 */
const SELECTION_ALPHA = '42';

/**
 * Proportions of the font size rather than px, so the band and caret stay in scale
 * at every role and when the reader turns their text size up. At `hero` the caret
 * is 3pt wide, 8pt clear of the digits.
 */
const SELECTION_PAD_X = 0.07;
const SELECTION_PAD_Y = 0.1;
const SELECTION_RADIUS = 0.06;
const CARET_WIDTH = 0.04;
const CARET_GAP = 0.11;

/**
 * The resting underline: dots, drawn rather than a text decoration. Android draws
 * every `textDecorationStyle` solid, and a decoration's position belongs to the
 * font, so it could not sit this close to the digits. Placed from the baseline,
 * like the band from the cap box, it lands the same on both platforms.
 */
const UNDERLINE_DOT = 0.05;
const UNDERLINE_GAP = 0.1;

/**
 * A caret bar that blinks in hard steps rather than fading, as a text cursor does.
 *
 * It is exactly as tall as the digits it sits beside — baseline to the top of the
 * numerals — and it is placed by baseline alignment rather than by centring. A
 * plain View has no text baseline, so Yoga aligns its *bottom* edge to the row's
 * baseline; a bar of cap height therefore spans precisely the same band as the
 * digits. That works out identically on both platforms without knowing anything
 * about how either distributes line-height slack, which centring does not: a
 * centred caret sits low on iOS.
 */
function Caret({
  colour,
  height,
  width,
  gap,
}: {
  colour: string;
  height: number;
  width: number;
  gap: number;
}) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setOn((v) => !v), CARET_BLINK_MS);
    return () => clearInterval(timer);
  }, []);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width,
        height,
        borderRadius: width / 2,
        marginLeft: gap,
        backgroundColor: on ? colour : 'transparent',
      }}
    />
  );
}

export type NumberFieldProps = {
  role: TypeRole;
  /** The committed value, shown until typing starts. */
  value: number;
  /** Digits typed since editing began; null until the first keystroke. */
  entry: string | null;
  onEntryChange: (entry: string | null) => void;
  /** Focus has gone, including Android hiding the keypad without a blur. */
  onEndEditing?: () => void;
  /** Called as the field takes focus. */
  onStartEditing?: () => void;
  maxDigits: number;
  /** Text-safe accent, resolved for the scheme, for the band and the caret. */
  accent: string;
  /** The unit, set in its own role by the caller. */
  unit: React.ReactNode;
  /** Anchors the unit to the row's end, so it holds still as digits arrive. */
  unitAtEnd?: boolean;
  /** Focused on arrival, for a screen that exists to take the number. */
  autoFocus?: boolean;
  accessibilityLabel: string;
  /** What a tap does while the value is at rest or being typed. */
  accessibilityHint: string;
};

export function NumberField({
  role,
  value,
  entry,
  onEntryChange,
  onEndEditing,
  onStartEditing,
  maxDigits,
  accent,
  unit,
  unitAtEnd = false,
  autoFocus = false,
  accessibilityLabel,
  accessibilityHint,
}: NumberFieldProps) {
  const metrics = useTypeMetrics(role);
  const inputRef = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(autoFocus);
  const [valueWidth, setValueWidth] = useState(0);

  // Android hides the keypad on its ✓ key and on Back without blurring the field.
  // Blurring it here keeps one path out of editing, and lets a tap summon the
  // keypad again: focusing a field that is already focused does nothing.
  useEffect(() => {
    if (!focused) return;
    const subscription = Keyboard.addListener('keyboardDidHide', () => inputRef.current?.blur());
    return () => subscription.remove();
  }, [focused]);

  /** Focused and untouched: the whole value stands in for itself and the next
   *  keystroke replaces it. Exactly the state a text selection describes. */
  const selected = focused && entry === null;
  const display = entry === null ? String(value) : entry === '' ? '0' : entry;
  const { colour } = useTheme();

  /**
   * The band and the underline, in the row's own coordinates. `capBlockBox` is
   * measured from the top of the value's line box, and the value is the tallest
   * thing in a baseline-aligned row, so its box top is the row's top. A container
   * spacing the field should measure to the digits with `inkInsets`, since each
   * platform leaves different slack around them.
   */
  const padX = metrics.fontSize * SELECTION_PAD_X;
  const padY = metrics.fontSize * SELECTION_PAD_Y;
  const band = {
    left: -padX,
    width: valueWidth + padX * 2,
    top: metrics.capBlockBox.top - padY,
    height: metrics.capBlockBox.height + padY * 2,
    borderRadius: metrics.fontSize * SELECTION_RADIUS,
    backgroundColor: `${accent}${SELECTION_ALPHA}`,
  };
  const baseline = metrics.capBlockBox.top + metrics.capBlockBox.height;
  const dot = Math.max(2, Math.round(metrics.fontSize * UNDERLINE_DOT));
  const dots = Math.max(0, Math.floor((valueWidth + dot) / (dot * 2)));

  return (
    <Touchable
      onPress={() => inputRef.current?.focus()}
      accessibilityLabel={accessibilityLabel}
      // The selection is a visual cue, so it is said out loud too — otherwise the
      // one group of users who cannot see it is also the group most likely to
      // assume they have to clear the field first.
      accessibilityHint={selected ? 'Typing replaces the current value' : accessibilityHint}
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        alignSelf: unitAtEnd ? 'stretch' : 'flex-start',
      }}
    >
      {/* First child, so it paints behind the digits. Absolute, so it is not part
          of the baseline row and cannot move anything. */}
      {selected && valueWidth > 0 ? <View style={{ position: 'absolute', ...band }} /> : null}
      {!focused && dots > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: baseline + metrics.fontSize * UNDERLINE_GAP,
            flexDirection: 'row',
            gap: dot,
          }}
        >
          {Array.from({ length: dots }, (_, i) => (
            <View
              key={i}
              style={{
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                backgroundColor: colour.textSecondary,
              }}
            />
          ))}
        </View>
      ) : null}
      <AppText variant={role} onLayout={(e) => setValueWidth(e.nativeEvent.layout.width)}>
        {display}
      </AppText>
      {/* Immediately after the digits, where the next one will appear. */}
      {focused && entry !== null ? (
        <Caret
          colour={accent}
          height={metrics.capHeight}
          width={metrics.fontSize * CARET_WIDTH}
          gap={metrics.fontSize * CARET_GAP}
        />
      ) : null}
      {/* A spacer rather than a wrapper: the unit has to stay a direct child of the
          baseline row to sit on the digits' baseline. */}
      <View style={unitAtEnd ? { flex: 1 } : { width: space.tight }} />
      {unit}

      <HiddenInput
        ref={inputRef}
        value={entry ?? ''}
        maxDigits={maxDigits}
        autoFocus={autoFocus}
        onChange={onEntryChange}
        onFocus={() => {
          setFocused(true);
          onStartEditing?.();
        }}
        onBlur={() => {
          setFocused(false);
          onEndEditing?.();
        }}
      />
    </Touchable>
  );
}
