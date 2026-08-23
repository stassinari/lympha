/**
 * Development screen. Renders the whole type scale so it can be checked on a
 * real device, and draws the ink insets so the line-box asymmetry is visible
 * rather than theoretical.
 *
 * Temporary: deleted once the Dose screen exists (Slice 5).
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Body,
  Caption,
  SectionHeader,
  ThemeProvider,
  inkInsets,
  radius,
  space,
  themes,
  typeScale,
  useTheme,
} from '@/design';
import type { ThemeMode, TypeRole } from '@/design';

const SAMPLES: Record<TypeRole, string> = {
  hero: '1000',
  volume: '1000',
  doseValue: '4',
  screenTitle: 'Simple and Sweet',
  rowTitle: 'Magnesium',
  cardTitle: 'Lotus Water',
  body: 'Rounds clean — 3% under target.',
  caption: 'Last used yesterday',
  sectionHeader: 'Brewing',
  unitLabel: 'drops',
};

/** A role rendered on a tint, with hairlines marking where its ink starts and
 *  ends. The gap under a display numeral should be visibly larger than above. */
function Specimen({ role }: { role: TypeRole }) {
  const { colour } = useTheme();
  const spec = typeScale[role];
  const insets = inkInsets(spec.fontSize, spec.lineHeight, spec.weight, spec.extent);

  return (
    <View style={{ marginBottom: space.blocks }}>
      <Caption tone="secondary">
        {role} · {spec.fontSize}px / {spec.weight} · lh {spec.lineHeight} (
        {(spec.lineHeight / spec.fontSize).toFixed(2)}) · ls {spec.letterSpacing.toFixed(2)}
      </Caption>
      <View style={[styles.tint, { backgroundColor: colour.control, marginTop: 4 }]}>
        <AppText variant={role}>{SAMPLES[role]}</AppText>
        <View
          pointerEvents="none"
          style={[styles.rule, { top: insets.top, backgroundColor: colour.warning }]}
        />
        <View
          pointerEvents="none"
          style={[styles.rule, { bottom: insets.bottom, backgroundColor: colour.ok }]}
        />
      </View>
      <Caption tone="secondary">
        ink inset — top {insets.top.toFixed(1)}px, bottom {insets.bottom.toFixed(1)}px
      </Caption>
    </View>
  );
}

function Sheet({ mode, onModeChange }: { mode: ThemeMode; onModeChange: (m: ThemeMode) => void }) {
  const { colour, scheme } = useTheme();
  const roles = Object.keys(typeScale) as TypeRole[];

  return (
    <ScrollView style={{ backgroundColor: colour.background }} contentContainerStyle={styles.page}>
      <SectionHeader tone="secondary">Type scale · {scheme}</SectionHeader>
      <Body tone="secondary" style={{ marginTop: 4, marginBottom: space.loose }}>
        Amber rule marks the top of the ink, green the bottom. The space below a display numeral is
        meant to be much larger than the space above — React Native pins the descent and puts every
        bit of line-height slack above the baseline.
      </Body>

      <View style={styles.modes}>
        {(['system', 'light', 'dark'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => onModeChange(m)}
            style={[
              styles.mode,
              {
                backgroundColor: mode === m ? colour.controlSelected : colour.control,
                borderRadius: radius.control,
              },
            ]}
          >
            <Caption tone={mode === m ? 'primary' : 'secondary'}>{m}</Caption>
          </Pressable>
        ))}
      </View>

      {roles.map((role) => (
        <Specimen key={role} role={role} />
      ))}

      <SectionHeader tone="secondary">Colour</SectionHeader>
      <View style={{ marginTop: 8, gap: 6 }}>
        {Object.entries(themes[scheme].colour).map(([name, value]) => (
          <View key={name} style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: value }]} />
            <Caption tone="secondary" style={{ flex: 1 }}>
              {name}
            </Caption>
            <Caption tone="secondary">{value}</Caption>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function TypeSpecimen() {
  const [mode, setMode] = useState<ThemeMode>('system');
  return (
    <ThemeProvider mode={mode}>
      <Sheet mode={mode} onModeChange={setMode} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: space.screenH, paddingTop: 64, paddingBottom: 48 },
  tint: { borderRadius: radius.key, alignSelf: 'flex-start', paddingHorizontal: 4 },
  rule: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.9 },
  modes: { flexDirection: 'row', gap: space.snug, marginBottom: space.loose },
  mode: { paddingHorizontal: 14, paddingVertical: 8 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: space.snug },
  swatch: { width: 22, height: 22, borderRadius: 6 },
});
