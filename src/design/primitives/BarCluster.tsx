/**
 * A row of small colour bars, one per bottle in a recipe or brand.
 *
 * It identifies the palette before the name is read, and doubles as a count — a
 * three-bottle recipe shows three bars. Because a bottle at zero is omitted from
 * the recipe data entirely, the cluster is always the right length without
 * anything here filtering.
 */

import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { resolveBarColour } from '../colour';
import type { SchemeColour } from '../colour';
import { useTheme } from '../theme';

/** The three sizes the handoff uses, named for where they appear. */
export const CLUSTER_SIZE = {
  /** Recipe header card. */
  header: { width: 5, height: 18, gap: 3 },
  /** Brand chip. */
  chip: { width: 4, height: 15, gap: 3 },
  /** Recipe list row. */
  row: { width: 5, height: 20, gap: 3 },
} as const;

export type ClusterSize = keyof typeof CLUSTER_SIZE;

export type BarClusterProps = {
  colours: (SchemeColour | undefined)[];
  size?: ClusterSize;
  style?: StyleProp<ViewStyle>;
};

export function BarCluster({ colours, size = 'header', style }: BarClusterProps) {
  const { scheme } = useTheme();
  const { width, height, gap } = CLUSTER_SIZE[size];

  return (
    // Decorative: the bottle names are always present alongside, so a screen
    // reader announcing a list of colours would only add noise.
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ flexDirection: 'row', gap }, style]}
    >
      {colours.map((colour, i) => (
        <View
          key={i}
          style={{
            width,
            height,
            borderRadius: 3,
            backgroundColor: resolveBarColour(colour, scheme).bar,
          }}
        />
      ))}
    </View>
  );
}
