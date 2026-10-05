/**
 * Enter or pick the water volume.
 *
 * The highest-frequency interaction in the app, and the one that deserves the
 * most attention.
 *
 * The keypad is the **system** numeric keyboard, not a bespoke grid: a custom
 * grid adds maintenance and loses haptics, key repeat and accessibility for
 * nothing. Getting the system keyboard
 * without a visible text field means an offscreen `TextInput` holding focus while
 * the value is drawn at display size — see `HiddenInput` below.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppText,
  Pill,
  Screen,
  Touchable,
  VolumeUnit,
  resolveAccent,
  space,
  useTypeMetrics,
  useTheme,
} from '@/design';
import { ScreenHeader } from '@/components';
import { VolumeNudge, shouldNudge } from '@/components/VolumeNudge';
import { componentMap } from '@/data';
import { computeDose, findCleanVolume } from '@/engine';
import {
  VOLUME_MAX_ML,
  VOLUME_MIN_ML,
  unitPreferenceFor,
  useBrand,
  useRecipe,
  useStore,
} from '@/state';

/** From the handoff. Four equal pills. */
const PRESETS = [250, 350, 500, 1000];
const CARET_BLINK_MS = 550;
const MAX_DIGITS = 5;

/**
 * The selection band behind an untouched value.
 *
 * The first keystroke replaces the value, but a caret parked after the last digit
 * is the universal cue for *insert here*, so it reads as "delete this, then type" —
 * the opposite of what the screen does. A selection is the one cue that means
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
 * low on iOS. No choice of line height fixes it: the descent belongs to
 * the font.
 *
 * So the band is positioned from `capBlockBox` — the rect the digits actually
 * occupy — and is symmetric about them on both platforms by construction. It is
 * absolute, so it contributes nothing to layout: the value cannot be wrapped in a
 * View to carry a background, because the row is baseline-aligned and a View has no
 * text baseline (the trap `Caret` and `AnimatedAppText` both document).
 *
 * Its width is the one thing metrics cannot supply — it depends on how many digits
 * are on screen — so it is measured. The band therefore lands a frame after the
 * digits, which is invisible behind a screen that takes ~390ms to arrive.
 */
const SELECTION_ALPHA = '42';

/**
 * Breathing room around the digits, as a fraction of font size rather than in px,
 * so the band stays proportional when the reader turns their text size up.
 */
const SELECTION_PAD_X = 0.07;
const SELECTION_PAD_Y = 0.1;
const SELECTION_RADIUS = 0.06;

const clampVolume = (ml: number) => Math.min(VOLUME_MAX_ML, Math.max(VOLUME_MIN_ML, ml));

/**
 * A caret bar that blinks in hard steps rather than fading, as a text cursor does.
 *
 * Only shown once the value is genuinely being edited. Before that the selection
 * band is the cue, and a caret alongside it would be two contradictory claims about
 * what the next keystroke does.
 *
 * It is exactly as tall as the digits it sits beside — baseline to the top of the
 * numerals — and it is placed by baseline alignment rather than by centring. A
 * plain View has no text baseline, so Yoga aligns its *bottom* edge to the row's
 * baseline; a bar of cap height therefore spans precisely the same band as the
 * digits. That works out identically on both platforms without knowing anything
 * about how either distributes line-height slack, which centring does not: a
 * centred caret sits low on iOS.
 *
 * The height is read at the reader's text size rather than the nominal one, or a
 * reader on large text gets a caret two thirds the height of their digits.
 */
function Caret({ colour, height }: { colour: string; height: number }) {
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
        width: 3,
        height,
        borderRadius: 2,
        marginLeft: 8,
        backgroundColor: on ? colour : 'transparent',
      }}
    />
  );
}

export type VolumeScreenProps = { onClose: () => void };

