/**
 * An ⓘ that opens a short note, and closes on any tap.
 *
 * The note is drawn in a transparent `Modal` rather than beside its trigger.
 * Triggers sit inside cards, and a card clips to its rounded corners, so a note
 * drawn in place would be cut off at the card's edge. The modal covers the whole
 * window, which makes the trigger's `measureInWindow` position the note's own
 * coordinate space. On Android that holds only with both translucency flags set:
 * without them the modal's window starts below the status bar, and every
 * position is off by its height.
 */

import { useRef, useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { space } from '../layout';
import { Body, CardTitle } from '../text';
import { cardShadow, useTheme } from '../theme';
import { Icon } from './Icon';
import { Touchable } from './Touchable';

/** Matches the settings glyph's treatment: chrome, so bold and muted. */
const GLYPH = 20;

/** Clears 44pt around the 20pt glyph without moving it. */
const HIT_SLOP = 12;

/** Narrow enough to read as a note on the card rather than a second card. */
const MAX_WIDTH = 280;

const GAP_BELOW_TRIGGER = 8;
const RADIUS = 16;

export type InfoTipProps = {
  title: string;
  body: string;
  accessibilityLabel: string;
  accessibilityHint: string;
};

type Anchor = { right: number; bottom: number };

export function InfoTip({ title, body, accessibilityLabel, accessibilityHint }: InfoTipProps) {
  const { colour } = useTheme();
  const window = useWindowDimensions();
  const trigger = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const open = () =>
    trigger.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ right: x + width, bottom: y + height }),
    );
  const close = () => setAnchor(null);

  const width = Math.min(MAX_WIDTH, window.width - space.screenH * 2);
  // Right-aligned to the glyph, which sits at a card's top-right corner, and kept
  // inside the screen's content edges either way.
  const left = anchor
    ? Math.min(Math.max(space.screenH, anchor.right - width), window.width - space.screenH - width)
    : 0;

  return (
    <>
      <View ref={trigger} collapsable={false}>
        <Touchable
          borderless
          onPress={open}
          hitSlop={HIT_SLOP}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
        >
          <Icon name="info" size={GLYPH} colour={colour.textSecondary} />
        </Touchable>
      </View>

      <Modal
        visible={anchor !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={close}
      >
        {/* The whole window is the dismiss target, note included: there is
            nothing to do inside it but read. */}
        <Pressable
          style={{ flex: 1 }}
          onPress={close}
          accessibilityViewIsModal
          onAccessibilityEscape={close}
          accessibilityRole="text"
          accessibilityLabel={`${title}. ${body}`}
        >
          {anchor ? (
            <View
              style={[
                {
                  position: 'absolute',
                  top: anchor.bottom + GAP_BELOW_TRIGGER,
                  left,
                  width,
                  borderRadius: RADIUS,
                  backgroundColor: colour.card,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                },
                cardShadow,
              ]}
            >
              <CardTitle>{title}</CardTitle>
              <Body tone="onCard" style={{ marginTop: 4 }}>
                {body}
              </Body>
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}
