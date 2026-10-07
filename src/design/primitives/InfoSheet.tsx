/**
 * An ⓘ that opens a short note in a bottom sheet.
 *
 * A sheet rather than a popover beside the glyph: it is the platform's own shape
 * for a note on demand, it dismisses with the gestures each platform already
 * teaches, and its text has the screen's full width to reflow into at large type
 * sizes.
 */

import { useState } from 'react';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { NativeSheet } from './NativeSheet';
import { Touchable } from './Touchable';

/** Matches the settings glyph's treatment: chrome, so bold and muted. */
const GLYPH = 20;

/** Clears 44pt around the 20pt glyph without moving it. */
const HIT_SLOP = 12;

export type InfoSheetProps = {
  title: string;
  body: string;
  accessibilityLabel: string;
  accessibilityHint: string;
};

export function InfoSheet({ title, body, accessibilityLabel, accessibilityHint }: InfoSheetProps) {
  const { colour } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Touchable
        borderless
        onPress={() => setOpen(true)}
        hitSlop={HIT_SLOP}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <Icon name="info" size={GLYPH} colour={colour.textSecondary} />
      </Touchable>

      <NativeSheet visible={open} onClose={() => setOpen(false)} title={title} body={body} />
    </>
  );
}
