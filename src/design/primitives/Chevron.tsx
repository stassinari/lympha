/**
 * A chevron, drawn rather than set.
 *
 * The handoff uses text glyphs (▾ ‹ ← ✓) as placeholders and says to replace them
 * with the platform's icon set. Nunito contains none of them — checked against the
 * shipped TTFs — so as text they would silently fall back to the system font and
 * render at a different weight on each platform.
 *
 * Two borders on a rotated square costs nothing, takes the theme colour, scales
 * with the type around it, and is identical everywhere. An icon font can replace
 * this in the platform pass if the app ends up needing enough icons to justify one.
 */

import { View } from 'react-native';
import { useTheme } from '../theme';

export type ChevronDirection = 'up' | 'down' | 'left' | 'right';

const ROTATION: Record<ChevronDirection, string> = {
  down: '45deg',
  up: '225deg',
  left: '135deg',
  right: '-45deg',
};

export function Chevron({
  direction = 'down',
  size = 9,
  thickness = 2,
  colour,
}: {
  direction?: ChevronDirection;
  size?: number;
  thickness?: number;
  colour?: string;
}) {
  const theme = useTheme();
  const stroke = colour ?? theme.colour.textSecondary;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // The rotated square is wider than it is tall once turned, so the wrapper
      // reserves honest space and keeps the glyph off its neighbours.
      style={{
        width: size * 1.6,
        height: size * 1.2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRightWidth: thickness,
          borderBottomWidth: thickness,
          borderColor: stroke,
          transform: [{ rotate: ROTATION[direction] }],
          // Nudges the optical centre of a rotated L back to the middle.
          marginTop: direction === 'down' ? -size * 0.25 : 0,
          marginBottom: direction === 'up' ? -size * 0.25 : 0,
        }}
      />
    </View>
  );
}
