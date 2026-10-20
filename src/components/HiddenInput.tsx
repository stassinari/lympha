/**
 * The offscreen field that summons the system keypad, for a number drawn at
 * display size rather than in a text field.
 *
 * The system keypad keeps haptics, key repeat and accessibility that a bespoke
 * grid would lose. The field has to be laid out and focusable, so it cannot be
 * `display: none` or zero sized on both platforms — it is positioned off the edge
 * instead, at one point square. `caretHidden` stops a second cursor appearing
 * next to the drawn value.
 */

import { TextInput } from 'react-native';
import type { TextInputInstance } from 'react-native';

export type HiddenInputProps = {
  ref: React.RefObject<TextInputInstance | null>;
  value: string;
  /** Digits only, at most `maxDigits` of them. */
  onChange: (digits: string) => void;
  maxDigits: number;
  onBlur?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
};

export const HiddenInput = ({
  ref,
  value,
  onChange,
  maxDigits,
  onBlur,
  onFocus,
  autoFocus = false,
}: HiddenInputProps) => (
  <TextInput
    ref={ref}
    value={value}
    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, maxDigits))}
    onBlur={onBlur}
    onFocus={onFocus}
    keyboardType="number-pad"
    autoFocus={autoFocus}
    caretHidden
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{ position: 'absolute', left: -1000, width: 1, height: 1, opacity: 0 }}
  />
);
