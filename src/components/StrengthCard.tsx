/**
 * Strength: a share of every amount in the recipe, for lighter water.
 *
 * Any whole percent from 25 to 100. A drag sticks to the vendor's steps, with a
 * selection tick as it lands on one; the exact value is typed, in the same field
 * as the Water screen's.
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { View } from 'react-native';
import type { AccessibilityActionEvent, LayoutChangeEvent } from 'react-native';
import { Caption, Card, UnitLabel, space, useTheme, useTypeMetrics } from '@/design';
import {
  STRENGTH_MAX,
  STRENGTH_MIN,
  STRENGTH_STEPS,
  isStrengthStep,
  nextStrengthStep,
  parseStrength,
  snapStrength,
} from '@/engine/strength';
import { NumberField } from './NumberField';

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
  onStartTyping,
  onDragChange,
}: StrengthCardProps) {
  const { colour } = useTheme();
  const [width, setWidth] = useState(0);
  const [entry, setEntry] = useState<string | null>(null);
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
    const typed = entry === null ? null : parseStrength(entry);
    if (typed !== null) set(typed);
    setEntry(null);
  };

  // A control outside the card, such as the screen's footer, can close the screen
  // with the field still focused. What was typed is kept rather than lost with it.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    pending.current = entry;
  }, [entry]);
  const commitPending = useEffectEvent(() => {
    const typed = pending.current === null ? null : parseStrength(pending.current);
    if (typed !== null && typed !== last.current) onChange(typed);
  });
  useEffect(() => () => commitPending(), []);

  const onAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') set(nextStrengthStep(value, 1));
    if (event.nativeEvent.actionName === 'decrement') set(nextStrengthStep(value, -1));
  };

  const thumbX = xFor(value);

  return (
    <Card paddingVertical={space.cardV} paddingHorizontal={space.cardH}>
      <View style={{ gap: space.blocks }}>
        <NumberField
          role="doseValue"
          value={value}
          entry={entry}
          onEntryChange={setEntry}
          onStartEditing={onStartTyping}
          onEndEditing={commit}
          maxDigits={3}
          accent={accent}
          unit={<UnitLabel tone="secondary">%</UnitLabel>}
          squared
          accessibilityLabel={`Strength, ${value} percent`}
          accessibilityHint="Types an exact strength"
        />

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
    </Card>
  );
}
