/**
 * The dose screen's own chrome: wordmark left, settings right.
 *
 * Settings used to sit at the bottom-right of the dose screen, sharing the footer
 * with the rounding line. That put two unrelated things in one slot — the footer
 * is contextual status about *this* brew, and settings is global configuration —
 * and it made them compete with Details for the same corner.
 *
 * Splitting them gives the app a rule it did not have: **top-right is app chrome,
 * bottom-right acts on this brew.** Every overlay screen already puts its action
 * top-right, so the dose screen was the odd one out rather than the precedent.
 *
 * The wordmark is here to give the glyph something to be opposite. It is
 * deliberately quiet — the smallest label role in secondary tone — because the
 * screen's subject is the recipe card immediately beneath it, and an app that
 * announces its own name louder than the thing you opened it for has its priorities
 * backwards.
 */

import { View } from 'react-native';
import { CardLabel, SettingsIcon, Touchable, space } from '@/design';

const GLYPH = 18;

/**
 * Expands the glyph to a 44pt target without moving it or the row.
 *
 * `SettingsIcon` draws two tracks 18pt wide and about 14.5pt tall, so the target
 * needs ~15pt on every side. Padding the button out instead would either push the
 * glyph inboard of the screen's content edge — losing the alignment with the cards
 * below — or make the row three times the height the design calls slim.
 * `hitSlop` is the property for exactly this: touch area without layout.
 */
const HIT_SLOP = 15;

export type AppHeaderProps = { onOpenSettings: () => void };

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: space.tight,
      }}
    >
      {/* Decorative: a screen reader already announces the app by name on launch,
          so reading it again at the top of the only screen is noise. */}
      <CardLabel tone="secondary" accessibilityElementsHidden importantForAccessibility="no">
        Lympha
      </CardLabel>
      <Touchable
        borderless
        onPress={onOpenSettings}
        hitSlop={HIT_SLOP}
        accessibilityLabel="Settings"
      >
        <SettingsIcon size={GLYPH} />
      </Touchable>
    </View>
  );
}
