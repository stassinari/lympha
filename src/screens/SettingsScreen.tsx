/**
 * Appearance, units, brewing defaults, bottles.
 *
 * Deliberately short: anything longer is a sign the main screen is under-decided,
 * and nothing here is something you would visit before coffee.
 */

import { useState } from 'react';
import { Platform, ScrollView, Switch, View } from 'react-native';
import {
  BarCluster,
  Overlay,
  Pill,
  Screen,
  SectionHeader,
  Segmented,
  resolveAccent,
  space,
  useTheme,
} from '@/design';
import { ScreenHeader, SettingsRow } from '@/components';
import { brands, componentsForBrand, unitGroups } from '@/data';
import { availableUnits } from '@/engine';
import { FLAG_CHOICES, useBrand, useStore } from '@/state';
import type { ThemeMode } from '@/state';
import { UnitScreen } from './UnitScreen';

const APPEARANCE: readonly { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const DEFAULT_VOLUMES = [250, 350, 500, 1000];

const UNIT_NAME: Record<string, string> = { auto: 'Automatic', drop: 'Drops', g: 'Grams' };

export type SettingsScreenProps = { onClose: () => void };

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { colour, scheme } = useTheme();
  const brand = useBrand();
  const accent = resolveAccent(brand.accent, scheme);

  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const suggest = useStore((s) => s.suggest);
  const setSuggest = useStore((s) => s.setSuggest);
  const flagAbove = useStore((s) => s.flagAbove);
  const setFlagAbove = useStore((s) => s.setFlagAbove);
  const defaultVolumeMl = useStore((s) => s.defaultVolumeMl);
  const setDefaultVolume = useStore((s) => s.setDefaultVolume);
  const units = useStore((s) => s.units);

  const [unitBrandId, setUnitBrandId] = useState<string | null>(null);

  return (
    <Screen horizontalPadding={0}>
      <ScreenHeader title="Settings" onClose={onClose} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.screenH,
          paddingTop: space.belowHeader,
          paddingBottom: space.loose,
          gap: space.rows,
        }}
      >
        <SectionHeader tone="secondary">Appearance</SectionHeader>
        <Segmented options={APPEARANCE} value={mode} onChange={setMode} />

        <SectionHeader tone="secondary" style={{ marginTop: space.blocks }}>
          Units
        </SectionHeader>
        <SettingsRow label="Water" value="Millilitres" />
        {unitGroups().map((group) => {
          // One row per group, not per brand: Apax's two ranges are the same jars
          // on the same scale, so they share a setting.
          const first = group.brandIds[0]!;
          const choices = availableUnits(componentsForBrand(first));
          const preference = units[group.id] ?? 'auto';
          return choices.length > 1 ? (
            <SettingsRow
              key={group.id}
              label={group.label}
              value={UNIT_NAME[preference] ?? preference}
              onPress={() => setUnitBrandId(first)}
            />
          ) : (
            // A brand with one dispenser has nothing to choose: Lotus ships a
            // dropper and no scale, so offering grams would offer a wrong answer.
            <SettingsRow
              key={group.id}
              label={group.label}
              value={UNIT_NAME[choices[0] ?? ''] ?? '—'}
            />
          );
        })}

        <SectionHeader tone="secondary" style={{ marginTop: space.blocks }}>
          Brewing
        </SectionHeader>
        <SettingsRow
          label="Opens at"
          detail="Pin a volume, or pick up where you left off."
          wide
          control={
            // Every pill carries the setting's name, because a screen reader
            // reaches it on its own: "250" alone says nothing about what it does.
            <View
              accessibilityRole="radiogroup"
              style={{ flexDirection: 'row', gap: space.snug, flexWrap: 'wrap' }}
            >
              <Pill
                label="Last used"
                accessibilityRole="radio"
                accessibilityLabel="Open at the last used volume"
                selected={defaultVolumeMl === null}
                onPress={() => setDefaultVolume(null)}
              />
              {DEFAULT_VOLUMES.map((ml) => (
                <Pill
                  key={ml}
                  label={String(ml)}
                  accessibilityRole="radio"
                  accessibilityLabel={`Open at ${ml} millilitres`}
                  selected={defaultVolumeMl === ml}
                  onPress={() => setDefaultVolume(ml)}
                />
              ))}
            </View>
          }
        />
        <SettingsRow
          label="Flag rounding above"
          detail="How far off the recipe before the dose screen says so."
          wide
          control={
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: space.snug }}>
              {FLAG_CHOICES.map((value) => (
                <Pill
                  key={value}
                  label={`${Math.round(value * 100)}%`}
                  accessibilityRole="radio"
                  accessibilityLabel={`Flag rounding above ${Math.round(value * 100)} percent`}
                  selected={Math.abs(flagAbove - value) < 1e-9}
                  onPress={() => setFlagAbove(value)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          }
        />
        <SettingsRow
          label="Suggest a cleaner volume"
          detail="Offer a nearby volume that divides evenly."
          control={
            <Switch
              value={suggest}
              onValueChange={setSuggest}
              // The row's label belongs to a sibling `Text`, and the card is not a
              // single tap target, so the switch reaches a screen reader on its
              // own and has to say what it switches.
              accessibilityLabel="Suggest a cleaner volume"
              accessibilityHint="Offer a nearby volume that divides evenly"
              trackColor={{ true: accent, false: colour.control }}
              // Android's thumb defaults to the platform accent, which lands a
              // Material blue in the middle of a brand-tinted track. iOS draws its
              // own thumb and must be left alone.
              thumbColor={Platform.OS === 'android' ? colour.card : undefined}
            />
          }
        />

        <SectionHeader tone="secondary" style={{ marginTop: space.blocks }}>
          Bottles
        </SectionHeader>
        {brands.map((b) => (
          <SettingsRow
            key={b.id}
            label={b.name}
            detail={componentsForBrand(b.id)
              .map((c) => c.name)
              .join(' · ')}
            control={<BarCluster colours={componentsForBrand(b.id).map((c) => c.colour)} />}
          />
        ))}
      </ScrollView>

      <Overlay
        visible={unitBrandId !== null}
        from="right"
        onRequestClose={() => setUnitBrandId(null)}
      >
        {unitBrandId ? (
          <UnitScreen brandId={unitBrandId} onClose={() => setUnitBrandId(null)} />
        ) : null}
      </Overlay>
    </Screen>
  );
}
