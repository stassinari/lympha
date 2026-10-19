/**
 * Strength: a share of every amount in the recipe, for lighter water.
 *
 * Any whole percent from 25 to 100. A drag sticks to the vendor's steps, with a
 * selection tick as it lands on one; the exact value is typed on the key, which
 * summons the system keypad like the Water screen does.
 *
 * Built for reuse: the vendor whose steps these are is a prop, not a constant.
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import type { AccessibilityActionEvent, LayoutChangeEvent, TextInputInstance } from 'react-native';
import {
  Caption,
  Card,
  DoseValue,
  Touchable,
  UnitLabel,
  radius,
  space,
  useTheme,
  useTypeMetrics,
} from '@/design';
import {
  STRENGTH_MAX,
  STRENGTH_MIN,
  STRENGTH_STEPS,
  isStrengthStep,
  nextStrengthStep,
  parseStrength,
  snapStrength,
} from '@/engine/strength';
import { HiddenInput } from './HiddenInput';

/** Half the thumb: its centre stops this far in from each end of the rail. */
const INSET = 14;
const THUMB = 28;
const RAIL = 8;
const DOT = 4;
const LABEL_WIDTH = 44;

export type StrengthCardProps = {
  value: number;
  onChange: (pct: number) => void;
  /** Text-safe accent, resolved for the scheme. */
  accent: string;
  /** Whose steps the marks are, for the note: "Apax Lab". */
  stepsOf: string;
  /** Called as typing starts, so the screen can bring the card above the keyboard. */
  onStartTyping?: () => void;
  /**
   * A drag starting and ending. On iOS an enclosing scroll view can take a touch
   * that moves vertically past its slop, so a screen that scrolls stops scrolling
   * for the length of a drag. Android is handled inside, at the grant.
   */
  onDragChange?: (dragging: boolean) => void;
};

