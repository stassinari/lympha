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
  InfoTip,
  Pill,
  Screen,
  SectionHeader,
  space,
  useTheme,
} from '@/design';
import { ComparisonTable, ScreenHeader } from '@/components';
import type { ComparisonRow } from '@/components';
import { formatDoseAmount, formatIdealAmount, formatPpm, formatUnit } from '@/format/units';
import {
  SEVERITY,
  band,
  blendNote,
  headline,
  headlineLabel,
  missSeverity,
} from '@/format/rounding';
import type { Band } from '@/format/rounding';
import { useExactVolume, useDose, useStore } from '@/state';

export type DetailScreenProps = { onClose: () => void };

export function DetailScreen({ onClose }: DetailScreenProps) {
  const { colour } = useTheme();
  const dose = useDose();
  const exactVolumeMl = useExactVolume();
  const flagAbove = useStore((s) => s.flagAbove);
  const setVolume = useStore((s) => s.setVolume);

  // Only reachable from the status line, which is only shown when rounding is.
  const which = band(dose, flagAbove) ?? 'onTarget';
  const barColour = { ok: colour.ok, warning: colour.warning, error: colour.error }[
    SEVERITY[which]
  ];
  const limit = Math.round(flagAbove * 100);
  const volumeMl = dose.volumeMl;

  const { gap } = headline(dose);
  const figure =
    which === 'missing'
      ? { big: '100%', small: `under target on ${headlineLabel(dose)}` }
      : which === 'onTarget'
        ? { big: '0%', small: 'on target' }
        : {
            big: `${Math.round(Math.abs(gap) * 100)}%`,
            small: `${gap < 0 ? 'under' : 'over'} target on ${headlineLabel(dose)}`,
          };

  const bottleRows: ComparisonRow[] = dose.lines.map((line) => ({
    label: line.component.name,
    target: formatIdealAmount(line.exact),
    delivered: formatDoseAmount(line.delivered, line.dispenser.step),
    off: missSeverity(line.relativeError, flagAbove, line.zeroed),
    direction: line.delivered < line.exact ? 'under' : 'over',
    gap: line.exact > 0 ? line.error / line.exact : undefined,
  }));

  const profile = dose.profile;
  const profileRows: ComparisonRow[] = profile
    ? [
        {
          label: 'Hardness',
          target: formatPpm(profile.target.hardness),
          delivered: formatPpm(profile.delivered.hardness),
          off: missSeverity(profile.hardnessError, flagAbove),
          direction: profile.hardnessError < 0 ? 'under' : 'over',
          gap: profile.hardnessError,
        },
        {
          label: 'Alkalinity',
          target: formatPpm(profile.target.alkalinity),
          delivered: formatPpm(profile.delivered.alkalinity),
          off: missSeverity(profile.alkalinityError, flagAbove),
          direction: profile.alkalinityError < 0 ? 'under' : 'over',
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
            <View
              style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}
            >
              <DoseValue style={{ marginRight: 8 }}>{figure.big}</DoseValue>
              <Body tone="secondary" style={{ flexShrink: 1 }}>
                {figure.small}
              </Body>
            </View>
            <InfoTip
              title={`${limit}% limit`}
              body="Lympha flags any gap above this. You can change it in Settings, under Flag when off by."
              accessibilityLabel="About the limit"
              accessibilityHint="Explains the limit"
            />
          </View>
          <Body tone="onCard" style={{ marginTop: 6 }}>
            {sentence(which, dose, limit)}
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

/** What the headline means, by band. The figure above it already says how far and
 *  on what, so this says what that amounts to. */
function sentence(which: Band, dose: ReturnType<typeof useDose>, limit: number): string {
  switch (which) {
    case 'onTarget':
      return 'That’s as close as drops get.';
    case 'close':
      return `That’s within the ${limit}% limit.`;
    case 'off':
      return `That’s more than the ${limit}% limit.`;
    case 'farOff':
      return 'That’s more than a third off, enough that the water no longer matches the recipe.';
    case 'missing':
      return dose.zeroed.length === 1
        ? `${dose.zeroed[0]!.component.name} rounds to zero drops at this volume, so it’s missing from your water.`
        : `${dose.zeroed.length} bottles round to zero drops at this volume, so they’re missing from your water.`;
  }
}
