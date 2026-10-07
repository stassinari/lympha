/**
 * The iOS sheet, and its content, in SwiftUI.
 *
 * On iOS 26 a partial-height sheet floats inset from the screen edges on Liquid
 * Glass. Two consequences shape this file:
 *
 * - **The text is SwiftUI, not React Native.** Hosted React Native content is laid
 *   out by Yoga, which cannot see the floating sheet's width, so it wraps against
 *   a guess. SwiftUI text wraps to the width the sheet actually offers, and the
 *   sheet fits to the height that produces.
 * - **The sheet keeps the system glass, tinted.** A translucent
 *   `presentationBackground` tints the glass; an opaque one replaces it with a
 *   flat sheet. The tint is the card colour at `GLASS_TINT`, which makes the
 *   default reading surface more solid while the glass beneath still follows the
 *   reader's Liquid Glass setting. The text uses the hierarchical styles, which
 *   are drawn for glass.
 *
 * Nunito still, through `swiftUIFont`, scaled by Dynamic Type against the text
 * style each role corresponds to.
 */

import { BottomSheet, Group, Host, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  font,
  foregroundStyle,
  frame,
  kerning,
  lineSpacing,
  padding,
  preferredColorScheme,
  presentationBackground,
  presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers';
import { useWindowDimensions } from 'react-native';
import { space } from '../layout';
import { useTheme } from '../theme';
import { swiftUIFont } from '../typography';
import type { NativeSheetProps } from './NativeSheet';

const TITLE = swiftUIFont('cardTitle');
const BODY = swiftUIFont('body');

/**
 * How much of the card colour lies over the glass: enough to steady a paragraph
 * of text, little enough that the glass's own translucency still shows. At 1 the
 * glass is gone and the reader's Liquid Glass setting changes nothing.
 */
const GLASS_TINT = 0.5;
const GLASS_TINT_HEX = Math.round(GLASS_TINT * 255)
  .toString(16)
  .padStart(2, '0');

/** Clears the drag indicator, which the sheet draws over the top of its content. */
const BELOW_INDICATOR = space.loose + space.snug;

export function NativeSheet({ visible, onClose, title, body }: NativeSheetProps) {
  const { colour, scheme } = useTheme();
  const { width } = useWindowDimensions();

  return (
    // Out of the layout: the sheet is presented in a window of its own, and the
    // host is only where it attaches.
    <Host style={{ position: 'absolute', width }} pointerEvents="none">
      <BottomSheet
        isPresented={visible}
        onIsPresentedChange={(presented) => {
          if (!presented) onClose();
        }}
        fitToContents
      >
        <Group
          modifiers={[
            presentationDragIndicator('visible'),
            presentationBackground(`${colour.card}${GLASS_TINT_HEX}`),
            // The app's own light or dark, which can differ from the device's.
            preferredColorScheme(scheme),
          ]}
        >
          <VStack
            alignment="leading"
            spacing={space.tight}
            modifiers={[
              // A flexible frame fills the width offered and no more, so a short
              // note still starts at the leading edge rather than centring.
              frame({ maxWidth: width, alignment: 'leading' }),
              padding({ horizontal: space.cardH, top: BELOW_INDICATOR, bottom: space.cardH }),
            ]}
          >
            <Text
              modifiers={[
                font({ family: TITLE.family, size: TITLE.size, textStyle: 'headline' }),
                kerning(TITLE.kerning),
                foregroundStyle({ type: 'hierarchical', style: 'primary' }),
                accessibilityAddTraits(['isHeader']),
              ]}
            >
              {title}
            </Text>
            <Text
              modifiers={[
                font({ family: BODY.family, size: BODY.size, textStyle: 'body' }),
                lineSpacing(BODY.lineSpacing),
                foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
              ]}
            >
              {body}
            </Text>
          </VStack>
        </Group>
      </BottomSheet>
    </Host>
  );
}
