/**
 * The nudge: what to do when this volume cannot be made properly.
 *
 * Two cases bring it up — a bottle that would round away entirely, or a gap past
 * the flag threshold. Both are real at cup scale: Rao's at 250 ml loses potassium
 * outright, and the vendor's own calculator reports the target profile anyway.
 *
 * It reuses the dose row anatomy — same radius, same flush 12px bar, amber
 * instead of a bottle colour — so a warning reads as the same family of object as
 * a dose rather than as an error state. The brief is firm that this must not
 * create anxiety at 6am.
 */

import { View } from 'react-native';
import { BarRow, Body, CardTitle, Pill, space, useTheme } from '@/design';
import type { Dose } from '@/engine';
import { headlineGap } from '@/format/rounding';

export type VolumeNudgeProps = {
  dose: Dose;
  /** The nearest volume that divides evenly, or null if there isn't one. */
  cleanVolumeMl: number | null;
  onUseClean: (volumeMl: number) => void;
  onDismiss: () => void;
};

/**
 * Whether this dose is worth interrupting for.
 *
 * Measured against the same gap the rounding line reports — the error in the
 * water where the vendor publishes enough to know it, the worst bottle where it
 * does not. Using the worst bottle here and the profile there would let one
 * screen say "2% under target" and "23% off" about the same jug.
 */
export function shouldNudge(dose: Dose, flagAbove: number): boolean {
  if (!dose.showsRounding) return false;
  return dose.zeroed.length > 0 || Math.abs(headlineGap(dose)) > flagAbove;
}

function title(dose: Dose): string {
  const zeroed = dose.zeroed;
  if (zeroed.length === 1) return `${zeroed[0]!.component.name} would round to zero`;
  if (zeroed.length > 1) return `${zeroed.length} bottles would round to zero`;
  return `This volume rounds hard`;
}

function body(dose: Dose, cleanVolumeMl: number | null): string {
  const lost =
    dose.zeroed.length > 0
      ? 'At this volume a mineral drops out of the recipe entirely.'
      : `You would be ${Math.round(Math.abs(headlineGap(dose)) * 100)}% off what the recipe asks for.`;

  // Never invent a suggestion. Saying so plainly is the honest output, and the
  // brief requires the card to offer only a dismiss in that case.
  return cleanVolumeMl
    ? `${lost} ${cleanVolumeMl} ml lands exactly.`
    : `${lost} No nearby volume divides evenly.`;
}

export function VolumeNudge({ dose, cleanVolumeMl, onUseClean, onDismiss }: VolumeNudgeProps) {
  const { colour } = useTheme();

  return (
    <BarRow barColour={colour.warning}>
      <CardTitle>{title(dose)}</CardTitle>
      <Body tone="onCard" style={{ marginTop: 4 }}>
        {body(dose, cleanVolumeMl)}
      </Body>
      <View style={{ flexDirection: 'row', gap: space.snug, marginTop: space.blocks }}>
        {cleanVolumeMl ? (
          <>
            <Pill
              label={`Use ${cleanVolumeMl} ml`}
              emphasis="primary"
              onPress={() => onUseClean(cleanVolumeMl)}
            />
            <Pill label={`Keep ${dose.volumeMl}`} onPress={onDismiss} />
          </>
        ) : (
          <Pill label="Got it" onPress={onDismiss} />
        )}
      </View>
    </BarRow>
  );
}
