/**
 * Rounding: the breakdown behind the status line.
 *
 * Three things, in order of how much they change your morning: how far off you
 * are and on what, what the water comes out like, and which bottles get it there.
 *
 * Not a fixed Hardness / Alkalinity / TDS table, as `docs/designs/v1` draws: TDS
 * is not derivable from anything either vendor publishes, and Apax publishes no ion
 * quantities at all, so the per-bottle table is the universal one and the
 * chemistry appears only where it can be computed. Showing zeroes for Apax would
 * read as soft water rather than as missing data.
 *
 * Where there is chemistry, it comes first: the headline quotes it, so the table
 * the number came from sits directly under it.
 */

import { ScrollView, View } from 'react-native';
import {
  BarRow,
  Body,
  DoseValue,
  HeadlineWords,
  InfoSheet,
  Pill,
  Screen,
  SectionHeader,
  space,
  useReflowedText,
  useTheme,
} from '@/design';
import { ComparisonTable, ScreenHeader } from '@/components';
import type { ComparisonRow } from '@/components';
import { formatDoseAmount, formatIdealAmount, formatPpm, formatUnit } from '@/format/units';
import {
  SEVERITY,
  band,
  blendNote,
  headlineFigure,
  headlineSentence,
  missSeverity,
} from '@/format/rounding';
import { useExactVolume, useDose, useStore } from '@/state';

export type DetailScreenProps = { onClose: () => void };

export function DetailScreen({ onClose }: DetailScreenProps) {
  const { colour } = useTheme();
  const dose = useDose();
  const exactVolumeMl = useExactVolume();
  const flagAbove = useStore((s) => s.flagAbove);
  const setVolume = useStore((s) => s.setVolume);
  const reflowed = useReflowedText();

  // Only reachable from the status line, which is only shown when rounding is.
  const which = band(dose, flagAbove) ?? 'onTarget';
  const barColour = { ok: colour.ok, warning: colour.warning, error: colour.error }[
    SEVERITY[which]
  ];
  const limit = Math.round(flagAbove * 100);
  const volumeMl = dose.volumeMl;

  const figure = headlineFigure(dose, which);
  const profile = dose.profile;

  // Where there is chemistry, the limit applies to the water, not the bottles: a
  // bottle 14% over inside water 2% under is not a problem, and colouring it as
  // one would contradict the headline. A bottle that rounds to zero still is.
  const bottleRows: ComparisonRow[] = dose.lines.map((line) => ({
    label: line.component.name,
    target: formatIdealAmount(line.exact),
    delivered: formatDoseAmount(line.delivered, line.dispenser.step),
    tone: profile
      ? line.zeroed
        ? 'error'
        : null
      : missSeverity(line.relativeError, flagAbove, line.zeroed),
    gap: line.exact > 0 ? line.error / line.exact : undefined,
  }));

  const profileRows: ComparisonRow[] = profile
    ? [
        {
          label: 'Hardness',
          target: formatPpm(profile.target.hardness),
          delivered: formatPpm(profile.delivered.hardness),
          tone: missSeverity(profile.hardnessError, flagAbove),
          gap: profile.hardnessError,
        },
        {
          label: 'Alkalinity',
          target: formatPpm(profile.target.alkalinity),
          delivered: formatPpm(profile.delivered.alkalinity),
          tone: missSeverity(profile.alkalinityError, flagAbove),
          gap: profile.alkalinityError,
        },
      ]
    : [];

  const unitLabel = dose.lines[0] ? formatUnit(dose.lines[0].dispenser.unit, 2) : undefined;
  const blend = blendNote(dose);

  return (
    <Screen horizontalPadding={0}>
      <ScreenHeader title="Rounding" onClose={onClose} />

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
        <BarRow barColour={barColour}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.snug }}>
            {figure.kind === 'words' ? (
              <HeadlineWords style={{ flex: 1 }}>{figure.text}</HeadlineWords>
            ) : (
              // The label wraps beside the figure, each line starting under its
              // first: a baseline row aligns the label's first line with the
              // digits, and `flex: 1` gives it the rest of the width to wrap in.
              // Past the accessibility text sizes there is no width left beside
              // the figure, so the label goes beneath it.
              <View
                accessible
                accessibilityLabel={`${figure.percent} ${figure.label}`}
                style={{
                  flex: 1,
                  flexDirection: reflowed ? 'column' : 'row',
                  alignItems: reflowed ? 'flex-start' : 'baseline',
                  columnGap: space.snug,
                }}
              >
                <DoseValue>{figure.percent}</DoseValue>
                <Body tone="secondary" style={reflowed ? null : { flex: 1 }}>
                  {figure.label}
                </Body>
              </View>
            )}
            <InfoSheet
              title={`${limit}% limit`}
              body={
                profile
                  ? `Hardness and alkalinity can each be up to ${limit}% off target before Lympha surfaces it. You can change this in Settings, under Rounding limit.`
                  : `Each bottle can be up to ${limit}% off target before Lympha surfaces it. You can change this in Settings, under Rounding limit.`
              }
              accessibilityLabel="About the limit"
              accessibilityHint="Explains the limit"
            />
          </View>
          <Body tone="onCard" style={{ marginTop: 6 }}>
            {headlineSentence(dose, which, limit)}
          </Body>
        </BarRow>

        {profileRows.length > 0 ? (
          <>
            <SectionHeader tone="secondary" style={{ marginTop: space.snug }}>
              In the water
            </SectionHeader>
            <ComparisonTable rows={profileRows} unit="ppm CaCO₃" />
          </>
        ) : null}

        <SectionHeader tone="secondary" style={{ marginTop: space.snug }}>
          Per bottle
        </SectionHeader>
        <ComparisonTable rows={bottleRows} unit={unitLabel} />
        {blend ? (
          <Body tone="secondary" style={{ paddingHorizontal: 8, marginTop: 4 }}>
            {blend}
          </Body>
        ) : null}

        {exactVolumeMl ? (
          <BarRow barColour={colour.ok} style={{ marginTop: space.snug }}>
            <Body tone="onCard">{`At ${exactVolumeMl} ml, every bottle hits its target exactly.`}</Body>
            <View style={{ flexDirection: 'row', gap: space.snug, marginTop: space.blocks }}>
              <Pill
                label={`Switch to ${exactVolumeMl} ml`}
                emphasis="primary"
                onPress={() => {
                  setVolume(exactVolumeMl);
                  onClose();
                }}
              />
              <Pill label={`Keep ${volumeMl} ml`} onPress={onClose} />
            </View>
          </BarRow>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