export function StrengthCard({
  value,
  onChange,
  accent,
  stepsOf,
  onStartTyping,
  onDragChange,
}: StrengthCardProps) {
  const { colour } = useTheme();
  const [width, setWidth] = useState(0);
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<TextInputInstance>(null);
  const caption = useTypeMetrics('caption');
  // The track's left edge on screen, for the length of a drag.
  const trackLeft = useRef(0);
  // The last value sent, so a burst of move events between renders ticks once.
  const last = useRef(value);
  useEffect(() => {
    last.current = value;
  }, [value]);

  /** Where a percentage sits on the track, in the track's own coordinates. */
  const xFor = (pct: number) =>
    INSET + ((pct - STRENGTH_MIN) / (STRENGTH_MAX - STRENGTH_MIN)) * Math.max(0, width - INSET * 2);

  const set = (pct: number) => {
    if (pct === last.current) return;
    if (isStrengthStep(pct)) void Haptics.selectionAsync();
    last.current = pct;
    onChange(pct);
  };

  const fromX = (x: number) => {
    const span = width - INSET * 2;
    if (span <= 0) return;
    set(snapStrength(STRENGTH_MIN + ((x - INSET) / span) * (STRENGTH_MAX - STRENGTH_MIN)));
  };

  const commit = () => {
    const typed = draft === null ? null : parseStrength(draft);
    if (typed !== null) set(typed);
    setDraft(null);
  };

  // Blur alone is not enough: Android hides the keypad on its ✓ key and on Back
  // without blurring the field, which would leave the card mid-edit.
  const onKeyboardHide = useEffectEvent(commit);
  const editing = draft !== null;
  useEffect(() => {
    if (!editing) return;
    const subscription = Keyboard.addListener('keyboardDidHide', onKeyboardHide);
    return () => subscription.remove();
  }, [editing]);

  // Nor are blur and the keypad: a control outside the card, such as the screen's
  // footer, can close the screen with the field still focused. What was typed is
  // kept rather than lost with the card.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    pending.current = draft;
  }, [draft]);
  const commitPending = useEffectEvent(() => {
    const typed = pending.current === null ? null : parseStrength(pending.current);
    if (typed !== null && typed !== last.current) onChange(typed);
  });
  useEffect(() => () => commitPending(), []);

  const onAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') set(nextStrengthStep(value, 1));
    if (event.nativeEvent.actionName === 'decrement') set(nextStrengthStep(value, -1));
  };

  const note =
    value === 100
      ? 'Full strength'
      : isStrengthStep(value)
        ? `One of ${stepsOf}’s steps`
        : `Between ${stepsOf}’s steps`;

  const thumbX = xFor(value);

  return (
    <Card paddingVertical={space.cardV} paddingHorizontal={space.cardH}>
      <View style={{ gap: space.blocks }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.blocks }}>
          {/* The page colour on the card is what makes this read as a key. */}
          <Touchable
            radius={radius.key}
            onPress={() => {
              setDraft('');
              onStartTyping?.();
            }}
            accessibilityLabel={`Strength, ${value} percent`}
            accessibilityHint="Types an exact strength"
            style={{
              backgroundColor: colour.background,
              minHeight: 44,
              minWidth: 76,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'flex-end',
              gap: 3,
            }}
          >
            <DoseValue style={draft === null ? undefined : { color: accent }}>
              {draft === null || draft === '' ? String(value) : draft}
            </DoseValue>
            <UnitLabel tone="secondary">%</UnitLabel>
          </Touchable>
          <Caption tone="secondary" style={{ flex: 1, textAlign: 'right' }}>
            {note}
          </Caption>
        </View>

        <View style={{ gap: space.snug }}>
          {/* Children ignore touches, so the grant is in the track's own coordinates.
              `locationX` is relative to whatever is under the finger, so moves are
              read from `pageX` against the track's left edge, found at the grant. */}
          <View
            onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Strength"
            accessibilityValue={{
              min: STRENGTH_MIN,
              max: STRENGTH_MAX,
              now: value,
              text: `${value} percent`,
            }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={onAction}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            // Refuses other JS responders. Returning true from the grant blocks native
            // ones on Android, so an enclosing scroller cannot intercept the drag;
            // `onDragChange` lets the screen hold off its scroller on iOS.
            onResponderTerminationRequest={() => false}
            onResponderGrant={(e) => {
              onDragChange?.(true);
              trackLeft.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
              fromX(e.nativeEvent.locationX);
              return true;
            }}
            // The release carries where the finger came to rest, which the last move
            // may not have reached.
            onResponderRelease={(e) => {
              fromX(e.nativeEvent.pageX - trackLeft.current);
              onDragChange?.(false);
            }}
            onResponderTerminate={() => onDragChange?.(false)}
            onResponderMove={(e) => fromX(e.nativeEvent.pageX - trackLeft.current)}
            style={{ height: 44, justifyContent: 'center' }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: RAIL,
                borderRadius: RAIL / 2,
                backgroundColor: colour.control,
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                width: thumbX,
                height: RAIL,
                borderRadius: RAIL / 2,
                backgroundColor: accent,
              }}
            />
            {STRENGTH_STEPS.slice(1, -1).map((step) => (
              <View
                key={step}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: xFor(step) - DOT / 2,
                  width: DOT,
                  height: DOT,
                  borderRadius: DOT / 2,
                  backgroundColor: step <= value ? colour.card : colour.textSecondary,
                }}
              />
            ))}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: thumbX - THUMB / 2,
                width: THUMB,
                height: THUMB,
                borderRadius: THUMB / 2,
                backgroundColor: colour.card,
                borderWidth: 3,
                borderColor: accent,
              }}
            />
          </View>

          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ height: caption.lineHeight }}
          >
            {STRENGTH_STEPS.map((step) => (
              <Caption
                key={step}
                tone={step === value ? 'primary' : 'secondary'}
                style={{
                  position: 'absolute',
                  left: xFor(step) - LABEL_WIDTH / 2,
                  width: LABEL_WIDTH,
                  textAlign: 'center',
                }}
              >
                {String(step)}
              </Caption>
            ))}
          </View>
        </View>
      </View>

      {draft === null ? null : (
        <HiddenInput
          ref={inputRef}
          value={draft}
          onChange={setDraft}
          maxDigits={3}
          onBlur={commit}
        />
      )}
    </Card>
  );
}
