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
 * The handoff expresses this as `opacity: 0.42` on the whole row. That is a web
 * idiom, and on Android a group alpha over a card, its elevation shadow and its
 * text children composites badly — measured on a Pixel 8 it leaves a pale band,
 * exactly the height of the numeral's cap block, across an otherwise grey row.
 *
 * The same recession is expressed in colour instead: the card drops to the page
 * background so it stops reading as a raised surface, its shadow goes with it,
 * the text steps down to the secondary tone, and only the colour bar actually
 * fades — a leaf view with nothing behind it, where alpha is unambiguous. No
 * offscreen layers, and no platform divergence.
 */
const DONE_BAR_OPACITY = 0.42;
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
 * baseline; the real label is drawn over it. Two earlier attempts failed for
 * instructive reasons — hiding a nested "s" with `opacity` does nothing, because a
 * nested Text is a span rather than a view, and hiding it with `color:
 * 'transparent'` does nothing either on Android's text renderer.
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
 * A row that has been poured slides a little out of the way, as the handoff has
 * it. Transform only, so it runs on the native driver and never touches layout.
 *
 * Suppressed under Reduce Motion, where it is pure decoration: the strike-through
 * and the row's recession into the page already say the same thing, and neither
 * of them moves.
 */
function useDoneNudge(done: boolean, reduced: boolean) {
  const [offset] = useState(() => new Animated.Value(done && !reduced ? DONE_SHIFT : 0));
  useEffect(() => {
    const animation = Animated.timing(offset, {
      toValue: done && !reduced ? DONE_SHIFT : 0,
      duration: reduced ? 0 : DONE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [done, offset, reduced]);
  return { transform: [{ translateX: offset }] };
}

export function DoseRow({ line, done = false, onPress }: DoseRowProps) {
  const { colour, scheme } = useTheme();
  const { bar, edge } = resolveBarColour(line.component.colour, scheme);
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
  const tone = done ? 'secondary' : 'primary';
  const pulse = usePulse(amount);
  const nudge = useDoneNudge(done, reduced);

  const mark = () => {
    // A short tap you can feel. The brief's user is not looking at the screen
    // between bottles — they are counting drops into a jug in the dark.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <BarRow
      barColour={bar}
      barEdgeColour={edge}
      barOpacity={done ? DONE_BAR_OPACITY : 1}
      surfaceColour={done ? colour.background : undefined}
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
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, nudge]}>
        <View style={[{ flex: 1 }, title.capBoxPadding]}>
          <RowTitle tone={tone} style={done ? { textDecorationLine: 'line-through' } : undefined}>
            {line.component.name}
          </RowTitle>
          {alternative ? (
            <Caption tone="secondary">
              {formatDoseAmount(alternative.delivered, alternative.dispenser.step)}{' '}
              {formatUnit(alternative.dispenser.unit, alternative.delivered)}
            </Caption>
          ) : null}
        </View>
        <View style={[{ flexDirection: 'row', alignItems: 'baseline' }, value.capBoxPadding]}>
          <AnimatedAppText variant="doseValue" tone={tone} style={pulse}>
            {amount}
          </AnimatedAppText>
          <UnitColumn unit={line.dispenser.unit} count={line.delivered} />
        </View>
      </Animated.View>
    </BarRow>
  );
}
