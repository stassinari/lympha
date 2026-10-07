/**
 * The Android sheet: Material's `ModalBottomSheet`, holding React Native text.
 *
 * Material's sheet is edge to edge on a phone, so the window's width is the
 * sheet's width, and the hosted content is given it explicitly: Yoga lays the
 * content out inside the `Host`, not inside the sheet, and has no other width to
 * wrap against.
 */

import { Host, ModalBottomSheet, RNHostView } from '@expo/ui/jetpack-compose';
import { View, useWindowDimensions } from 'react-native';
import { space } from '../layout';
import { Body, CardTitle } from '../text';
import { useTheme } from '../theme';
import type { NativeSheetProps } from './NativeSheet';

export function NativeSheet({ visible, onClose, title, body }: NativeSheetProps) {
  const { colour, scheme } = useTheme();
  const { width } = useWindowDimensions();

  // Compose presents the sheet when it enters composition, so presence is the
  // visibility. Material animates it out itself before calling `onDismissRequest`.
  if (!visible) return null;
  return (
    // Out of the layout: the sheet is presented in a window of its own, and the
    // host is only where it attaches.
    <Host style={{ position: 'absolute', width }} pointerEvents="none" colorScheme={scheme}>
      <ModalBottomSheet
        onDismissRequest={onClose}
        // A short note has no half-height state worth stopping at.
        skipPartiallyExpanded
        containerColor={colour.card}
        contentColor={colour.text}
      >
        <RNHostView matchContents>
          {/* The drag handle sits above this, in the sheet's own chrome. */}
          <View
            style={{
              width,
              paddingHorizontal: space.cardH,
              paddingTop: space.snug,
              paddingBottom: space.loose,
              gap: space.tight,
            }}
          >
            <CardTitle accessibilityRole="header">{title}</CardTitle>
            <Body tone="onCard">{body}</Body>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
}
