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
 * The wordmark is set in Figtree, and is the only thing in the app that is. A
 * second family is a cost — another face to load, another set of metrics to keep —
 * and it is worth paying exactly here: the mark is a picture of the app's name
 * rather than a piece of its content, and setting it apart is what stops the header
 * reading as the top of the page. It stays in the secondary tone, so it is present
 * without competing with the recipe card immediately beneath it.
 */

import { Icon, Touchable, Wordmark, space, useTheme } from '@/design';
import { View } from 'react-native';

/**
 * A gear, not sliders.
 *
 * The sliders this replaces promised "adjust values", and the screen behind it is
 * preferences — appearance, units, defaults. The gear is the honest signal, and
 * its rounder silhouette sits better with the type than two straight tracks did.
 *
 * It stays in the secondary tone, like the wordmark opposite it: the pair is
 * chrome, and neither half should out-shout the recipe card beneath them.
 */
const GLYPH = 24;

/**
 * Expands the glyph to a 44pt target without moving it or the row.
 *
 * The glyph is 24pt square, so the target needs 10pt on every side. Padding the
 * button out instead would either push the glyph inboard of the screen's content
 * edge — losing the alignment with the cards below — or make the row three times
 * the height the design calls slim. `hitSlop` is the property for exactly this:
 * touch area without layout.
 */
const HIT_SLOP = 10;

export type AppHeaderProps = { onOpenSettings: () => void };

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  const { colour } = useTheme();

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
      <Wordmark tone="primary" accessibilityElementsHidden importantForAccessibility="no">
        Lympha
      </Wordmark>
      <Touchable
        borderless
        onPress={onOpenSettings}
        hitSlop={HIT_SLOP}
        accessibilityLabel="Settings"
      >
        <Icon name="settings" size={GLYPH} colour={colour.textSecondary} />
      </Touchable>
    </View>
  );
}
