/**
 * Development screen: the design system, driven by real data.
 *
 * The dose rows below are computed by the engine from the shipped Lotus and Apax
 * records, not mocked, so this doubles as an end-to-end check of the whole chain
 * before any real screen exists.
 *
 * Temporary: deleted once the Dose screen lands (Slice 5).
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  BarCluster,
  BarRow,
  Body,
  Caption,
  Card,
  CardTitle,
  Chip,
  Divider,
  Dot,
  Pill,
  ScreenTitle,
  SectionHeader,
  ThemeProvider,
  radius,
  space,
  styleForRole,
  typeScale,
  useTheme,
} from '@/design';
import type { ThemeMode, TypeRole } from '@/design';
import { componentMap, componentsForBrand, getRecipe } from '@/data';
import { DoseRow, VolumeCard } from '@/components';
import { computeDose, findCleanVolume } from '@/engine';
import type { Dose } from '@/engine';

const dose = (recipeId: string, volumeMl: number): Dose =>
  computeDose(getRecipe(recipeId)!, volumeMl, componentMap);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 28 }}>
      <SectionHeader tone="secondary">{title}</SectionHeader>
      <View style={{ marginTop: 10, gap: space.rows }}>{children}</View>
    </View>
  );
}

function RoundingLine({ d }: { d: Dose }) {
  if (!d.showsRounding) {
    return (
      <Body tone="secondary" style={{ paddingHorizontal: 8 }}>
        Rounding not reported — partial doses are deliverable.
      </Body>
    );
  }
  const over = d.worstError > 0.1 || d.zeroed.length > 0;
  const text = d.zeroed.length
    ? `${d.zeroed[0]!.component.name} would round to zero`
    : `${over ? 'Rounds hard' : 'Rounds clean'} — ${(d.worstError * 100).toFixed(0)}% off target`;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 }}>
      <Dot status={over ? 'warning' : 'ok'} />
      <Body tone="secondary" style={{ flex: 1 }}>
        {text}
      </Body>
    </View>
  );
}

const SAMPLES: Record<TypeRole, string> = {
  hero: '350',
  volume: '1000',
  doseValue: '4',
  screenTitle: 'Simple and Sweet',
  rowTitle: 'Magnesium',
  cardTitle: 'Lotus Water',
  body: 'Rounds clean — 3% under target.',
  caption: 'Last used yesterday',
  sectionHeader: 'Brewing',
  unitLabel: 'drops',
  volumeUnit: 'ml',
  cardLabel: 'Water',
};

function Sheet({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
  const { colour, scheme } = useTheme();
  const [brand, setBrand] = useState('lotus');

  const sweet = dose('lotus-simple-and-sweet', 1000);
  const raos = dose('lotus-raos-recipe', 250);
  const apaxGrams = dose('apax-lab-washed', 1000);
  const clean = findCleanVolume(getRecipe('lotus-raos-recipe')!, componentMap, 250);

  return (
    <ScrollView
      style={{ backgroundColor: colour.background }}
      contentContainerStyle={{
        paddingHorizontal: space.screenH,
        paddingTop: 64,
        paddingBottom: 64,
      }}
    >
      <ScreenTitle>Design system</ScreenTitle>
      <View style={{ flexDirection: 'row', gap: space.snug, marginTop: 12 }}>
        {(['system', 'light', 'dark'] as const).map((m) => (
          <Pill key={m} label={m} selected={mode === m} onPress={() => setMode(m)} />
        ))}
      </View>

      <Section title="Volume card · optical padding">
        <VolumeCard volumeMl={1000} onEdit={() => {}} />
      </Section>

      <Section title="Dose rows · Simple and Sweet, 1 L">
        {sweet.lines.map((l) => (
          <DoseRow key={l.component.id} line={l} />
        ))}
        <RoundingLine d={sweet} />
      </Section>

      <Section title="A bottle rounding away · Rao's, 250 ml">
        {raos.lines.map((l) => (
          <DoseRow key={l.component.id} line={l} />
        ))}
        <RoundingLine d={raos} />
        <BarRow barColour={colour.warning}>
          <CardTitle>Potassium would round to zero</CardTitle>
          <Body tone="onCard" style={{ marginTop: 4 }}>
            {clean
              ? `At this volume a mineral drops out of the recipe. ${clean} ml lands exactly.`
              : 'No nearby volume divides evenly.'}
          </Body>
          <View style={{ flexDirection: 'row', gap: space.snug, marginTop: 14 }}>
            {clean ? (
              <Pill label={`Use ${clean} ml`} emphasis="primary" onPress={() => {}} />
            ) : null}
            <Pill label="Keep 250" onPress={() => {}} />
          </View>
        </BarRow>
      </Section>

      <Section title="Grams · Apax at 1 L, four bottles">
        {apaxGrams.lines.map((l) => (
          <DoseRow key={l.component.id} line={l} />
        ))}
        <RoundingLine d={apaxGrams} />
      </Section>

      <Section title="Chips and clusters">
        <View style={{ flexDirection: 'row', gap: space.snug, flexWrap: 'wrap' }}>
          {['lotus', 'apax-lab', 'apax-lab-original'].map((id) => (
            <Chip
              key={id}
              label={id === 'lotus' ? 'Lotus' : id === 'apax-lab' ? 'Apax' : 'Apax 3'}
              selected={brand === id}
              onPress={() => setBrand(id)}
              leading={
                <BarCluster size="chip" colours={componentsForBrand(id).map((c) => c.colour)} />
              }
            />
          ))}
        </View>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <BarCluster colours={componentsForBrand('apax-lab').map((c) => c.colour)} />
            <View style={{ flex: 1 }}>
              <CardTitle>Washed</CardTitle>
              <Caption tone="secondary">Apax Lab · four bottles</Caption>
            </View>
            <CardTitle tone="secondary">▾</CardTitle>
          </View>
        </Card>
        <Divider />
      </Section>

      <Section title="Type scale">
        {(Object.keys(typeScale) as TypeRole[]).map((role) => (
          <View key={role}>
            <Caption tone="secondary">
              {role} · {typeScale[role].fontSize}/{typeScale[role].weight} · lh{' '}
              {typeScale[role].lineHeight}
            </Caption>
            <View style={{ backgroundColor: colour.control, borderRadius: radius.key }}>
              <Body style={styleForRole(role)}>{SAMPLES[role]}</Body>
            </View>
          </View>
        ))}
      </Section>

      <Section title={`Colour · ${scheme}`}>
        {Object.entries(colour).map(([name, value]) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: space.snug }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: value }} />
            <Caption tone="secondary" style={{ flex: 1 }}>
              {name}
            </Caption>
            <Caption tone="secondary">{value}</Caption>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

export default function Gallery() {
  const [mode, setMode] = useState<ThemeMode>('system');
  return (
    <ThemeProvider mode={mode}>
      <Sheet mode={mode} setMode={setMode} />
    </ThemeProvider>
  );
}
