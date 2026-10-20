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
 * the value is drawn at display size — see `NumberField`.
 */

import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Keyboard, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill, Screen, VolumeUnit, resolveAccent, space, useTheme } from '@/design';
import { NumberField, ScreenHeader } from '@/components';
import { VolumeNudge, shouldNudge } from '@/components/VolumeNudge';
import { componentMap } from '@/data';
import { computeDose, findExactVolume } from '@/engine';
import {
  VOLUME_MAX_ML,
  VOLUME_MIN_ML,
  useDoseOptions,
  useRange,
  useRecipe,
  useStore,
} from '@/state';

/** From the handoff. Four equal pills. */
const PRESETS = [250, 350, 500, 1000];
const MAX_DIGITS = 5;

const clampVolume = (ml: number) => Math.min(VOLUME_MAX_ML, Math.max(VOLUME_MIN_ML, ml));

export type VolumeScreenProps = { onClose: () => void };

export function VolumeScreen({ onClose }: VolumeScreenProps) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const range = useRange();
  const recipe = useRecipe();
  const accent = resolveAccent(range.accent, scheme);
  const keyboardOverlap = useKeyboardOverlap();

  const volumeMl = useStore((s) => s.volumeMl);
  const setVolume = useStore((s) => s.setVolume);
  const suggest = useStore((s) => s.suggest);
  const flagAbove = useStore((s) => s.flagAbove);
  const options = useDoseOptions();

  /** Null while showing the committed volume; a string once the user types. The
   *  first keystroke starts a fresh number rather than appending to the old one. */
  const [entry, setEntry] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const pendingMl = entry === null ? volumeMl : clampVolume(Number(entry) || 0);

  // Live preview while typing, so the nudge reacts as the number becomes real.
  // Below the minimum there is nothing meaningful to evaluate — "3" on the way to
  // "350" is not a volume anyone is asking about.
  const previewable = entry === null || Number(entry) >= VOLUME_MIN_ML;
  const dose = useMemo(
    () => computeDose(recipe, pendingMl, componentMap, options),
    [recipe, pendingMl, options],
  );
  const exactVolumeMl = useMemo(
    () => (suggest ? findExactVolume(recipe, componentMap, pendingMl, options) : null),
    [recipe, pendingMl, suggest, options],
  );

  /**
   * The nudge is the suggestion, so turning suggestions off removes the card
   * rather than leaving it to report that no volume is exact — which would
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

      <NumberField
        role="hero"
        value={volumeMl}
        entry={entry}
        onEntryChange={(digits) => {
          setEntry(digits);
          setDismissed(null);
        }}
        maxDigits={MAX_DIGITS}
        accent={accent}
        unit={<VolumeUnit tone="secondary">ml</VolumeUnit>}
        unitAtEnd
        autoFocus
        accessibilityLabel={`${pendingMl} millilitres`}
        accessibilityHint="Edits the amount of water"
      />

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
          exactVolumeMl={exactVolumeMl}
          flagAbove={flagAbove}
          onUseExact={commit}
          onDismiss={() => setDismissed(pendingMl)}
        />
      ) : null}
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
