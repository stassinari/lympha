/**
 * Enter or pick the water volume.
 *
 * The highest-frequency interaction in the app, and the one the brief says
 * deserves the most attention.
 *
 * The keypad is the **system** numeric keyboard, not a bespoke grid. A custom
 * grid was built during design and rejected: it added maintenance and lost
 * haptics, key repeat and accessibility for nothing. Getting the system keyboard
 * without a visible text field means an offscreen `TextInput` holding focus while
 * the value is drawn at display size — see `HiddenInput` below.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppText,
  Body,
  Caption,
  Chevron,
  Pill,
  Screen,
  ScreenTitle,
  Touchable,
  VolumeUnit,
  capTop,
  resolveAccent,
  space,
  typeScale,
  useTheme,
} from '@/design';
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

const hero = typeScale.hero;

/**
 * The caret is exactly as tall as the digits it sits beside — baseline to the top
 * of the numerals.
 *
 * It is placed by baseline alignment rather than by centring. A plain View has no
 * text baseline, so Yoga aligns its *bottom* edge to the row's baseline; a bar of
 * cap height therefore spans precisely the same band as the digits. That works
 * out identically on both platforms without knowing anything about how either
 * distributes line-height slack, which centring did not — hence the caret sitting
 * low on iOS and correct on Android.
 */
const CARET_HEIGHT = capTop(hero.weight, 'digits') * hero.fontSize;

const clampVolume = (ml: number) => Math.min(VOLUME_MAX_ML, Math.max(VOLUME_MIN_ML, ml));

/** A caret bar that blinks in hard steps rather than fading, as a text cursor does. */
function Caret({ colour }: { colour: string }) {
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
        height: CARET_HEIGHT,
        borderRadius: 2,
        marginLeft: 8,
        backgroundColor: on ? colour : 'transparent',
      }}
    />
  );
}

export type VolumeScreenProps = { onClose: () => void };

export function VolumeScreen({ onClose }: VolumeScreenProps) {
  const { colour, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const brand = useBrand();
  const recipe = useRecipe();
  const accent = resolveAccent(brand.accent, scheme);
  const keyboardOverlap = useKeyboardOverlap();

  const volumeMl = useStore((s) => s.volumeMl);
  const setVolume = useStore((s) => s.setVolume);
  const suggest = useStore((s) => s.suggest);
  const flagAbove = useStore((s) => s.flagAbove);
  const preference = useStore((s) => unitPreferenceFor(s, s.brandId));

  /** Null while showing the committed volume; a string once the user types. The
   *  first keystroke starts a fresh number rather than appending to the old one. */
  const [entry, setEntry] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  const pendingMl = entry === null ? volumeMl : clampVolume(Number(entry) || 0);
  const display = entry === null ? String(volumeMl) : entry === '' ? '0' : entry;

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

  const nudging = previewable && dismissed !== pendingMl && shouldNudge(dose, flagAbove);

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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.loose }}>
        {Platform.OS === 'android' ? (
          <Touchable onPress={close} hitSlop={14} accessibilityLabel="Back">
            <Chevron direction="left" size={12} colour={colour.text} />
          </Touchable>
        ) : null}
        <ScreenTitle style={{ flex: 1, marginLeft: Platform.OS === 'android' ? 10 : 0 }}>
          Water
        </ScreenTitle>
        {Platform.OS === 'ios' ? (
          <Touchable onPress={close} hitSlop={14} accessibilityLabel="Done">
            <Body style={{ color: accent }}>Done</Body>
          </Touchable>
        ) : null}
      </View>

      {/* Tapping the value brings the keypad back. Without this there is no way to
          recover once the keyboard has been dismissed, since the field is offscreen. */}
      <Touchable
        onPress={() => inputRef.current?.focus()}
        accessibilityLabel={`${pendingMl} millilitres`}
        accessibilityHint="Edit the volume"
        style={{ flexDirection: 'row', alignItems: 'baseline' }}
      >
        <AppText variant="hero">{display}</AppText>
        {/* Immediately after the digits, where the next one will appear. */}
        <Caret colour={accent} />
        {/* Anchored right, so the unit holds still as the number gains digits. */}
        <View style={{ flex: 1 }} />
        <VolumeUnit tone="secondary">ml</VolumeUnit>
      </Touchable>

      <View style={{ flexDirection: 'row', gap: space.snug, marginTop: space.loose }}>
        {PRESETS.map((preset) => (
          <Pill
            key={preset}
            label={String(preset)}
            selected={pendingMl === preset}
            onPress={() => commit(preset)}
            style={{ flex: 1, paddingHorizontal: 0 }}
          />
        ))}
      </View>
      <Caption tone="secondary" style={{ marginTop: space.snug }}>
        millilitres
      </Caption>

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
 * Under Android's edge-to-edge the window no longer resizes and the keypad is
 * drawn over the navigation bar, so `height` under-reports by exactly the
 * navigation bar — 268 against a real 292 on a Pixel 8. The distance from the
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
