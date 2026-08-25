/**
 * "What you'll get" — the honest breakdown behind the rounding line.
 *
 * Three things, in order of how much they change your morning: how far off you
 * are, which bottle is responsible, and what the water actually comes out like.
 *
 * The handoff drew a fixed table of Hardness / Alkalinity / TDS. TDS is not
 * derivable from anything either vendor publishes, and Apax publishes no ion
 * quantities at all, so the per-bottle table is the universal one and the
 * chemistry appears only where it can be computed. Showing zeroes for Apax would
 * read as soft water rather than as missing data.
 */

import { ScrollView, View } from 'react-native';
import { BarRow, Body, DoseValue, Pill, Screen, SectionHeader, space, useTheme } from '@/design';
import { ComparisonTable, ScreenHeader } from '@/components';
import type { ComparisonRow } from '@/components';
import { formatDoseAmount, formatIdealAmount, formatPpm, formatUnit } from '@/format/units';
import { headline } from '@/format/rounding';
import type { HeadlineSource } from '@/format/rounding';
import { useBrand, useCleanVolume, useDose, useStore } from '@/state';

export type DetailScreenProps = { onClose: () => void };

export function DetailScreen({ onClose }: DetailScreenProps) {
  const { colour } = useTheme();
  const brand = useBrand();
  const dose = useDose();
  const cleanVolumeMl = useCleanVolume();
  const flagAbove = useStore((s) => s.flagAbove);
  const setVolume = useStore((s) => s.setVolume);

  const { gap, source } = headline(dose);
  const percent = Math.round(Math.abs(gap) * 100);
  const direction = gap < 0 ? 'under' : 'over';

  const bottleRows: ComparisonRow[] = dose.lines.map((line) => ({
    label: line.component.name,
    asked: formatIdealAmount(line.exact),
    got: formatDoseAmount(line.delivered, line.dispenser.step),
    off: line.zeroed || line.relativeError > flagAbove,
    direction: line.delivered < line.exact ? 'under' : 'over',
    gap: line.exact > 0 ? line.error / line.exact : undefined,
  }));

  const profile = dose.profile;
  const profileRows: ComparisonRow[] = profile
    ? [
        {
          label: 'Hardness',
          asked: formatPpm(profile.target.hardness),
          got: formatPpm(profile.delivered.hardness),
          off: Math.abs(profile.hardnessError) > flagAbove,
          direction: profile.hardnessError < 0 ? 'under' : 'over',
          gap: profile.hardnessError,
        },
        {
          label: 'Alkalinity',
          asked: formatPpm(profile.target.alkalinity),
          got: formatPpm(profile.delivered.alkalinity),
          off: Math.abs(profile.alkalinityError) > flagAbove,
          direction: profile.alkalinityError < 0 ? 'under' : 'over',
          gap: profile.alkalinityError,
        },
      ]
    : [];

  const unitLabel = dose.lines[0] ? formatUnit(dose.lines[0].dispenser.unit, 2) : undefined;

  return (
    <Screen horizontalPadding={0}>
      <ScreenHeader title="What you’ll get" onClose={onClose} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.screenH,
          paddingBottom: space.loose,
          gap: space.rows,
        }}
      >
        <BarRow barColour={colour.warning}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <DoseValue>{`${percent}%`}</DoseValue>
            <Body tone="secondary" style={{ marginLeft: 8 }}>
              {direction} target
            </Body>
          </View>
          <Body tone="onCard" style={{ marginTop: 6 }}>
            {explain(dose, direction, source)}
          </Body>
        </BarRow>

        <SectionHeader tone="secondary" style={{ marginTop: space.snug }}>
          Per bottle
        </SectionHeader>
        <ComparisonTable rows={bottleRows} unit={unitLabel} />

        {profileRows.length > 0 ? (
          <>
            <SectionHeader tone="secondary" style={{ marginTop: space.snug }}>
              In the water
            </SectionHeader>
            <ComparisonTable rows={profileRows} unit="ppm CaCO₃" />
          </>
        ) : (
          <Body tone="secondary" style={{ paddingHorizontal: 8, marginTop: 4 }}>
            {brand.name} publishes what is in each bottle but not how much, so what the water ends
            up like cannot be worked out.
          </Body>
        )}

        {cleanVolumeMl ? (
          <BarRow barColour={colour.ok} style={{ marginTop: space.snug }}>
            <Body tone="onCard">
              {`At ${cleanVolumeMl} ml every bottle lands on a whole ${formatUnit(
                dose.lines[0]?.dispenser.unit ?? 'drop',
                1,
              )}.`}
            </Body>
            <View style={{ flexDirection: 'row', gap: space.snug, marginTop: space.blocks }}>
              <Pill
                label={`Switch to ${cleanVolumeMl} ml`}
                emphasis="primary"
                onPress={() => {
                  setVolume(cleanVolumeMl);
                  onClose();
                }}
              />
              <Pill label="Brew it" onPress={onClose} />
            </View>
          </BarRow>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

/**
 * Names the figure the headline is quoting, then says why it is out.
 *
 * The attribution is the fix for a real report: with six numbers below and one
 * percentage above, a reader picked the row they assumed it came from, got a
 * different answer, and had no way to know which of them was wrong. It was the
 * alkalinity row, and nothing on the screen said so.
 */
function explain(
  dose: ReturnType<typeof useDose>,
  direction: string,
  source: HeadlineSource | null,
): string {
  const zeroed = dose.zeroed;
  if (zeroed.length === 1) {
    return `${zeroed[0]!.component.name} rounds away to nothing at this volume, so it is missing from the water entirely.`;
  }
  if (zeroed.length > 1) {
    return `${zeroed.length} bottles round away to nothing at this volume, so they are missing from the water entirely.`;
  }
  const unit = dose.lines[0]?.dispenser.unit ?? 'drop';
  const attribution = source ? `${source.label} is the widest gap. ` : '';
  return `${attribution}A ${formatUnit(unit, 1)} cannot be halved, so the closest you can actually make is a little ${direction} what the recipe asks for.`;
}
