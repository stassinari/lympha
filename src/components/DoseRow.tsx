/**
 * One bottle, one number.
 *
 * The value and its unit share a baseline; the name is optically centred against
 * the value rather than sharing that baseline. Baseline-aligning them looks
 * wrong — the platforms distribute line-height slack differently and neither puts
 * a text box on its own marks, so a 40px numeral and a 20px name never line up by
 * accident. `capBoxPadding` squares both boxes about their cap blocks so plain
 * centring aligns what the eye actually sees.
 */

import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  AnimatedAppText,
  BarRow,
  Caption,
  RowTitle,
  UnitLabel,
  useReduceMotion,
  usePulse,
  opticalPadding,
  resolveBarColour,
  space,
  useTheme,
  useTypeMetrics,
} from '@/design';
import { formatDoseAmount, formatUnit } from '@/format/units';
import type { DoseUnit } from '@/data/types';
import type { DoseLine } from '@/engine';

/**
 * A row marked as added recedes rather than disappearing, so the list keeps its
 * shape and you can still see what you poured.
 *
 * Not a group alpha on the whole row, as `docs/designs/v1` draws it: on Android a
 * group alpha over a card, its elevation shadow and its text children composites
 * badly, leaving a pale band the height of the numeral's cap block across an
 * otherwise grey row. The recession is three separate things, none of which is a
 * group alpha over a shadow:
 *
 *   - **The surface drops to the chip tone**, and the shadow goes with it. The
 *     chip tone is the app's sunken surface — darker than the card in light,
 *     lighter in dark, 1.20 against it either way — so the row visibly stops being
 *     raised without ceasing to be a row. The page background is only 1.06 against
 *     the card, so a row in that tone reads as *deleted* rather than done.
 *   - **The content dims to 62%.** Alpha on the content wrapper alone is safe: the
 *     layer holds text over an opaque parent, with no elevation inside it to
 *     composite against.
 *   - **The bar fades**, a leaf view with nothing behind it, where alpha is
 *     unambiguous.
 *
 * Geometry does not change at all — same height, same padding, same 12px bar at full
 * width, no inset and no scale. A list that reflows as you tick it loses the shape
 * you were reading.
 */
const DONE_BAR_OPACITY = 0.42;
const DONE_CONTENT_OPACITY = 0.62;
const DONE_SHIFT = 6;
const DONE_MS = 280;

/** Generous enough that no unit label wraps; it is left-aligned, so the unused
 *  remainder is never drawn. */
const UNIT_OVERLAY_WIDTH = 200;

export type DoseRowProps = {
  line: DoseLine;
  /** Marked off as poured. Changing volume, brand or recipe clears these. */
  done?: boolean;
  onPress?: () => void;
};

/**
 * The unit, always occupying the width of its longest form.
 *
 * The value and unit are right-aligned as a pair, so a wider unit pushes the
 * numeral left: "2 drops" and "1 drop" put their digits at different x, and a
 * column of doses reads ragged for no reason.
 *
 * The plural is laid out invisibly to fix the column's width and give the row its
 * baseline; the real label is drawn over it. Hiding a nested "s" instead does not
 * work: `opacity` on a nested Text does nothing, because it is a span rather than
 * a view, and `color: 'transparent'` does nothing on Android's text renderer.
 *
 * The explicit width on the overlay is what stops it wrapping: left to inherit the
 * sizer's width it measures a fraction of a pixel wider than the identical string
 * beneath it, and wraps or truncates its last letter. It is left-aligned, so the
 * surplus is never drawn.
 */
function UnitColumn({ unit, count }: { unit: DoseUnit; count: number }) {
  const widest = formatUnit(unit, 2);

  return (
    <View style={{ marginLeft: 6 }}>
      <UnitLabel tone="secondary" style={{ opacity: 0 }}>
        {widest}
      </UnitLabel>
      <UnitLabel
        tone="secondary"
        style={{ position: 'absolute', left: 0, top: 0, width: UNIT_OVERLAY_WIDTH }}
      >
        {formatUnit(unit, count)}
      </UnitLabel>
    </View>
  );
}

