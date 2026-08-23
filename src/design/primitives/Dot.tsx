/**
 * The status dot on the rounding line.
 *
 * Colour is never the only signal — the line always carries text saying the same
 * thing — so this stays decorative and out of the accessibility tree.
 */

import { View } from 'react-native';
import { useTheme } from '../theme';

export type DotStatus = 'ok' | 'warning';

export function Dot({ status, size = 9 }: { status: DotStatus; size?: number }) {
  const { colour } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: status === 'ok' ? colour.ok : colour.warning,
      }}
    />
  );
}
