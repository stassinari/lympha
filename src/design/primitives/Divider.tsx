import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

/** A hairline. `StyleSheet.hairlineWidth` is the thinnest line the display can
 *  draw, which is finer than 1px on any modern phone. */
export function Divider({ inset = 0 }: { inset?: number }) {
  const { colour } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colour.divider,
        marginLeft: inset,
      }}
    />
  );
}