/**
 * A row that has been poured dims, and slides a little out of the way as the handoff
 * has it. Transform and opacity only, so both run on the native driver and neither
 * touches layout.
 *
 * One progress value drives both, so they cannot drift apart. The *slide* is
 * suppressed under Reduce Motion, where it is pure decoration — the strike-through,
 * the dim and the row's drop to the sunken tone all say the same thing without
 * moving. The dim is not suppressed: it is a state, not a motion, and at zero
 * duration it simply arrives without a transition.
 */
function useDoneRecession(done: boolean, reduced: boolean) {
  const [progress] = useState(() => new Animated.Value(done ? 1 : 0));
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: done ? 1 : 0,
      duration: reduced ? 0 : DONE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [done, progress, reduced]);

  return {
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, DONE_CONTENT_OPACITY],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, reduced ? 0 : DONE_SHIFT],
        }),
      },
    ],
  };
}

export function DoseRow({ line, done = false, onPress }: DoseRowProps) {
  const { colour, scheme } = useTheme();
  const { bar } = resolveBarColour(line.component.colour, scheme);
  const reduced = useReduceMotion();

  /**
   * Both columns squared about their cap blocks, so `alignItems: 'center'` lands,
   * and both read at the reader's text size rather than the nominal one — the
   * optical centring is only centred if the numbers behind it grew with the type.
   */
  const value = useTypeMetrics('doseValue');
  const title = useTypeMetrics('rowTitle');

  // Once the value box is squared its slack is the same on both sides, so the
  // row's own padding is measured against that rather than the raw line box.
  const rowPadding = opticalPadding(
    { top: space.rowInk, bottom: space.rowInk },
    { top: value.capBoxInset, bottom: value.capBoxInset },
  );

  const amount = formatDoseAmount(line.delivered, line.dispenser.step);
  const unit = formatUnit(line.dispenser.unit, line.delivered);
  const alternative = line.alternative;
  const pulse = usePulse(amount);
  const recession = useDoneRecession(done, reduced);

  const mark = () => {
    // A short tap you can feel. Between bottles the user is not looking at the
    // screen — they are counting drops into a jug in the dark.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <BarRow
      barColour={bar}
      barOpacity={done ? DONE_BAR_OPACITY : 1}
      surfaceColour={done ? colour.control : undefined}
      elevated={!done}
      onPress={onPress ? mark : undefined}
      paddingVertical={0}
      paddingHorizontal={space.cardH}
      contentStyle={rowPadding}
      // A checkbox, not a button: the row's job is to record that this bottle has
      // gone in, and "checked" is the state a screen reader has a word for. The
      // strike-through says the same thing to everyone else.
      accessibilityRole="checkbox"
      accessibilityLabel={`${line.component.name}, ${amount} ${unit}`}
      accessibilityHint={done ? 'Mark as not added' : 'Mark as added'}
      accessibilityState={{ checked: done }}
    >
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, recession]}>
        <View style={[{ flex: 1 }, title.capBoxPadding]}>
          <RowTitle style={done ? { textDecorationLine: 'line-through' } : undefined}>
            {line.component.name}
          </RowTitle>
          {alternative ? (
            /* The dim is carried by the wrapper, so a done row must not also step
               its text down a tone: secondary at 62% lands near 2.2:1, and this is
               the one line in the row small enough for that to matter. */
            <Caption tone={done ? 'primary' : 'secondary'}>
              {formatDoseAmount(alternative.delivered, alternative.dispenser.step)}{' '}
              {formatUnit(alternative.dispenser.unit, alternative.delivered)}
            </Caption>
          ) : null}
        </View>
        <View style={[{ flexDirection: 'row', alignItems: 'baseline' }, value.capBoxPadding]}>
          <AnimatedAppText variant="doseValue" style={pulse}>
            {amount}
          </AnimatedAppText>
          <UnitColumn unit={line.dispenser.unit} count={line.delivered} />
        </View>
      </Animated.View>
    </BarRow>
  );
}
