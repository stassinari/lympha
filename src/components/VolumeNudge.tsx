/**
 * The nudge: what to do when this volume cannot be made properly.
 *
 * Two cases bring it up — a bottle that would round away entirely, or a gap past
 * the flag threshold. Both are real at cup scale: Rao's at 250 ml loses potassium
 * outright, and the vendor's own calculator reports the target profile anyway.
 *
 * It reuses the dose row anatomy — same radius, same flush 12px bar, the band's
 * colour instead of a bottle's — so a warning reads as the same family of object
 * as a dose rather than as an error dialog. It must not create anxiety at 6am.
 */

import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { BarRow, Body, CardTitle, Pill, space, useReduceMotion, useTheme } from '@/design';
import type { Dose } from '@/engine';
import { SEVERITY, band, headlineGap } from '@/format/rounding';
import type { Band } from '@/format/rounding';

export type VolumeNudgeProps = {
  dose: Dose;
  /** The nearest volume that divides evenly, or null if there isn't one. */
  cleanVolumeMl: number | null;
  flagAbove: number;
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

function title(dose: Dose, which: Band): string {
  const zeroed = dose.zeroed;
  if (zeroed.length === 1) return `No ${zeroed[0]!.component.name} at this volume`;
  if (zeroed.length > 1) return `${zeroed.length} bottles missing at this volume`;
  return which === 'farOff' ? 'This volume is far off target' : 'This volume is off target';
}

/** The band's sentence, then the way out. A missing bottle has no band sentence:
 *  the title has already said everything there is to say about it. */
function body(dose: Dose, which: Band, cleanVolumeMl: number | null): string {
  const percent = Math.round(Math.abs(headlineGap(dose)) * 100);
  const why =
    which === 'missing'
      ? null
      : which === 'farOff'
        ? `You’d be ${percent}% off, enough that the water no longer matches the recipe.`
        : `You’d be ${percent}% off target.`;

  // Never invent a suggestion. Saying so plainly is the honest output, and the
  // card then offers only a dismiss.
  const way = cleanVolumeMl ? `${cleanVolumeMl} ml is exact.` : 'No exact volume nearby.';
  return why ? `${why} ${way}` : way;
}

export function VolumeNudge({
  dose,
  cleanVolumeMl,
  flagAbove,
  onUseClean,
  onDismiss,
}: VolumeNudgeProps) {
  const { colour } = useTheme();
  // Only shown past the threshold, so never `onTarget` or `close`.
  const which = band(dose, flagAbove) ?? 'off';
  const severe = SEVERITY[which] === 'error';
  const entrance = useEntrance();

  return (
    <Animated.View style={entrance}>
      <BarRow barColour={severe ? colour.error : colour.warning}>
        <CardTitle>{title(dose, which)}</CardTitle>
        <Body tone="onCard" style={{ marginTop: 4 }}>
          {body(dose, which, cleanVolumeMl)}
        </Body>
        <View style={{ flexDirection: 'row', gap: space.snug, marginTop: space.blocks }}>
          {cleanVolumeMl ? (
            <>
              <Pill
                label={`Use ${cleanVolumeMl} ml`}
                emphasis="primary"
                onPress={() => onUseClean(cleanVolumeMl)}
              />
              <Pill label={`Keep ${dose.volumeMl} ml`} onPress={onDismiss} />
            </>
          ) : (
            <Pill label="OK" onPress={onDismiss} />
          )}
        </View>
      </BarRow>
    </Animated.View>
  );
}

/**
 * The card rises into place rather than appearing.
 *
 * Animating its height would reflow the screen; sliding it up from behind the
 * keypad reads the same and stays on the native driver, where a height animation
 * cannot go.
 */
function useEntrance() {
  const reduced = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 380,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress]);

  const opacity = progress.interpolate({ inputRange: [0, 0.74, 1], outputRange: [0, 1, 1] });
  // The fade stays — the card has to be noticed — but the rise does not.
  if (reduced) return { opacity, transform: [] };

  return {
    opacity,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };
}
