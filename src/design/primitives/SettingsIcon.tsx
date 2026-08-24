/**
 * The settings affordance: two sliders, drawn rather than set.
 *
 * Nunito carries no gear or ellipsis, and the app has too few icons to justify
 * shipping a font for one — see `Chevron` for the same reasoning. Two tracks with
 * knobs at different positions reads as "adjust" at any size and takes the theme
 * colour like everything else.
 */

import { View } from 'react-native';
import { useTheme } from '../theme';

/** Declared outside the component: one defined inline would be a new type on every
 *  render, and React would remount it rather than update it. */
function Slider({
  colour,
  track,
  knob,
  knobLeft,
}: {
  colour: string;
  track: number;
  knob: number;
  knobLeft: number;
}) {
  return (
    <View style={{ height: knob, justifyContent: 'center' }}>
      <View style={{ height: track, borderRadius: track, backgroundColor: colour }} />
      <View
        style={{
          position: 'absolute',
          left: knobLeft,
          width: knob,
          height: knob,
          borderRadius: knob / 2,
          backgroundColor: colour,
        }}
      />
    </View>
  );
}

export function SettingsIcon({ size = 18, colour }: { size?: number; colour?: string }) {
  const theme = useTheme();
  const stroke = colour ?? theme.colour.textSecondary;
  const track = Math.max(1.5, size / 12);
  const knob = size / 3.6;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, justifyContent: 'center', gap: size / 4 }}
    >
      <Slider colour={stroke} track={track} knob={knob} knobLeft={size * 0.55} />
      <Slider colour={stroke} track={track} knob={knob} knobLeft={size * 0.12} />
    </View>
  );
}