export function VolumeScreen({ onClose }: VolumeScreenProps) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const brand = useBrand();
  const recipe = useRecipe();
  const accent = resolveAccent(brand.accent, scheme);
  const keyboardOverlap = useKeyboardOverlap();
  const hero = useTypeMetrics('hero');

  const volumeMl = useStore((s) => s.volumeMl);
  const setVolume = useStore((s) => s.setVolume);
  const suggest = useStore((s) => s.suggest);
  const flagAbove = useStore((s) => s.flagAbove);
  const preference = useStore((s) => unitPreferenceFor(s, s.brandId));

  /** Null while showing the committed volume; a string once the user types. The
   *  first keystroke starts a fresh number rather than appending to the old one. */
  const [entry, setEntry] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);
  /** The band's width is the one part metrics cannot supply, because it depends on
   *  how many digits are on screen. See the note on the selection band above. */
  const [valueWidth, setValueWidth] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const pendingMl = entry === null ? volumeMl : clampVolume(Number(entry) || 0);
  const display = entry === null ? String(volumeMl) : entry === '' ? '0' : entry;

  /** Nothing typed yet, so the whole value is still standing in for itself and the
   *  next keystroke replaces it. Exactly the state a text selection describes. */
  const selected = entry === null;

  /**
   * The band, in the row's own coordinates.
   *
   * `capBlockBox.top` is measured from the top of the value's line box, and the
   * value is the tallest thing in a baseline-aligned row, so its line box top *is*
   * the row's top and the two systems compose without an offset.
   */
  const padX = hero.fontSize * SELECTION_PAD_X;
  const padY = hero.fontSize * SELECTION_PAD_Y;
  const band = {
    left: -padX,
    width: valueWidth + padX * 2,
    top: hero.capBlockBox.top - padY,
    height: hero.capBlockBox.height + padY * 2,
    borderRadius: hero.fontSize * SELECTION_RADIUS,
    backgroundColor: `${accent}${SELECTION_ALPHA}`,
  };

  // Live preview while typing, so the nudge reacts as the number becomes real.
  // Below the minimum there is nothing meaningful to evaluate — "3" on the way to
  // "350" is not a volume anyone is asking about.
  const previewable = entry === null || Number(entry) >= VOLUME_MIN_ML;
  const dose = useMemo(
    () => computeDose(recipe, pendingMl, componentMap, { unitPreference: preference }),
    [recipe, pendingMl, preference],
  );
  const cleanVolumeMl = useMemo(
    () =>
      suggest
        ? findCleanVolume(recipe, componentMap, pendingMl, { unitPreference: preference })
        : null,
    [recipe, pendingMl, suggest, preference],
  );

  /**
   * The nudge is the suggestion, so turning suggestions off removes the card
   * rather than leaving it to report that no volume divides evenly — which would
   * be both alarming and untrue, since nothing has been looked for.
   *
   * Honesty is not lost: the dose screen still reports the gap on every brew.
   */
  const nudging = suggest && previewable && dismissed !== pendingMl && shouldNudge(dose, flagAbove);

  const commit = (ml: number) => {
    setVolume(clampVolume(ml));
    setEntry(null);
    setDismissed(null);
  };

  const close = () => {
    if (entry !== null) setVolume(pendingMl);
    Keyboard.dismiss();
    onClose();
  };

  return (
    // The keypad is always up on this screen, so the layout is measured against
    // the keyboard rather than the home indicator.
    <Screen
      applyBottomInset={false}
      style={{ paddingBottom: Math.max(keyboardOverlap, insets.bottom) }}
    >
      <ScreenHeader
        title="Water"
        onClose={close}
        accent={accent}
        inset={0}
        style={{ marginBottom: space.loose }}
      />

      {/* Tapping the value brings the keypad back. Without this there is no way to
          recover once the keyboard has been dismissed, since the field is offscreen. */}
      <Touchable
        onPress={() => inputRef.current?.focus()}
        accessibilityLabel={`${pendingMl} millilitres`}
        // The selection is a visual cue, so it is said out loud too — otherwise the
        // one group of users who cannot see it is also the group most likely to
        // assume they have to clear the field first.
        accessibilityHint={selected ? 'Selected. Type to replace the volume' : 'Edit the volume'}
        style={{ flexDirection: 'row', alignItems: 'baseline' }}
      >
        {/* First child, so it paints behind the digits. Absolute, so it is not part
            of the baseline row and cannot move anything. */}
        {selected && valueWidth > 0 ? <View style={{ position: 'absolute', ...band }} /> : null}
        <AppText variant="hero" onLayout={(e) => setValueWidth(e.nativeEvent.layout.width)}>
          {display}
        </AppText>
        {/* Immediately after the digits, where the next one will appear. */}
        {selected ? null : <Caret colour={accent} height={hero.capHeight} />}
        {/* Anchored right, so the unit holds still as the number gains digits. */}
        <View style={{ flex: 1 }} />
        <VolumeUnit tone="secondary">ml</VolumeUnit>
      </Touchable>

      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', gap: space.snug, marginTop: space.loose }}
      >
        {PRESETS.map((preset) => (
          <Pill
            key={preset}
            label={String(preset)}
            accessibilityRole="radio"
            accessibilityLabel={`${preset} millilitres`}
            selected={pendingMl === preset}
            onPress={() => commit(preset)}
            // The row sets the width; the label gets all of it.
            paddingHorizontal={0}
            style={{ flex: 1 }}
          />
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {nudging ? (
        <VolumeNudge
          dose={dose}
          cleanVolumeMl={cleanVolumeMl}
          onUseClean={commit}
          onDismiss={() => setDismissed(pendingMl)}
        />
      ) : null}

      <HiddenInput
        ref={inputRef}
        value={entry ?? ''}
        onChange={(digits) => {
          setEntry(digits);
          setDismissed(null);
        }}
      />
    </Screen>
  );
}

/**
 * How much of the window the system keypad covers, so the nudge can sit above it.
 *
 * Measured from the keyboard's top edge rather than from its reported height.
 * Under Android's edge-to-edge the window does not resize and the keypad is
 * drawn over the navigation bar, so `height` under-reports by exactly the
 * navigation bar. The distance from the
 * window's bottom to `screenY` is unambiguous on both platforms.
 */
function useKeyboardOverlap(): number {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    // iOS announces the keyboard before it animates in; Android only once it has.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) =>
      setOverlap(Math.max(0, Dimensions.get('window').height - e.endCoordinates.screenY)),
    );
    const hide = Keyboard.addListener(hideEvent, () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return overlap;
}

/**
 * The offscreen field that summons the system keypad.
 *
 * It has to be laid out and focusable, so it cannot be `display: none` or zero
 * sized on both platforms — it is positioned off the edge instead, at one point
 * square. `caretHidden` stops a second cursor appearing next to the drawn one.
 */
const HiddenInput = ({
  ref,
  value,
  onChange,
}: {
  ref: React.RefObject<TextInput | null>;
  value: string;
  onChange: (digits: string) => void;
}) => (
  <TextInput
    ref={ref}
    value={value}
    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, MAX_DIGITS))}
    keyboardType="number-pad"
    autoFocus
    caretHidden
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{ position: 'absolute', left: -1000, width: 1, height: 1, opacity: 0 }}
  />
);
