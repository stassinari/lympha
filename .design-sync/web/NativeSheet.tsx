/**
 * The browser stand-in for `NativeSheet`.
 *
 * The app draws this sheet natively — SwiftUI's `.sheet` on iOS, Material 3's
 * `ModalBottomSheet` on Android — so there is no React Native implementation to
 * render here. This draws the iOS shape from the design tokens: a scrim, then a
 * content-sized card from the bottom edge with a drag indicator, the title in
 * `cardTitle` and the note in `body`.
 */

import { View } from 'react-native';
import { Body, CardTitle, radius, space, useTheme } from '../../src/design';
import type { NativeSheetProps } from '../../src/design/primitives/NativeSheet';

export function NativeSheet({ visible, onClose, title, body }: NativeSheetProps) {
  const { colour } = useTheme();
  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 10 }}>
      <View onTouchEnd={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
      <View
        style={{
          backgroundColor: colour.card,
          borderTopLeftRadius: radius.card + 10,
          borderTopRightRadius: radius.card + 10,
          paddingHorizontal: space.cardH,
          paddingBottom: space.cardH + space.loose,
          paddingTop: space.snug,
          gap: space.tight,
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 5,
            borderRadius: 3,
            backgroundColor: colour.divider,
            marginBottom: space.loose - space.tight,
          }}
        />
        <CardTitle accessibilityRole="header">{title}</CardTitle>
        <Body tone="secondary">{body}</Body>
      </View>
    </View>
  );
}
